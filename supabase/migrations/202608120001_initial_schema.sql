begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.account_status as enum ('pending_activation','active','suspended','disabled','locked');
create type public.access_request_status as enum ('pending','approved','rejected','cancelled');
create type public.reading_type as enum ('raw_water','distribution');
create type public.reading_status as enum ('active','cancellation_requested','cancelled');
create type public.audit_action as enum ('created','edited','cancellation_requested','cancellation_approved','cancellation_rejected','cancelled','restored');
create type public.data_source as enum ('manual','api','sensor','import');

create table public.stations (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 name_th text not null,
 branch_name text not null,
 timezone text not null default 'Asia/Bangkok',
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.roles (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 name_th text not null,
 description text,
 is_system boolean not null default true,
 created_at timestamptz not null default now()
);

create table public.permissions (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 description text not null
);

create table public.role_permissions (
 role_id uuid not null references public.roles(id) on delete cascade,
 permission_id uuid not null references public.permissions(id) on delete cascade,
 primary key (role_id,permission_id)
);

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 employee_id text not null unique,
 full_name text not null,
 position text not null,
 phone text not null check (phone ~ '^0[0-9]{8,9}$'),
 email citext not null unique,
 account_status public.account_status not null default 'pending_activation',
 must_change_password boolean not null default true,
 last_login_at timestamptz,
 approved_by uuid references public.profiles(id),
 approved_at timestamptz,
 suspended_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.user_station_roles (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete restrict,
 station_id uuid not null references public.stations(id) on delete restrict,
 role_id uuid not null references public.roles(id) on delete restrict,
 effective_from date not null default current_date,
 effective_to date,
 assigned_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 check (effective_to is null or effective_to >= effective_from)
);
create unique index user_station_roles_active_unique on public.user_station_roles(user_id,station_id,role_id) where effective_to is null;

create table public.access_requests (
 id uuid primary key default gen_random_uuid(),
 request_no text not null unique,
 employee_id text not null,
 full_name text not null,
 position text not null,
 phone text not null check (phone ~ '^0[0-9]{8,9}$'),
 email citext not null,
 consent_accepted_at timestamptz not null default now(),
 status public.access_request_status not null default 'pending',
 requested_station_id uuid references public.stations(id),
 assigned_role_id uuid references public.roles(id),
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 rejection_reason text,
 auth_user_id uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status <> 'rejected' or length(trim(rejection_reason)) >= 5)
);
create unique index access_requests_employee_open_unique on public.access_requests(employee_id) where status in ('pending','approved');
create unique index access_requests_email_open_unique on public.access_requests(lower(email::text)) where status in ('pending','approved');

create table public.meter_groups (
 id uuid primary key default gen_random_uuid(),
 station_id uuid not null references public.stations(id) on delete restrict,
 code text not null,
 name_th text not null,
 reading_type public.reading_type not null,
 schedule_config jsonb not null,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(station_id,code)
);

create table public.meters (
 id uuid primary key default gen_random_uuid(),
 meter_group_id uuid not null references public.meter_groups(id) on delete restrict,
 code text not null,
 name_th text not null,
 sort_order smallint not null,
 unit text not null default 'm3',
 register_digits smallint,
 rollover_value bigint,
 installed_at timestamptz,
 retired_at timestamptz,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(meter_group_id,code),
 check (rollover_value is null or rollover_value > 0)
);

create table public.shifts (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 name_th text not null,
 start_time time not null,
 end_time time not null,
 crosses_midnight boolean not null default false,
 sort_order smallint not null unique
);

create table public.reading_sessions (
 id uuid primary key default gen_random_uuid(),
 station_id uuid not null references public.stations(id) on delete restrict,
 meter_group_id uuid not null references public.meter_groups(id) on delete restrict,
 reading_date date not null,
 reading_time time not null,
 observed_at timestamptz not null,
 shift_id uuid references public.shifts(id),
 shift_business_date date,
 status public.reading_status not null default 'active',
 source public.data_source not null default 'manual',
 source_ref text,
 recorded_by uuid not null references public.profiles(id) on delete restrict,
 recorded_at timestamptz not null default now(),
 updated_by uuid references public.profiles(id),
 updated_at timestamptz not null default now(),
 cancellation_reason text,
 cancelled_by uuid references public.profiles(id),
 cancelled_at timestamptz,
 restored_by uuid references public.profiles(id),
 restored_at timestamptz,
 lock_version integer not null default 1 check (lock_version > 0)
);
create unique index reading_sessions_unique_active_slot on public.reading_sessions(station_id,meter_group_id,reading_date,reading_time) where status <> 'cancelled';
create index reading_sessions_active_report_idx on public.reading_sessions(station_id,meter_group_id,reading_date,reading_time) where status='active';

