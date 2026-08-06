-- Run after migration and supabase/seed.sql against disposable database.
-- Entire test transaction rolls back.
begin;

create or replace function pg_temp.assert_true(p_value boolean, p_message text)
returns void
language plpgsql
as $$
begin
  if not coalesce(p_value, false) then
    raise exception 'ASSERTION FAILED: %', p_message;
  end if;
end;
$$;

create or replace function pg_temp.expect_sqlstate(
  p_sql text,
  p_expected_sqlstate text,
  p_message text
)
returns void
language plpgsql
as $$
declare
  v_state text;
begin
  begin
    execute p_sql;
  exception
    when others then
      get stacked diagnostics v_state = returned_sqlstate;
      if v_state = p_expected_sqlstate then
        return;
      end if;
      raise exception 'ASSERTION FAILED: %, expected SQLSTATE %, received %',
        p_message, p_expected_sqlstate, v_state;
  end;

  raise exception 'ASSERTION FAILED: %, statement unexpectedly succeeded', p_message;
end;
$$;

create or replace function pg_temp.expect_failure(p_sql text, p_message text)
returns void
language plpgsql
as $$
begin
  begin
    execute p_sql;
  exception
    when others then
      return;
  end;

  raise exception 'ASSERTION FAILED: %, statement unexpectedly succeeded', p_message;
end;
$$;

-- One guardian may serve multiple students.
select pg_temp.assert_true(
  (
    select count(*) = 3
    from public.student_guardians
    where "guardianId" = '50000000-0000-4000-8000-000000000001'
  ),
  'shared guardian must remain linked to three students'
);

-- One section per student per semester.
select pg_temp.expect_sqlstate(
  $sql$
    insert into public.student_section_enrollments (
      "studentId", "sectionId", "semesterId", status, "enrolledAt"
    ) values (
      '40000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000001',
      'ENROLLED',
      timestamptz '2026-08-02 08:00:00+08'
    )
  $sql$,
  '23505',
  'student cannot have second section in same semester'
);

-- RFID UID canonical format and uniqueness.
insert into public.rfid_cards (id, uid, label)
values
  ('81000000-0000-4000-8000-000000000001', 'A1B2C3D4', 'Old card'),
  ('81000000-0000-4000-8000-000000000002', 'B1C2D3E4', 'Replacement card'),
  ('81000000-0000-4000-8000-000000000003', 'C1D2E3F4', 'Other card');

select pg_temp.expect_sqlstate(
  $sql$insert into public.rfid_cards (uid) values ('A1B2C3D4')$sql$,
  '23505',
  'RFID UID must be unique'
);

select pg_temp.expect_sqlstate(
  $sql$insert into public.rfid_cards (uid) values ('not-a-uid')$sql$,
  '23514',
  'RFID UID must use canonical 4, 7, or 10 byte hex format'
);

-- One active assignment per student and card; closed history stays.
insert into public.rfid_card_assignments (
  id, "cardId", "studentId", "assignedAt"
)
values (
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  timestamptz '2026-08-01 07:00:00+08'
);

select pg_temp.expect_failure(
  $sql$
    insert into public.rfid_card_assignments ("cardId", "studentId", "assignedAt")
    values (
      '81000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000001',
      timestamptz '2026-08-02 07:00:00+08'
    )
  $sql$,
  'student cannot hold two active cards'
);

select pg_temp.expect_failure(
  $sql$
    insert into public.rfid_card_assignments ("cardId", "studentId", "assignedAt")
    values (
      '81000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000002',
      timestamptz '2026-08-02 07:00:00+08'
    )
  $sql$,
  'card cannot belong to two active students'
);

update public.rfid_card_assignments
set "unassignedAt" = timestamptz '2026-08-03 07:00:00+08',
    "endReason" = 'REPLACED'
where id = '82000000-0000-4000-8000-000000000001';

insert into public.rfid_card_assignments (
  id, "cardId", "studentId", "assignedAt"
)
values (
  '82000000-0000-4000-8000-000000000002',
  '81000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001',
  timestamptz '2026-08-03 07:00:00+08'
);

select pg_temp.assert_true(
  (
    select count(*) = 2
    from public.rfid_card_assignments
    where "studentId" = '40000000-0000-4000-8000-000000000001'
  ),
  'replacement must preserve old assignment row'
);

-- Raw event idempotency and immutability.
insert into public.rfid_devices (
  id, "deviceCode", name, location, "directionMode"
)
values (
  '83000000-0000-4000-8000-000000000001',
  'TEST-DEVICE-01', 'Test Reader', 'Test Door', 'AUTO'
);

insert into public.rfid_scan_events (
  id, "deviceId", "eventKey", "rawUid", "receivedAt"
)
values (
  '84000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000001',
  'boot-1:1', 'B1C2D3E4', timestamptz '2026-08-10 08:00:00+08'
);

select pg_temp.expect_sqlstate(
  $sql$
    insert into public.rfid_scan_events ("deviceId", "eventKey", "rawUid")
    values (
      '83000000-0000-4000-8000-000000000001',
      'boot-1:1', 'B1C2D3E4'
    )
  $sql$,
  '23505',
  'same device event key must be idempotent'
);

select pg_temp.expect_sqlstate(
  $sql$
    update public.rfid_scan_events
    set "rawUid" = 'FFFFFFFF'
    where id = '84000000-0000-4000-8000-000000000001'
  $sql$,
  '55000',
  'raw scan event must be immutable'
);

