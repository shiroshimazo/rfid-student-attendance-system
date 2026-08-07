-- Provision one teacher profile and one student profile for existing Supabase
-- Auth users. Run this in Supabase SQL Editor after creating both login-capable
-- users through Authentication > Users > Add user.
--
-- Supabase Auth owns passwords and login identities. Do not insert password rows
-- directly into auth.users; edit values below, create Auth users first, then run.

begin;

do $provision$
declare
  -- Edit these values before running.
  v_teacher_email constant text := 'teacher@example.test';
  v_teacher_first_name constant text := 'Teresa';
  v_teacher_middle_name constant text := null;
  v_teacher_last_name constant text := 'Reyes';
  v_teacher_section_code constant text := 'BSIT-SEC-01';

  v_student_email constant text := 'student@example.test';
  v_student_number constant text := 'BSIT-2026-0001';

  v_teacher_user_id uuid;
  v_student_user_id uuid;
  v_student_id uuid;
  v_student_profile_id uuid;
  v_student_first_name text;
  v_student_middle_name text;
  v_student_last_name text;
  v_section_id uuid;
  v_semester_id uuid;
  v_existing_role public.app_role;
begin
  select u.id
  into v_teacher_user_id
  from auth.users as u
  where lower(u.email) = lower(v_teacher_email)
    and u.deleted_at is null;

  if v_teacher_user_id is null then
    raise exception
      'Teacher Auth user % not found. Create it in Authentication > Users first.',
      v_teacher_email;
  end if;

  select u.id
  into v_student_user_id
  from auth.users as u
  where lower(u.email) = lower(v_student_email)
    and u.deleted_at is null;

  if v_student_user_id is null then
    raise exception
      'Student Auth user % not found. Create it in Authentication > Users first.',
      v_student_email;
  end if;

  if v_teacher_user_id = v_student_user_id then
    raise exception 'Teacher and student must use different Auth users.';
  end if;

  select
    s.id,
    s."profileId",
    s."firstName",
    s."middleName",
    s."lastName"
  into
    v_student_id,
    v_student_profile_id,
    v_student_first_name,
    v_student_middle_name,
    v_student_last_name
  from public.students as s
  where s."studentNumber" = upper(btrim(v_student_number));

  if v_student_id is null then
    raise exception 'Student record % not found.', v_student_number;
  end if;

  if v_student_profile_id is not null
     and v_student_profile_id <> v_student_user_id then
    raise exception
      'Student % is already linked to Auth user %.',
      v_student_number,
      v_student_profile_id;
  end if;

  select sec.id
  into v_section_id
  from public.sections as sec
  where sec.code = upper(btrim(v_teacher_section_code))
    and sec."isActive";

  if v_section_id is null then
    raise exception 'Active section % not found.', v_teacher_section_code;
  end if;

  select sem.id
  into v_semester_id
  from public.semesters as sem
  where sem.status = 'ACTIVE';

  if v_semester_id is null then
    raise exception 'No active semester found.';
  end if;

  select p.role
  into v_existing_role
  from public.profiles as p
  where p.id = v_teacher_user_id;

  if v_existing_role is not null and v_existing_role <> 'TEACHER' then
    raise exception
      'Teacher Auth user already has % profile role.',
      v_existing_role;
  end if;

  insert into public.profiles (
    id,
    role,
    "firstName",
    "middleName",
    "lastName"
  )
  values (
    v_teacher_user_id,
    'TEACHER',
    v_teacher_first_name,
    v_teacher_middle_name,
    v_teacher_last_name
  )
  on conflict (id) do nothing;

  v_existing_role := null;

  select p.role
  into v_existing_role
  from public.profiles as p
  where p.id = v_student_user_id;

  if v_existing_role is not null and v_existing_role <> 'STUDENT' then
    raise exception
      'Student Auth user already has % profile role.',
      v_existing_role;
  end if;

  insert into public.profiles (
    id,
    role,
    "firstName",
    "middleName",
    "lastName"
  )
  values (
    v_student_user_id,
    'STUDENT',
    v_student_first_name,
    v_student_middle_name,
    v_student_last_name
  )
  on conflict (id) do nothing;

  if v_student_profile_id is null then
    update public.students
    set "profileId" = v_student_user_id
    where id = v_student_id;
  end if;

  insert into public.teacher_section_assignments (
    "teacherProfileId",
    "sectionId",
    "semesterId"
  )
  values (
    v_teacher_user_id,
    v_section_id,
    v_semester_id
  )
  on conflict ("teacherProfileId", "sectionId", "semesterId")
    where "revokedAt" is null
  do nothing;

  raise notice 'Teacher account ready: % (%)',
    v_teacher_email,
    v_teacher_user_id;
  raise notice 'Student account ready: % / % (%)',
    v_student_email,
    v_student_number,
    v_student_user_id;
end;
$provision$;

commit;