create table public.meter_readings (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.reading_sessions(id) on delete restrict,
 meter_id uuid not null references public.meters(id) on delete restrict,
 reading_value bigint not null check (reading_value >= 0),
 previous_reading_id uuid references public.meter_readings(id) on delete restrict,
 previous_value bigint check (previous_value >= 0),
 difference_value bigint check (difference_value >= 0),
 quality_status text not null default 'valid' check (quality_status in ('valid','review_required','missing_previous')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(session_id,meter_id)
);
create index meter_readings_meter_session_idx on public.meter_readings(meter_id,session_id);

create table public.reading_audit_logs (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.reading_sessions(id) on delete restrict,
 action public.audit_action not null,
 actor_id uuid not null references public.profiles(id) on delete restrict,
 reason text,
 before_data jsonb,
 after_data jsonb,
 request_id uuid not null default gen_random_uuid(),
 ip_address inet,
 user_agent text,
 created_at timestamptz not null default now()
);
create index audit_session_created_idx on public.reading_audit_logs(session_id,created_at desc);

create table public.cancellation_requests (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.reading_sessions(id) on delete restrict,
 requested_by uuid not null references public.profiles(id) on delete restrict,
 reason text not null check (length(trim(reason)) >= 5),
 status public.access_request_status not null default 'pending',
 reviewed_by uuid references public.profiles(id),
 review_reason text,
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create unique index cancellation_requests_one_pending on public.cancellation_requests(session_id) where status='pending';

create table public.report_targets (
 id uuid primary key default gen_random_uuid(),
 station_id uuid not null references public.stations(id) on delete restrict,
 metric_code text not null,
 target_operator text not null check (target_operator in ('lt','lte','eq','gte','gt')),
 target_value numeric(8,3) not null,
 effective_from date not null,
 effective_to date,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 check (effective_to is null or effective_to >= effective_from)
);

create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger stations_updated before update on public.stations for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger access_requests_updated before update on public.access_requests for each row execute function public.set_updated_at();
create trigger groups_updated before update on public.meter_groups for each row execute function public.set_updated_at();
create trigger meters_updated before update on public.meters for each row execute function public.set_updated_at();

create function public.is_active_user() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and account_status='active');
$$;

create function public.has_station_permission(p_station_id uuid,p_permission text) returns boolean language sql stable security definer set search_path=public as $$
 select exists(
  select 1 from public.user_station_roles usr
  join public.role_permissions rp on rp.role_id=usr.role_id
  join public.permissions p on p.id=rp.permission_id
  where usr.user_id=auth.uid() and usr.station_id=p_station_id and p.code=p_permission
    and usr.effective_from<=current_date and (usr.effective_to is null or usr.effective_to>=current_date)
 ) and public.is_active_user();
$$;

create function public.submit_access_request(p_employee_id text,p_full_name text,p_position text,p_phone text,p_email text,p_request_no text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if length(trim(p_employee_id))<3 or length(trim(p_full_name))<5 or p_phone !~ '^0[0-9]{8,9}$' or p_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid request data'; end if;
 insert into public.access_requests(request_no,employee_id,full_name,position,phone,email)
 values(trim(p_request_no),trim(p_employee_id),trim(p_full_name),trim(p_position),trim(p_phone),lower(trim(p_email))) returning id into v_id;
 return v_id;
end $$;
grant execute on function public.submit_access_request(text,text,text,text,text,text) to anon,authenticated;

create view public.reading_session_details with (security_invoker=true) as
select s.id session_id,s.station_id,s.reading_date,s.reading_time,s.observed_at,s.status,s.recorded_at,
 g.reading_type,m.code meter_code,r.reading_value,r.previous_value,r.difference_value,p.full_name recorded_by_name
from public.reading_sessions s join public.meter_groups g on g.id=s.meter_group_id
join public.meter_readings r on r.session_id=s.id join public.meters m on m.id=r.meter_id
join public.profiles p on p.id=s.recorded_by;

alter table public.stations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_station_roles enable row level security;
alter table public.access_requests enable row level security;
alter table public.meter_groups enable row level security;
alter table public.meters enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.meter_readings enable row level security;
alter table public.reading_audit_logs enable row level security;
alter table public.cancellation_requests enable row level security;
alter table public.report_targets enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id=auth.uid() or public.is_active_user());
create policy stations_authenticated_read on public.stations for select to authenticated using (public.is_active_user());
create policy groups_authenticated_read on public.meter_groups for select to authenticated using (public.has_station_permission(station_id,'reading.read'));
create policy sessions_station_read on public.reading_sessions for select to authenticated using (public.has_station_permission(station_id,'reading.read'));
create policy sessions_station_insert on public.reading_sessions for insert to authenticated with check (recorded_by=auth.uid() and public.has_station_permission(station_id,'reading.create'));
create policy readings_visible_session on public.meter_readings for select to authenticated using (exists(select 1 from public.reading_sessions s where s.id=session_id and public.has_station_permission(s.station_id,'reading.read')));
create policy audit_visible_session on public.reading_audit_logs for select to authenticated using (exists(select 1 from public.reading_sessions s where s.id=session_id and public.has_station_permission(s.station_id,'reading.read')));

insert into public.roles(code,name_th) values ('admin','ผู้ดูแลระบบ'),('manager','ผู้บริหาร / หัวหน้างาน'),('supervisor','หัวหน้าชุด / หัวหน้าประจำสถานี'),('operator','ผู้ปฏิบัติงาน'),('viewer','ผู้ตรวจสอบ');
insert into public.permissions(code,description) values ('dashboard.read','ดูภาพรวม'),('reading.create','สร้างข้อมูลมาตร'),('reading.read','ดูข้อมูลมาตร'),('reading.edit_own_shift','แก้ข้อมูลตนเองก่อนปิดกะ'),('reading.edit_station','แก้ข้อมูลสถานี'),('reading.request_cancel','ขอยกเลิก'),('reading.cancel_station','อนุมัติยกเลิก'),('reading.restore','กู้คืน'),('report.read','ดูรายงาน'),('user.review_request','ตรวจคำขอ'),('user.manage','จัดการผู้ใช้'),('system.manage','ตั้งค่าระบบ');
insert into public.shifts(code,name_th,start_time,end_time,crosses_midnight,sort_order) values ('SHIFT_1','กะที่ 1','06:00','14:00',false,1),('SHIFT_2','กะที่ 2','14:00','22:00',false,2),('SHIFT_3','กะที่ 3','22:00','06:00',true,3);

commit;
