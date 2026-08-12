begin;

insert into public.stations(code,name_th,branch_name)
values ('SKL-MAIN','แม่ข่ายสุไหงโก-ลก','กปภ.สาขาสุไหงโก-ลก')
on conflict (code) do nothing;

with station as (select id from public.stations where code='SKL-MAIN')
insert into public.meter_groups(station_id,code,name_th,reading_type,schedule_config)
select id,'RAW_WATER','มาตรน้ำดิบ','raw_water'::public.reading_type,'{"mode":"fixed_times","times":["00:00","06:00","14:00","22:00"]}'::jsonb from station
union all
select id,'DISTRIBUTION','มาตรหลักทางจ่าย','distribution'::public.reading_type,'{"mode":"hourly","minute":0}'::jsonb from station
on conflict (station_id,code) do nothing;

insert into public.meters(meter_group_id,code,name_th,sort_order)
select g.id,v.code,v.name_th,v.sort_order from public.meter_groups g
join (values ('RAW_1','มาตรน้ำดิบ 1',1),('RAW_2','มาตรน้ำดิบ 2',2)) v(code,name_th,sort_order) on true
where g.code='RAW_WATER' on conflict (meter_group_id,code) do nothing;

insert into public.meters(meter_group_id,code,name_th,sort_order)
select g.id,v.code,v.name_th,v.sort_order from public.meter_groups g
join (values ('HIGH','มาตรหลักโซนสูง',1),('LOW','มาตรหลักโซนต่ำ',2),('WAENG','มาตรหลักแว้ง',3)) v(code,name_th,sort_order) on true
where g.code='DISTRIBUTION' on conflict (meter_group_id,code) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.code='admin'
or (r.code='manager' and p.code in ('dashboard.read','reading.read','report.read'))
or (r.code='supervisor' and p.code in ('dashboard.read','reading.create','reading.read','reading.edit_station','reading.request_cancel','reading.cancel_station','report.read'))
or (r.code='operator' and p.code in ('dashboard.read','reading.create','reading.read','reading.edit_own_shift','reading.request_cancel','report.read'))
or (r.code='viewer' and p.code in ('dashboard.read','reading.read','report.read'))
on conflict do nothing;

insert into public.report_targets(station_id,metric_code,target_operator,target_value,effective_from)
select id,'PRODUCTION_LOSS_PERCENT','lte',5.000,date '2026-01-01' from public.stations where code='SKL-MAIN';

create policy meters_authenticated_read on public.meters for select to authenticated
using (exists(select 1 from public.meter_groups g where g.id=meter_group_id and public.has_station_permission(g.station_id,'reading.read')));
create policy targets_authenticated_read on public.report_targets for select to authenticated
using (public.has_station_permission(station_id,'report.read'));
create policy access_requests_admin_read on public.access_requests for select to authenticated
using (exists(select 1 from public.user_station_roles u join public.roles r on r.id=u.role_id where u.user_id=auth.uid() and r.code='admin' and u.effective_to is null));
create policy user_roles_self_read on public.user_station_roles for select to authenticated
using (user_id=auth.uid() or public.has_station_permission(station_id,'user.manage'));

create or replace function public.create_reading_session(
 p_station_id uuid,p_meter_group_id uuid,p_reading_date date,p_reading_time time,p_values jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_session_id uuid:=gen_random_uuid();v_meter record;v_value bigint;v_previous record;v_expected int;v_supplied int;v_observed timestamptz;
begin
 if not public.has_station_permission(p_station_id,'reading.create') then raise exception 'permission denied'; end if;
 if not exists(select 1 from public.meter_groups where id=p_meter_group_id and station_id=p_station_id and is_active) then raise exception 'invalid meter group'; end if;
 select count(*) into v_expected from public.meters where meter_group_id=p_meter_group_id and is_active;
 select count(*) into v_supplied from jsonb_object_keys(p_values);
 if v_supplied<>v_expected then raise exception 'all meter values are required'; end if;
 v_observed:=(p_reading_date+p_reading_time) at time zone 'Asia/Bangkok';
 insert into public.reading_sessions(id,station_id,meter_group_id,reading_date,reading_time,observed_at,recorded_by)
 values(v_session_id,p_station_id,p_meter_group_id,p_reading_date,p_reading_time,v_observed,auth.uid());
 for v_meter in select * from public.meters where meter_group_id=p_meter_group_id and is_active order by sort_order loop
  v_value:=case v_meter.code when 'RAW_1' then (p_values->>'raw1')::bigint when 'RAW_2' then (p_values->>'raw2')::bigint else (p_values->>lower(v_meter.code))::bigint end;
  if v_value is null or v_value<0 then raise exception 'invalid value for meter %',v_meter.code; end if;
  select mr.id,mr.reading_value into v_previous from public.meter_readings mr join public.reading_sessions rs on rs.id=mr.session_id
  where mr.meter_id=v_meter.id and rs.status='active' and rs.observed_at<v_observed order by rs.observed_at desc limit 1 for update of mr;
  if v_previous.id is not null and v_value<v_previous.reading_value then raise exception 'meter value cannot be lower than previous value'; end if;
  insert into public.meter_readings(session_id,meter_id,reading_value,previous_reading_id,previous_value,difference_value,quality_status)
  values(v_session_id,v_meter.id,v_value,v_previous.id,v_previous.reading_value,case when v_previous.id is null then null else v_value-v_previous.reading_value end,case when v_previous.id is null then 'missing_previous' else 'valid' end);
 end loop;
 insert into public.reading_audit_logs(session_id,action,actor_id,after_data) values(v_session_id,'created',auth.uid(),jsonb_build_object('values',p_values));
 return v_session_id;
end $$;
grant execute on function public.create_reading_session(uuid,uuid,date,time,jsonb) to authenticated;

commit;