-- One valid IN and one valid OUT per local date.
insert into public.attendance_records (
  id,
  "studentId",
  "sectionEnrollmentId",
  "attendanceDate",
  direction,
  "occurredAt",
  "sourceScanEventId"
)
values (
  '85000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  date '2026-08-10',
  'IN',
  timestamptz '2026-08-10 08:00:00+08',
  '84000000-0000-4000-8000-000000000001'
);

insert into public.rfid_scan_results (
  "scanEventId",
  outcome,
  "normalizedUid",
  "cardId",
  "cardAssignmentId",
  "studentId",
  "sectionEnrollmentId",
  "attendanceDate",
  "decidedDirection",
  "reasonCode"
)
values (
  '84000000-0000-4000-8000-000000000001',
  'ACCEPTED_IN',
  'B1C2D3E4',
  '81000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  date '2026-08-10',
  'IN',
  'TEST_ACCEPTED_IN'
);

insert into public.rfid_scan_events (
  id, "deviceId", "eventKey", "rawUid", "receivedAt"
)
values
  (
    '84000000-0000-4000-8000-000000000002',
    '83000000-0000-4000-8000-000000000001',
    'boot-1:2', 'B1C2D3E4', timestamptz '2026-08-10 08:00:05+08'
  ),
  (
    '84000000-0000-4000-8000-000000000003',
    '83000000-0000-4000-8000-000000000001',
    'boot-1:3', 'B1C2D3E4', timestamptz '2026-08-10 17:00:00+08'
  ),
  (
    '84000000-0000-4000-8000-000000000004',
    '83000000-0000-4000-8000-000000000001',
    'boot-1:4', 'B1C2D3E4', timestamptz '2026-08-10 17:00:05+08'
  ),
  (
    '84000000-0000-4000-8000-000000000005',
    '83000000-0000-4000-8000-000000000001',
    'boot-1:5', 'C1D2E3F4', timestamptz '2026-08-10 17:00:00+08'
  );

select pg_temp.expect_sqlstate(
  $sql$
    insert into public.attendance_records (
      "studentId", "sectionEnrollmentId", "attendanceDate",
      direction, "occurredAt", "sourceScanEventId"
    ) values (
      '40000000-0000-4000-8000-000000000001',
      '70000000-0000-4000-8000-000000000001',
      date '2026-08-10', 'IN',
      timestamptz '2026-08-10 08:00:05+08',
      '84000000-0000-4000-8000-000000000002'
    )
  $sql$,
  '23505',
  'second valid IN on same date must fail'
);

insert into public.attendance_records (
  id,
  "studentId",
  "sectionEnrollmentId",
  "attendanceDate",
  direction,
  "occurredAt",
  "sourceScanEventId"
)
values (
  '85000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  date '2026-08-10',
  'OUT',
  timestamptz '2026-08-10 17:00:00+08',
  '84000000-0000-4000-8000-000000000003'
);

insert into public.rfid_scan_results (
  "scanEventId",
  outcome,
  "normalizedUid",
  "cardId",
  "cardAssignmentId",
  "studentId",
  "sectionEnrollmentId",
  "attendanceDate",
  "decidedDirection",
  "reasonCode"
)
values (
  '84000000-0000-4000-8000-000000000003',
  'ACCEPTED_OUT',
  'B1C2D3E4',
  '81000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  date '2026-08-10',
  'OUT',
  'TEST_ACCEPTED_OUT'
);

select pg_temp.expect_sqlstate(
  $sql$
    insert into public.attendance_records (
      "studentId", "sectionEnrollmentId", "attendanceDate",
      direction, "occurredAt", "sourceScanEventId"
    ) values (
      '40000000-0000-4000-8000-000000000001',
      '70000000-0000-4000-8000-000000000001',
      date '2026-08-10', 'OUT',
      timestamptz '2026-08-10 17:00:05+08',
      '84000000-0000-4000-8000-000000000004'
    )
  $sql$,
  '23505',
  'second valid OUT on same date must fail'
);

select pg_temp.expect_sqlstate(
  $sql$
    insert into public.attendance_records (
      "studentId", "sectionEnrollmentId", "attendanceDate",
      direction, "occurredAt", "sourceScanEventId"
    ) values (
      '40000000-0000-4000-8000-000000000003',
      '70000000-0000-4000-8000-000000000003',
      date '2026-08-10', 'OUT',
      timestamptz '2026-08-10 17:00:00+08',
      '84000000-0000-4000-8000-000000000005'
    )
  $sql$,
  '23514',
  'OUT without valid IN must fail'
);

select pg_temp.expect_sqlstate(
  $sql$
    update public.attendance_records
    set "sourceScanEventId" = '84000000-0000-4000-8000-000000000004',
        revision = revision + 1,
        "correctedAt" = clock_timestamp()
    where id = '85000000-0000-4000-8000-000000000002'
  $sql$,
  '55000',
  'correction cannot replace original source scan event'
);

-- Notification guardianId must identify the guardian on studentGuardianId.
select pg_temp.expect_sqlstate(
  $sql$
    insert into public.sms_notifications (
      "attendanceRecordId",
      "studentGuardianId",
      "guardianId",
      kind,
      "recipientName",
      "recipientPhone",
      "messageBody"
    ) values (
      '85000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000002',
      'ATTENDANCE_IN',
      'Wrong Guardian',
      '+639000000002',
      'This mismatched relationship must be rejected.'
    )
  $sql$,
  '23503',
  'SMS guardian must match the selected student-guardian relationship'
);

-- Force all deferred cross-table guards before rollback.
set constraints all immediate;

-- Historical dependencies restrict destructive student deletion.
select pg_temp.expect_sqlstate(
  $sql$
    delete from public.students
    where id = '40000000-0000-4000-8000-000000000001'
  $sql$,
  '55000',
  'student with history cannot be deleted'
);

rollback;
