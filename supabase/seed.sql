begin;

set constraints sections_exactly_five_active deferred;

-- Sample calendar for current project date. Replace dates before production use.
insert into public.academic_years (id, code, "startsOn", "endsOn")
values (
  '10000000-0000-4000-8000-000000000001',
  'AY-2026-2027',
  date '2026-08-01',
  date '2027-05-31'
)
on conflict (id) do update
set code = excluded.code,
    "startsOn" = excluded."startsOn",
    "endsOn" = excluded."endsOn";

insert into public.semesters (
  id,
  "academicYearId",
  code,
  name,
  "startsOn",
  "endsOn",
  status
)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'FIRST',
  'First Semester',
  date '2026-08-01',
  date '2026-12-20',
  'ACTIVE'
)
on conflict (id) do update
set "academicYearId" = excluded."academicYearId",
    code = excluded.code,
    name = excluded.name,
    "startsOn" = excluded."startsOn",
    "endsOn" = excluded."endsOn",
    status = excluded.status;

-- Placeholder codes: replace with institution's five official BSIT section codes.
insert into public.sections (id, code, name, "isActive", "retiredAt")
values
  ('30000000-0000-4000-8000-000000000001', 'BSIT-SEC-01', 'BSIT Section 01', true, null),
  ('30000000-0000-4000-8000-000000000002', 'BSIT-SEC-02', 'BSIT Section 02', true, null),
  ('30000000-0000-4000-8000-000000000003', 'BSIT-SEC-03', 'BSIT Section 03', true, null),
  ('30000000-0000-4000-8000-000000000004', 'BSIT-SEC-04', 'BSIT Section 04', true, null),
  ('30000000-0000-4000-8000-000000000005', 'BSIT-SEC-05', 'BSIT Section 05', true, null)
on conflict (id) do update
set code = excluded.code,
    name = excluded.name,
    "isActive" = excluded."isActive",
    "retiredAt" = excluded."retiredAt";

-- Fictional examples. profileId stays null until matching auth.users accounts exist.
insert into public.students (
  id,
  "profileId",
  "studentNumber",
  "firstName",
  "middleName",
  "lastName",
  status
)
values
  (
    '40000000-0000-4000-8000-000000000001', null,
    'BSIT-2026-0001', 'Ari', null, 'Cruz', 'ACTIVE'
  ),
  (
    '40000000-0000-4000-8000-000000000002', null,
    'BSIT-2026-0002', 'Bea', null, 'Cruz', 'ACTIVE'
  ),
  (
    '40000000-0000-4000-8000-000000000003', null,
    'BSIT-2026-0003', 'Carlo', null, 'Cruz', 'ACTIVE'
  )
on conflict (id) do update
set "studentNumber" = excluded."studentNumber",
    "firstName" = excluded."firstName",
    "middleName" = excluded."middleName",
    "lastName" = excluded."lastName",
    status = excluded.status;

insert into public.guardians (
  id,
  "firstName",
  "middleName",
  "lastName",
  "phoneE164",
  "isActive"
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    'Maria', null, 'Cruz', '+639000000001', true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'Ramon', null, 'Cruz', '+639000000002', true
  )
on conflict (id) do update
set "firstName" = excluded."firstName",
    "middleName" = excluded."middleName",
    "lastName" = excluded."lastName",
    "phoneE164" = excluded."phoneE164",
    "isActive" = excluded."isActive";

-- Maria receives SMS for three students. Guardian accounts are not created.
insert into public.student_guardians (
  id,
  "studentId",
  "guardianId",
  "relationshipLabel",
  "receivesSms",
  "effectiveFrom"
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Mother', true, date '2026-08-01'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    'Mother', true, date '2026-08-01'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    'Mother', true, date '2026-08-01'
  ),
  (
    '60000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    'Father', true, date '2026-08-01'
  )
on conflict (id) do update
set "relationshipLabel" = excluded."relationshipLabel",
    "receivesSms" = excluded."receivesSms",
    "effectiveFrom" = excluded."effectiveFrom",
    "effectiveTo" = null;

insert into public.student_section_enrollments (
  id,
  "studentId",
  "sectionId",
  "semesterId",
  status,
  "enrolledAt"
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'ENROLLED', timestamptz '2026-08-01 00:00:00+08'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'ENROLLED', timestamptz '2026-08-01 00:00:00+08'
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'ENROLLED', timestamptz '2026-08-01 00:00:00+08'
  )
on conflict (id) do update
set "sectionId" = excluded."sectionId",
    "semesterId" = excluded."semesterId",
    status = excluded.status,
    "enrolledAt" = excluded."enrolledAt",
    "endedAt" = null;

commit;
