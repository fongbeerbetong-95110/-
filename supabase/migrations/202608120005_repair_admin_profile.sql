begin;

update public.profiles
set
  full_name = 'นายอำนาจ ทัฬหกิจ',
  position = 'หัวหน้าผลิต',
  phone = '0806207154',
  updated_at = now()
where employee_id = '10420'
  and lower(email::text) = 'fongbeerbetong@gmail.com';

commit;
