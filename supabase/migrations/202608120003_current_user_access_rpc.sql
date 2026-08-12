begin;

create or replace function public.get_current_user_access()
returns table (
  user_id uuid,
  full_name text,
  account_status public.account_status,
  must_change_password boolean,
  role_code text,
  station_code text,
  station_name_th text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.account_status, p.must_change_password,
         r.code, s.code, s.name_th
  from public.profiles p
  join public.user_station_roles usr on usr.user_id = p.id
  join public.roles r on r.id = usr.role_id
  join public.stations s on s.id = usr.station_id
  where (
      p.id = auth.uid()
      or lower(p.email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    and p.account_status = 'active'::public.account_status
    and usr.effective_from <= current_date
    and (usr.effective_to is null or usr.effective_to >= current_date)
  order by case r.code
    when 'admin' then 1 when 'manager' then 2 when 'supervisor' then 3
    when 'operator' then 4 when 'viewer' then 5 else 99 end, s.code
  limit 1;
$$;

revoke all on function public.get_current_user_access() from public;
grant execute on function public.get_current_user_access() to authenticated;

commit;
