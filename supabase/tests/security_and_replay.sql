-- Run after migration and supabase/seed.sql against a disposable database.
-- Entire test transaction rolls back.
begin;

set local timezone = 'UTC';

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

-- Institution rules remain fixed even when the database session is UTC.
select pg_temp.assert_true(
  current_setting('TimeZone') = 'UTC',
  'database test session must remain UTC'
);

select pg_temp.expect_sqlstate(
  $sql$
    update public.app_settings
    set "institutionTimezone" = 'UTC'
    where singleton
  $sql$,
  '22023',
  'institution attendance timezone cannot move away from Asia/Manila'
);

select pg_temp.assert_true(
  (
    select pg_get_expr(d.adbin, d.adrelid) ilike '%Asia/Manila%'
      and pg_get_expr(d.adbin, d.adrelid) not ilike '%current_date%'
    from pg_catalog.pg_attrdef d
    join pg_catalog.pg_attribute a
      on a.attrelid = d.adrelid and a.attnum = d.adnum
    where d.adrelid = 'public.student_guardians'::regclass
      and a.attname = 'effectiveFrom'
  ),
  'guardian relationship default must use Asia/Manila local date'
);

-- Students are canonical for linked student-profile names.
insert into auth.users (id, email)
values (
  '90000000-0000-4000-8000-000000000001',
  'student@example.test'
);

insert into public.profiles (id, role, "firstName", "lastName")
values (
  '90000000-0000-4000-8000-000000000001',
  'STUDENT',
  'Temporary',
  'Name'
);

update public.students
set "profileId" = '90000000-0000-4000-8000-000000000001'
where id = '40000000-0000-4000-8000-000000000001';

select pg_temp.assert_true(
  (
    select "firstName" = 'Ari' and "lastName" = 'Cruz'
    from public.profiles
    where id = '90000000-0000-4000-8000-000000000001'
  ),
  'student link must synchronize canonical student name to profile'
);

select pg_temp.expect_sqlstate(
  $sql$
    update public.profiles
    set "firstName" = 'Profile Override'
    where id = '90000000-0000-4000-8000-000000000001'
  $sql$,
  '23514',
  'linked student profile name cannot override canonical student name'
);

update public.students
set "firstName" = 'Ariana'
where id = '40000000-0000-4000-8000-000000000001';

select pg_temp.assert_true(
  (
    select "firstName" = 'Ariana'
    from public.profiles
    where id = '90000000-0000-4000-8000-000000000001'
  ),
  'student name change must synchronize to linked profile'
);

-- Device event-key replay must compare deviceScannedAt as part of the payload.
insert into public.rfid_devices (
  id,
  "deviceCode",
  name,
  location,
  "directionMode"
) values (
  '91000000-0000-4000-8000-000000000001',
  'REPLAY-DEVICE-01',
  'Replay Test Reader',
  'Test Entrance',
  'AUTO'
);

select public.process_rfid_scan(
  '91000000-0000-4000-8000-000000000001',
  'replay-test:1',
  'FFFFFFFF',
  timestamptz '2026-08-06 08:00:00+08',
  '{"source":"test"}'::jsonb
);

select pg_temp.assert_true(
  (
    select is_idempotent_replay
    from public.process_rfid_scan(
      '91000000-0000-4000-8000-000000000001',
      'replay-test:1',
      'FFFFFFFF',
      timestamptz '2026-08-06 08:00:00+08',
      '{"source":"test"}'::jsonb
    )
  ),
  'identical RFID retry must return the stored result as an idempotent replay'
);

select pg_temp.expect_sqlstate(
  $sql$
    select public.process_rfid_scan(
      '91000000-0000-4000-8000-000000000001',
      'replay-test:1',
      'FFFFFFFF',
      timestamptz '2026-08-06 08:00:01+08',
      '{"source":"test"}'::jsonb
    )
  $sql$,
  '23505',
  'event key replay with changed deviceScannedAt must be rejected'
);

select pg_temp.assert_true(
  (
    select count(*) = 1
    from public.rfid_scan_events
    where "deviceId" = '91000000-0000-4000-8000-000000000001'
      and "eventKey" = 'replay-test:1'
  ),
  'replay conflict must not create a second raw event'
);

-- Unexpected interpretation failures preserve SQLSTATE and message_text.
insert into public.rfid_cards (id, uid, label)
values (
  '92000000-0000-4000-8000-000000000001',
  'D1E2F3A4',
  'Processing error test card'
);

insert into public.rfid_card_assignments (
  id,
  "cardId",
  "studentId",
  "assignedAt"
) values (
  '93000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  timestamptz '2026-08-01 07:00:00+08'
);

create or replace function pg_temp.raise_synthetic_attendance_error()
returns trigger
language plpgsql
as $$
begin
  raise exception 'synthetic interpretation failure' using errcode = 'XX001';
