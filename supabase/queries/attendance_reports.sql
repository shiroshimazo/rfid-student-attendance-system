-- DAILY REPORT
-- $1::date = report date
-- $2::uuid = semesterId
-- $3::uuid = optional sectionId; pass null for all RLS-visible sections
with daily as (
  select
    ar."studentId",
    ar."attendanceDate",
    min(ar."occurredAt") filter (where ar.direction = 'IN') as in_at,
    max(ar."occurredAt") filter (where ar.direction = 'OUT') as out_at
  from public.attendance_records ar
  where ar.status = 'VALID'
    and ar."attendanceDate" = $1::date
  group by ar."studentId", ar."attendanceDate"
)
select
  s."studentNumber",
  concat_ws(' ', s."firstName", s."middleName", s."lastName") as student_name,
  sec.code as section_code,
  d.in_at,
  d.out_at,
  case
    when d.in_at is not null and d.out_at is not null then 'COMPLETE'
    when d.in_at is not null then 'MISSING_OUT'
    else 'NO_SCAN'
  end as day_state
from public.student_section_enrollments e
join public.students s on s.id = e."studentId"
join public.sections sec on sec.id = e."sectionId"
join public.semesters sem on sem.id = e."semesterId"
cross join public.app_settings cfg
left join daily d on d."studentId" = e."studentId"
where e."semesterId" = $2::uuid
  and $1::date between sem."startsOn" and sem."endsOn"
  and $1::date >= (e."enrolledAt" at time zone cfg."institutionTimezone")::date
  and (
    e."endedAt" is null
    or $1::date <= (e."endedAt" at time zone cfg."institutionTimezone")::date
  )
  and ($3::uuid is null or e."sectionId" = $3::uuid)
order by sec.code, s."lastName", s."firstName";

-- WEEKLY REPORT
-- $1::date = week start, $2::date = week end, $3::uuid = semesterId,
-- $4::uuid = optional sectionId.
-- NO_SCAN_WEEKDAYS is not ABSENT. Accurate absence needs class schedule and holiday data.
with report_days as (
  select day::date as "attendanceDate"
  from generate_series($1::date, $2::date, interval '1 day') day
  where extract(isodow from day) between 1 and 5
),
daily as (
  select
    ar."studentId",
    ar."attendanceDate",
    bool_or(ar.direction = 'IN') as has_in,
    bool_or(ar.direction = 'OUT') as has_out
  from public.attendance_records ar
  where ar.status = 'VALID'
    and ar."attendanceDate" between $1::date and $2::date
  group by ar."studentId", ar."attendanceDate"
),
roster_days as (
  select e."studentId", e."sectionId", rd."attendanceDate"
  from public.student_section_enrollments e
  join public.semesters sem on sem.id = e."semesterId"
  cross join public.app_settings cfg
  cross join report_days rd
  where e."semesterId" = $3::uuid
    and rd."attendanceDate" between sem."startsOn" and sem."endsOn"
    and rd."attendanceDate" >= (e."enrolledAt" at time zone cfg."institutionTimezone")::date
    and (
      e."endedAt" is null
      or rd."attendanceDate" <= (e."endedAt" at time zone cfg."institutionTimezone")::date
    )
    and ($4::uuid is null or e."sectionId" = $4::uuid)
)
select
  s."studentNumber",
  concat_ws(' ', s."firstName", s."middleName", s."lastName") as student_name,
  sec.code as section_code,
  count(*) as expected_weekdays,
  count(*) filter (where d.has_in) as days_with_in,
  count(*) filter (where d.has_in and d.has_out) as complete_days,
  count(*) filter (where d.has_in and not d.has_out) as missing_out_days,
  count(*) filter (where d."studentId" is null) as no_scan_weekdays
from roster_days rd
join public.students s on s.id = rd."studentId"
join public.sections sec on sec.id = rd."sectionId"
left join daily d
  on d."studentId" = rd."studentId"
 and d."attendanceDate" = rd."attendanceDate"
group by s.id, s."studentNumber", s."firstName", s."middleName", s."lastName", sec.code
order by sec.code, s."lastName", s."firstName";

-- MONTHLY REPORT
-- $1::date = any date in month, $2::uuid = semesterId,
-- $3::uuid = optional sectionId.
-- NO_SCAN_WEEKDAYS is not ABSENT. Accurate absence needs class schedule and holiday data.
with bounds as (
  select
    date_trunc('month', $1::date)::date as month_start,
    (date_trunc('month', $1::date) + interval '1 month - 1 day')::date as month_end
),
report_days as (
  select day::date as "attendanceDate"
  from bounds b
  cross join lateral generate_series(b.month_start, b.month_end, interval '1 day') day
  where extract(isodow from day) between 1 and 5
),
daily as (
  select
    ar."studentId",
    ar."attendanceDate",
    bool_or(ar.direction = 'IN') as has_in,
    bool_or(ar.direction = 'OUT') as has_out,
    min(ar."occurredAt") filter (where ar.direction = 'IN') as in_at,
    max(ar."occurredAt") filter (where ar.direction = 'OUT') as out_at
  from public.attendance_records ar
  cross join bounds b
  where ar.status = 'VALID'
    and ar."attendanceDate" between b.month_start and b.month_end
  group by ar."studentId", ar."attendanceDate"
),
roster_days as (
  select e."studentId", e."sectionId", rd."attendanceDate"
  from public.student_section_enrollments e
  join public.semesters sem on sem.id = e."semesterId"
  cross join public.app_settings cfg
  cross join report_days rd
  where e."semesterId" = $2::uuid
    and rd."attendanceDate" between sem."startsOn" and sem."endsOn"
    and rd."attendanceDate" >= (e."enrolledAt" at time zone cfg."institutionTimezone")::date
    and (
      e."endedAt" is null
      or rd."attendanceDate" <= (e."endedAt" at time zone cfg."institutionTimezone")::date
    )
    and ($3::uuid is null or e."sectionId" = $3::uuid)
)
select
  s."studentNumber",
  concat_ws(' ', s."firstName", s."middleName", s."lastName") as student_name,
  sec.code as section_code,
  count(*) as expected_weekdays,
  count(*) filter (where d.has_in) as days_with_in,
  count(*) filter (where d.has_in and d.has_out) as complete_days,
  count(*) filter (where d.has_in and not d.has_out) as missing_out_days,
  count(*) filter (where d."studentId" is null) as no_scan_weekdays,
  min(d.in_at) as earliest_in,
  max(d.out_at) as latest_out
from roster_days rd
join public.students s on s.id = rd."studentId"
join public.sections sec on sec.id = rd."sectionId"
left join daily d
  on d."studentId" = rd."studentId"
 and d."attendanceDate" = rd."attendanceDate"
group by s.id, s."studentNumber", s."firstName", s."middleName", s."lastName", sec.code
order by sec.code, s."lastName", s."firstName";

-- SMS DELIVERY SUMMARY
-- $1::date = start date, $2::date = end date.
select
  n.status,
  count(*) as notification_count,
  sum(n."attemptCount") as total_attempts,
  count(*) filter (where n.status = 'SENT') as sent_count,
  count(*) filter (where n.status = 'FAILED') as terminal_failure_count
from public.sms_notifications n
where n."createdAt" >= $1::date
  and n."createdAt" < $2::date + interval '1 day'
group by n.status
order by n.status;
