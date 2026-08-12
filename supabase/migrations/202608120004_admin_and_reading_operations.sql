begin;

create or replace function public.get_admin_access_requests()
returns setof public.access_requests
language sql stable security definer set search_path=public as $$
  select ar.* from public.access_requests ar
  where exists (
    select 1 from public.user_station_roles usr
    join public.roles r on r.id=usr.role_id
    where usr.user_id=auth.uid() and r.code='admin' and usr.effective_to is null
  ) order by ar.created_at desc;
$$;

create or replace function public.get_admin_users()
returns table(full_name text,position_name text,role_code text,account_status public.account_status,station_code text)
language sql stable security definer set search_path=public as $$
  select p.full_name,p.position,r.code,p.account_status,s.code
  from public.profiles p
  join public.user_station_roles usr on usr.user_id=p.id and usr.effective_to is null
  join public.roles r on r.id=usr.role_id
  join public.stations s on s.id=usr.station_id
  where exists (
    select 1 from public.user_station_roles me join public.roles mr on mr.id=me.role_id
    where me.user_id=auth.uid() and mr.code='admin' and me.effective_to is null
  ) order by p.full_name;
$$;

create or replace function public.review_access_request(
  p_request_id uuid,p_station_id uuid,p_role_code text,p_approve boolean,p_reason text default null
) returns void language plpgsql security definer set search_path=public as $$
declare v_request public.access_requests;v_user_id uuid;v_role_id uuid;
begin
 if not exists(select 1 from public.user_station_roles usr join public.roles r on r.id=usr.role_id where usr.user_id=auth.uid() and r.code='admin' and usr.effective_to is null) then raise exception 'permission denied'; end if;
 select * into v_request from public.access_requests where id=p_request_id and status='pending' for update;
 if v_request.id is null then raise exception 'request not found'; end if;
 if not p_approve then
  update public.access_requests set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),rejection_reason=coalesce(nullif(trim(p_reason),''),'ไม่ผ่านการอนุมัติ') where id=p_request_id;
  return;
 end if;
 select id into v_user_id from auth.users where lower(email)=lower(v_request.email::text) limit 1;
 if v_user_id is null then raise exception 'ผู้ใช้ต้องสมัครบัญชี Authentication ด้วยอีเมลนี้ก่อนอนุมัติ'; end if;
 select id into v_role_id from public.roles where code=p_role_code;
 if v_role_id is null then raise exception 'invalid role'; end if;
 insert into public.profiles(id,employee_id,full_name,position,phone,email,account_status,approved_by,approved_at)
 values(v_user_id,v_request.employee_id,v_request.full_name,v_request.position,v_request.phone,v_request.email,'active',auth.uid(),now())
 on conflict(id) do update set employee_id=excluded.employee_id,full_name=excluded.full_name,position=excluded.position,phone=excluded.phone,email=excluded.email,account_status='active',approved_by=auth.uid(),approved_at=now();
 insert into public.user_station_roles(user_id,station_id,role_id,assigned_by) values(v_user_id,p_station_id,v_role_id,auth.uid()) on conflict do nothing;
 update public.access_requests set status='approved',assigned_role_id=v_role_id,reviewed_by=auth.uid(),reviewed_at=now() where id=p_request_id;
end $$;

revoke all on function public.get_admin_access_requests() from public;
revoke all on function public.get_admin_users() from public;
revoke all on function public.review_access_request(uuid,uuid,text,boolean,text) from public;
grant execute on function public.get_admin_access_requests(),public.get_admin_users(),public.review_access_request(uuid,uuid,text,boolean,text) to authenticated;

create or replace function public.change_reading_session(p_session_id uuid,p_action text,p_values jsonb default null,p_reason text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_session public.reading_sessions;v_meter record;v_value bigint;
begin
 select * into v_session from public.reading_sessions where id=p_session_id for update;
 if v_session.id is null then raise exception 'reading not found'; end if;
 if length(trim(coalesce(p_reason,'')))<5 then raise exception 'reason is required'; end if;
 if p_action='edit' then
  if not (public.has_station_permission(v_session.station_id,'reading.edit_station') or (v_session.recorded_by=auth.uid() and public.has_station_permission(v_session.station_id,'reading.edit_own_shift'))) then raise exception 'permission denied'; end if;
  for v_meter in select mr.id,m.code from public.meter_readings mr join public.meters m on m.id=mr.meter_id where mr.session_id=p_session_id loop
   v_value:=case v_meter.code when 'RAW_1' then (p_values->>'raw1')::bigint when 'RAW_2' then (p_values->>'raw2')::bigint else (p_values->>lower(v_meter.code))::bigint end;
   if v_value is null or v_value<0 then raise exception 'invalid value'; end if;
   update public.meter_readings set reading_value=v_value,difference_value=case when previous_value is null then null else v_value-previous_value end where id=v_meter.id;
  end loop;
  if exists(select 1 from public.meter_readings where session_id=p_session_id and difference_value<0) then raise exception 'difference cannot be negative'; end if;
  update public.reading_sessions set updated_by=auth.uid(),lock_version=lock_version+1 where id=p_session_id;
  insert into public.reading_audit_logs(session_id,action,actor_id,reason,after_data) values(p_session_id,'edited',auth.uid(),trim(p_reason),p_values);
 elsif p_action='cancel' then
  if public.has_station_permission(v_session.station_id,'reading.cancel_station') then
   update public.reading_sessions set status='cancelled',cancellation_reason=trim(p_reason),cancelled_by=auth.uid(),cancelled_at=now() where id=p_session_id;
   insert into public.reading_audit_logs(session_id,action,actor_id,reason) values(p_session_id,'cancelled',auth.uid(),trim(p_reason));
  elsif public.has_station_permission(v_session.station_id,'reading.request_cancel') then
   insert into public.cancellation_requests(session_id,requested_by,reason) values(p_session_id,auth.uid(),trim(p_reason));
   update public.reading_sessions set status='cancellation_requested' where id=p_session_id;
   insert into public.reading_audit_logs(session_id,action,actor_id,reason) values(p_session_id,'cancellation_requested',auth.uid(),trim(p_reason));
  else raise exception 'permission denied'; end if;
 elsif p_action='restore' then
  if not public.has_station_permission(v_session.station_id,'reading.restore') then raise exception 'permission denied'; end if;
  update public.reading_sessions set status='active',restored_by=auth.uid(),restored_at=now() where id=p_session_id;
  insert into public.reading_audit_logs(session_id,action,actor_id,reason) values(p_session_id,'restored',auth.uid(),trim(p_reason));
 else raise exception 'invalid action'; end if;
end $$;
revoke all on function public.change_reading_session(uuid,text,jsonb,text) from public;
grant execute on function public.change_reading_session(uuid,text,jsonb,text) to authenticated;

commit;