end;
$$;

create trigger synthetic_attendance_error
before insert on public.attendance_records
for each row execute function pg_temp.raise_synthetic_attendance_error();

select public.process_rfid_scan(
  '91000000-0000-4000-8000-000000000001',
  'processing-error:1',
  'D1E2F3A4',
  timestamptz '2026-08-06 08:05:00+08',
  '{}'::jsonb
);

select pg_temp.assert_true(
  (
    select outcome = 'PROCESSING_ERROR'
      and "responsePayload" ->> 'errorSqlstate' = 'XX001'
      and "responsePayload" ->> 'errorMessage' = 'synthetic interpretation failure'
    from public.rfid_scan_results r
    join public.rfid_scan_events e on e.id = r."scanEventId"
    where e."eventKey" = 'processing-error:1'
  ),
  'processing error result must record SQLSTATE and message_text'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    where action = 'RFID_SCAN_PROCESSING_ERROR'
      and "newValues" ->> 'sqlstate' = 'XX001'
      and "newValues" ->> 'message_text' = 'synthetic interpretation failure'
  ),
  'processing error must create a diagnostic audit record'
);

drop trigger synthetic_attendance_error on public.attendance_records;

-- Ordinary-plan best-effort counter locks on the fifth failure and can reset.
insert into auth.users (id, email)
values (
  '94000000-0000-4000-8000-000000000001',
  'admin@example.test'
);

insert into public.profiles (id, role, "firstName", "lastName")
values (
  '94000000-0000-4000-8000-000000000001',
  'ADMIN',
  'Test',
  'Administrator'
);

select public.record_failed_login_attempt('admin@example.test') from generate_series(1, 4);

select pg_temp.assert_true(
  (
    select "consecutiveFailedAttempts" = 4 and "lockedUntil" is null
    from private.auth_security_states
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'first four ordinary-plan failures must not lock the account'
);

select public.record_failed_login_attempt('admin@example.test');

select pg_temp.assert_true(
  (
    select "consecutiveFailedAttempts" = 5 and "lockedUntil" > now()
    from private.auth_security_states
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'fifth ordinary-plan failure must create the one-hour account lock'
);

select public.record_successful_login('94000000-0000-4000-8000-000000000001');

select pg_temp.assert_true(
  (
    select "consecutiveFailedAttempts" = 0 and "lockedUntil" is null
    from private.auth_security_states
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'successful ordinary-plan login must clear failed-attempt state'
);

-- Application sessions: touch, expiry, forced-change revocation, recovery.
select set_config(
  'request.jwt.claims',
  '{"sub":"94000000-0000-4000-8000-000000000001","session_id":"95000000-0000-4000-8000-000000000001"}',
  true
);
set local role authenticated;

select public.touch_my_session('127.0.0.1'::inet, 'database-test');

select pg_temp.assert_true(
  (select "isActive" from public.my_session_status()),
  'newly touched application session must be active'
);

reset role;
update private.app_sessions
set "createdAt" = clock_timestamp() - interval '10 minutes',
    "lastActivityAt" = clock_timestamp() - interval '6 minutes'
where "authSessionId" = '95000000-0000-4000-8000-000000000001';
set local role authenticated;

select pg_temp.assert_true(
  not (select "isActive" from public.my_session_status()),
  'application session must become inactive after five minutes'
);

select pg_temp.expect_sqlstate(
  $sql$select public.touch_my_session('127.0.0.1'::inet, 'database-test')$sql$,
  '28000',
  'expired application session cannot be revived by touch'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"94000000-0000-4000-8000-000000000001","session_id":"95000000-0000-4000-8000-000000000002"}',
  true
);
set local role authenticated;
select public.touch_my_session('127.0.0.1'::inet, 'database-test');
select public.force_password_change(
  '94000000-0000-4000-8000-000000000001',
  'Suspected account compromise',
  true
);
reset role;

select pg_temp.assert_true(
  (
    select "mustChangePassword"
      and "passwordChangeReason" = 'Suspected account compromise'
      and "passwordChangeRequiredAt" is not null
      and "passwordChangeRequiredByProfileId" = '94000000-0000-4000-8000-000000000001'
    from private.auth_security_states
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'admin force RPC must set the complete password-change-required state'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from private.app_sessions
    where "userId" = '94000000-0000-4000-8000-000000000001'
      and "revokedAt" is null
  ),
  'admin force RPC must revoke every active application session'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"94000000-0000-4000-8000-000000000001","session_id":"95000000-0000-4000-8000-000000000003"}',
  true
);
set local role authenticated;
select pg_temp.expect_sqlstate(
  $sql$select public.touch_my_session('127.0.0.1'::inet, 'database-test')$sql$,
  '28000',
  'forced-change account cannot create a new application session'
);
reset role;

do $$
declare
  v_reservation_id uuid;
begin
  v_reservation_id := public.begin_password_change(
    '94000000-0000-4000-8000-000000000001'
  );
  perform public.complete_password_change(
    '94000000-0000-4000-8000-000000000001',
    v_reservation_id,
    'ADMIN_FORCED',
    '94000000-0000-4000-8000-000000000001',
    '{"test":true}'::jsonb
  );

  -- Immediate second change proves that no 30-day cooldown remains.
  v_reservation_id := public.begin_password_change(
    '94000000-0000-4000-8000-000000000001'
  );
  perform public.complete_password_change(
    '94000000-0000-4000-8000-000000000001',
    v_reservation_id,
    'SELF_SERVICE',
    '94000000-0000-4000-8000-000000000001',
    '{"test":true}'::jsonb
  );

  -- A network retry with the same reservation is successful and idempotent.
  perform public.complete_password_change(
    '94000000-0000-4000-8000-000000000001',
    v_reservation_id,
    'SELF_SERVICE',
    '94000000-0000-4000-8000-000000000001',
    '{"test":true}'::jsonb
  );
end;
$$;

select pg_temp.assert_true(
  (
    select not "mustChangePassword"
      and "passwordChangeReason" is null
      and "passwordChangeRequiredAt" is null
      and "passwordChangeRequiredByProfileId" is null
    from private.auth_security_states
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'successful password change must clear the forced-change state'
);

select pg_temp.assert_true(
  (
    select count(*) = 2
    from private.password_change_history
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'password-change audit history must preserve immediate repeated changes'
);

select pg_temp.assert_true(
  (
    select count(*) = 2
    from private.password_change_history
    where "userId" = '94000000-0000-4000-8000-000000000001'
      and "reservationId" is not null
  ),
  'each new password-change audit row must preserve its reservation id'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"94000000-0000-4000-8000-000000000001","session_id":"95000000-0000-4000-8000-000000000004"}',
  true
);
set local role authenticated;
select public.touch_my_session('127.0.0.1'::inet, 'database-test');
select pg_temp.assert_true(
  (select "isActive" from public.my_session_status()),
  'application session may be created after required password change completes'
);
reset role;

update private.auth_security_states
set "consecutiveFailedAttempts" = 4,
    "lastFailedAt" = clock_timestamp(),
    "lockedUntil" = clock_timestamp() + interval '1 hour'
where "userId" = '94000000-0000-4000-8000-000000000001';

do $$
declare
  v_reservation_id uuid;
begin
  v_reservation_id := public.begin_password_change(
    '94000000-0000-4000-8000-000000000001'
  );
  perform public.complete_password_change(
    '94000000-0000-4000-8000-000000000001',
    v_reservation_id,
    'PASSWORD_RECOVERY',
    '94000000-0000-4000-8000-000000000001',
    '{"test":"recovery"}'::jsonb
  );
  perform public.complete_password_change(
    '94000000-0000-4000-8000-000000000001',
    v_reservation_id,
    'PASSWORD_RECOVERY',
    '94000000-0000-4000-8000-000000000001',
    '{"test":"recovery"}'::jsonb
  );
end;
$$;

select pg_temp.assert_true(
  not exists (
    select 1
    from private.app_sessions
    where "userId" = '94000000-0000-4000-8000-000000000001'
      and "revokedAt" is null
  ),
  'password recovery must revoke every active application session'
);

select pg_temp.assert_true(
  (
    select "consecutiveFailedAttempts" = 0
      and "lastFailedAt" is null
      and "lockedUntil" is null
    from private.auth_security_states
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'password recovery must clear stale login failures and account lockout'
);

select pg_temp.assert_true(
  (
    select count(*) = 3
    from private.password_change_history
    where "userId" = '94000000-0000-4000-8000-000000000001'
  ),
  'idempotent recovery completion must create one audit row'
);

select pg_temp.expect_sqlstate(
  $sql$
    select public.complete_password_change(
      '94000000-0000-4000-8000-000000000001',
      (
        select "reservationId"
        from private.password_change_history
        where "userId" = '94000000-0000-4000-8000-000000000001'
          and "changeMethod" = 'PASSWORD_RECOVERY'
        order by "changedAt" desc
        limit 1
      ),
      'PASSWORD_RECOVERY',
      '94000000-0000-4000-8000-000000000001',
      '{"test":"different-retry"}'::jsonb
    )
  $sql$,
  '55000',
  'a reused password reservation cannot change its audit values'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"94000000-0000-4000-8000-000000000001","session_id":"95000000-0000-4000-8000-000000000005"}',
  true
);
set local role authenticated;
select public.touch_my_session('127.0.0.1'::inet, 'database-test');
select pg_temp.assert_true(
  (select "isActive" from public.my_session_status()),
  'a fresh application session may be created after recovery completes'
);
reset role;

rollback;
