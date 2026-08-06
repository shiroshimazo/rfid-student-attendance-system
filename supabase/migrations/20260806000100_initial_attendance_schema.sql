begin;

-- Supabase/PostgreSQL remains UTC. Institution-local attendance rules are fixed
-- separately to Asia/Manila and never depend on the database session timezone.
set local timezone = 'UTC';

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum ('ADMIN', 'TEACHER', 'STUDENT');
create type public.student_status as enum ('ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN');
create type public.semester_status as enum ('PLANNED', 'ACTIVE', 'CLOSED');
create type public.enrollment_status as enum ('ENROLLED', 'WITHDRAWN', 'COMPLETED');
create type public.rfid_card_status as enum ('ENABLED', 'LOST', 'DAMAGED', 'DISABLED', 'RETIRED');
create type public.rfid_assignment_end_reason as enum (
  'RETURNED', 'LOST', 'DAMAGED', 'DISABLED', 'REPLACED', 'ADMIN_CORRECTION'
);
create type public.rfid_device_status as enum ('ACTIVE', 'MAINTENANCE', 'DISABLED', 'RETIRED');
create type public.rfid_direction_mode as enum ('AUTO', 'IN_ONLY', 'OUT_ONLY');
create type public.attendance_direction as enum ('IN', 'OUT');
create type public.attendance_record_status as enum ('VALID', 'VOIDED');
create type public.rfid_scan_outcome as enum (
  'ACCEPTED_IN',
  'ACCEPTED_OUT',
  'INVALID_UID',
  'UNKNOWN_CARD',
  'UNASSIGNED_CARD',
  'DISABLED_CARD',
  'INACTIVE_STUDENT',
  'NO_ACTIVE_ENROLLMENT',
  'DUPLICATE_TAP',
  'OUT_WITHOUT_IN',
  'DAY_COMPLETE',
  'DEVICE_DISABLED',
  'PROCESSING_ERROR'
);
create type public.sms_notification_kind as enum ('ATTENDANCE_IN', 'ATTENDANCE_OUT', 'CORRECTION');
create type public.sms_notification_status as enum (
  'QUEUED', 'PROCESSING', 'RETRY', 'SENT', 'FAILED', 'CANCELLED'
);
create type public.sms_attempt_status as enum ('PROCESSING', 'SENT', 'FAILED');
create type public.attendance_correction_status as enum (
  'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
);
create type public.audit_actor_type as enum ('USER', 'DEVICE', 'SYSTEM', 'SMS_WORKER');

create table public.profiles (
  id uuid primary key
    references auth.users (id) on update restrict on delete restrict,
  role public.app_role not null,
  "firstName" text not null,
  "middleName" text,
  "lastName" text not null,
  "isActive" boolean not null default true,
  "disabledAt" timestamptz,
  "disabledByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "disabledReason" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint profiles_first_name_chk check ("firstName" = btrim("firstName") and length("firstName") > 0),
  constraint profiles_middle_name_chk check ("middleName" is null or ("middleName" = btrim("middleName") and length("middleName") > 0)),
  constraint profiles_last_name_chk check ("lastName" = btrim("lastName") and length("lastName") > 0),
  constraint profiles_disabled_state_chk check (
    (
      "isActive"
      and "disabledAt" is null
      and "disabledByProfileId" is null
      and "disabledReason" is null
    )
    or (not "isActive" and "disabledAt" is not null)
  )
);

create table public.app_settings (
  singleton boolean primary key default true,
  "institutionTimezone" text not null default 'Asia/Manila',
  "duplicateScanWindowSeconds" integer not null default 5,
  "maxFailedPasswordAttempts" integer not null default 5,
  "lockoutMinutes" integer not null default 60,
  "sessionIdleTimeoutSeconds" integer not null default 300,
  "smsMaxAttempts" integer not null default 5,
  "smsInitialRetrySeconds" integer not null default 60,
  "updatedAt" timestamptz not null default now(),
  "updatedByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  constraint app_settings_singleton_chk check (singleton),
  constraint app_settings_duplicate_window_chk check ("duplicateScanWindowSeconds" between 0 and 60),
  constraint app_settings_failed_attempts_chk check ("maxFailedPasswordAttempts" between 1 and 20),
  constraint app_settings_lockout_chk check ("lockoutMinutes" between 1 and 1440),
  constraint app_settings_institution_timezone_chk check ("institutionTimezone" = 'Asia/Manila'),
  constraint app_settings_idle_timeout_chk check ("sessionIdleTimeoutSeconds" = 300),
  constraint app_settings_sms_attempts_chk check ("smsMaxAttempts" between 1 and 20),
  constraint app_settings_sms_retry_chk check ("smsInitialRetrySeconds" between 1 and 86400)
);

insert into public.app_settings (singleton) values (true);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  "startsOn" date not null,
  "endsOn" date not null,
  "createdAt" timestamptz not null default now(),
  constraint academic_years_code_chk check (code = btrim(code) and length(code) between 3 and 30),
  constraint academic_years_dates_chk check ("startsOn" <= "endsOn"),
  constraint academic_years_dates_excl exclude using gist
    (daterange("startsOn", "endsOn", '[]') with &&)
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  "academicYearId" uuid not null
    references public.academic_years (id) on update restrict on delete restrict,
  code text not null,
  name text not null,
  "startsOn" date not null,
  "endsOn" date not null,
  status public.semester_status not null default 'PLANNED',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint semesters_academic_year_code_uq unique ("academicYearId", code),
  constraint semesters_code_chk check (code = btrim(code) and length(code) between 1 and 30),
  constraint semesters_name_chk check (name = btrim(name) and length(name) between 1 and 100),
  constraint semesters_dates_chk check ("startsOn" <= "endsOn")
);

create unique index semesters_one_active_uq
  on public.semesters ((true))
  where status = 'ACTIVE';
create index semesters_academic_year_idx on public.semesters ("academicYearId");
create index semesters_dates_idx on public.semesters ("startsOn", "endsOn");

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "retiredAt" timestamptz,
  constraint sections_code_chk check (code = upper(btrim(code)) and length(code) between 2 and 30),
  constraint sections_name_chk check (name = btrim(name) and length(name) between 2 and 100),
  constraint sections_retired_state_chk check (
    ("isActive" and "retiredAt" is null)
    or (not "isActive" and "retiredAt" is not null)
  )
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  "profileId" uuid unique
    references public.profiles (id) on update restrict on delete restrict,
  "studentNumber" text not null unique,
  "firstName" text not null,
  "middleName" text,
  "lastName" text not null,
  status public.student_status not null default 'ACTIVE',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint students_student_number_chk check (
    "studentNumber" = upper(btrim("studentNumber")) and length("studentNumber") between 3 and 40
  ),
  constraint students_first_name_chk check ("firstName" = btrim("firstName") and length("firstName") > 0),
  constraint students_middle_name_chk check ("middleName" is null or ("middleName" = btrim("middleName") and length("middleName") > 0)),
  constraint students_last_name_chk check ("lastName" = btrim("lastName") and length("lastName") > 0)
);

create index students_profile_idx on public.students ("profileId") where "profileId" is not null;
create index students_name_idx on public.students ("lastName", "firstName");
create index students_status_idx on public.students (status);

create table public.teacher_section_assignments (
  id uuid primary key default gen_random_uuid(),
  "teacherProfileId" uuid not null
    references public.profiles (id) on update restrict on delete restrict,
  "sectionId" uuid not null
    references public.sections (id) on update restrict on delete restrict,
  "semesterId" uuid not null
    references public.semesters (id) on update restrict on delete restrict,
  "assignedAt" timestamptz not null default now(),
  "assignedByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "revokedAt" timestamptz,
  "revokedByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "revokeReason" text,
  constraint teacher_section_assignment_dates_chk check (
    "revokedAt" is null or "revokedAt" >= "assignedAt"
  ),
  constraint teacher_section_assignment_revoke_chk check (
    ("revokedAt" is null and "revokedByProfileId" is null and "revokeReason" is null)
    or "revokedAt" is not null
  )
);

create unique index teacher_section_assignments_active_uq
  on public.teacher_section_assignments ("teacherProfileId", "sectionId", "semesterId")
  where "revokedAt" is null;
create index teacher_section_assignments_teacher_idx
  on public.teacher_section_assignments ("teacherProfileId", "semesterId")
  where "revokedAt" is null;
create index teacher_section_assignments_scope_idx
  on public.teacher_section_assignments ("sectionId", "semesterId")
  where "revokedAt" is null;

create table public.student_section_enrollments (
  id uuid primary key default gen_random_uuid(),
  "studentId" uuid not null
    references public.students (id) on update restrict on delete restrict,
  "sectionId" uuid not null
    references public.sections (id) on update restrict on delete restrict,
  "semesterId" uuid not null
    references public.semesters (id) on update restrict on delete restrict,
  status public.enrollment_status not null default 'ENROLLED',
  "enrolledAt" timestamptz not null default now(),
  "endedAt" timestamptz,
  "createdByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "endedByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "endReason" text,
  "createdAt" timestamptz not null default now(),
  constraint student_section_enrollments_student_semester_uq unique ("studentId", "semesterId"),
  constraint student_section_enrollments_id_student_uq unique (id, "studentId"),
  constraint student_section_enrollments_dates_chk check ("endedAt" is null or "endedAt" >= "enrolledAt"),
  constraint student_section_enrollments_state_chk check (
    (status = 'ENROLLED' and "endedAt" is null)
    or (status in ('WITHDRAWN', 'COMPLETED') and "endedAt" is not null)
  )
);

create index student_section_enrollments_section_idx
  on public.student_section_enrollments ("semesterId", "sectionId", status);
create index student_section_enrollments_student_idx
  on public.student_section_enrollments ("studentId", "semesterId");

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  "firstName" text not null,
  "middleName" text,
  "lastName" text not null,
  "phoneE164" text not null,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint guardians_first_name_chk check ("firstName" = btrim("firstName") and length("firstName") > 0),
  constraint guardians_middle_name_chk check ("middleName" is null or ("middleName" = btrim("middleName") and length("middleName") > 0)),
  constraint guardians_last_name_chk check ("lastName" = btrim("lastName") and length("lastName") > 0),
  constraint guardians_phone_e164_chk check ("phoneE164" ~ '^\+[1-9][0-9]{7,14}$')
);

create index guardians_phone_idx on public.guardians ("phoneE164");
create index guardians_name_idx on public.guardians ("lastName", "firstName");

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  "studentId" uuid not null
    references public.students (id) on update restrict on delete restrict,
  "guardianId" uuid not null
    references public.guardians (id) on update restrict on delete restrict,
  "relationshipLabel" text not null,
  "receivesSms" boolean not null default true,
  "effectiveFrom" date not null default ((clock_timestamp() at time zone 'Asia/Manila')::date),
  "effectiveTo" date,
  "createdAt" timestamptz not null default now(),
  "createdByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  constraint student_guardians_relationship_chk check (
    "relationshipLabel" = btrim("relationshipLabel") and length("relationshipLabel") between 2 and 50
  ),
  constraint student_guardians_id_guardian_uq unique (id, "guardianId"),
  constraint student_guardians_dates_chk check ("effectiveTo" is null or "effectiveTo" >= "effectiveFrom"),
  constraint student_guardians_period_excl exclude using gist (
    "studentId" with =,
    "guardianId" with =,
    daterange("effectiveFrom", coalesce("effectiveTo", 'infinity'::date), '[]') with &&
  )
);

create unique index student_guardians_current_uq
  on public.student_guardians ("studentId", "guardianId")
  where "effectiveTo" is null;
create index student_guardians_sms_idx
  on public.student_guardians ("studentId", "guardianId")
  where "receivesSms" and "effectiveTo" is null;
create index student_guardians_guardian_idx on public.student_guardians ("guardianId");

create table public.rfid_cards (
  id uuid primary key default gen_random_uuid(),
  uid text not null unique,
  status public.rfid_card_status not null default 'ENABLED',
  label text,
  "issuedAt" timestamptz not null default now(),
  "statusChangedAt" timestamptz not null default now(),
  "statusReason" text,
  "createdByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  constraint rfid_cards_uid_chk check (
    uid = upper(uid)
    and uid ~ '^(?:[0-9A-F]{8}|[0-9A-F]{14}|[0-9A-F]{20})$'
  ),
  constraint rfid_cards_label_chk check (label is null or length(btrim(label)) between 1 and 100)
);

create index rfid_cards_status_idx on public.rfid_cards (status);

create table public.rfid_card_assignments (
  id uuid primary key default gen_random_uuid(),
  "cardId" uuid not null
    references public.rfid_cards (id) on update restrict on delete restrict,
  "studentId" uuid not null
    references public.students (id) on update restrict on delete restrict,
  "assignedAt" timestamptz not null default now(),
  "assignedByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "unassignedAt" timestamptz,
  "unassignedByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "endReason" public.rfid_assignment_end_reason,
  notes text,
  constraint rfid_card_assignments_dates_chk check (
    "unassignedAt" is null or "unassignedAt" >= "assignedAt"
  ),
  constraint rfid_card_assignments_end_state_chk check (
    ("unassignedAt" is null and "endReason" is null and "unassignedByProfileId" is null)
    or ("unassignedAt" is not null and "endReason" is not null)
  ),
  constraint rfid_card_assignments_card_period_excl exclude using gist (
    "cardId" with =,
    tstzrange("assignedAt", coalesce("unassignedAt", 'infinity'::timestamptz), '[)') with &&
  ),
  constraint rfid_card_assignments_student_period_excl exclude using gist (
    "studentId" with =,
    tstzrange("assignedAt", coalesce("unassignedAt", 'infinity'::timestamptz), '[)') with &&
  )
);

create unique index rfid_card_assignments_active_card_uq
  on public.rfid_card_assignments ("cardId")
  where "unassignedAt" is null;
create unique index rfid_card_assignments_active_student_uq
  on public.rfid_card_assignments ("studentId")
  where "unassignedAt" is null;
create index rfid_card_assignments_student_history_idx
  on public.rfid_card_assignments ("studentId", "assignedAt" desc);
create index rfid_card_assignments_card_history_idx
  on public.rfid_card_assignments ("cardId", "assignedAt" desc);

create table public.rfid_devices (
  id uuid primary key default gen_random_uuid(),
  "deviceCode" text not null unique,
  name text not null,
  location text not null,
  status public.rfid_device_status not null default 'ACTIVE',
  "directionMode" public.rfid_direction_mode not null default 'AUTO',
  "firmwareVersion" text,
  "registeredAt" timestamptz not null default now(),
  "registeredByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "lastSeenAt" timestamptz,
  "statusChangedAt" timestamptz not null default now(),
  "statusReason" text,
  constraint rfid_devices_code_chk check (
    "deviceCode" = upper(btrim("deviceCode")) and length("deviceCode") between 3 and 50
  ),
  constraint rfid_devices_name_chk check (name = btrim(name) and length(name) between 2 and 100),
  constraint rfid_devices_location_chk check (location = btrim(location) and length(location) between 2 and 200)
);

create index rfid_devices_status_idx on public.rfid_devices (status);

create table private.rfid_device_credentials (
  id uuid primary key default gen_random_uuid(),
  "deviceId" uuid not null
    references public.rfid_devices (id) on update restrict on delete restrict,
  "keyPrefix" text not null,
  "secretDigest" bytea not null unique,
  "issuedAt" timestamptz not null default now(),
  "expiresAt" timestamptz,
  "revokedAt" timestamptz,
  "createdByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  constraint rfid_device_credentials_prefix_chk check (length("keyPrefix") between 4 and 20),
  constraint rfid_device_credentials_expiry_chk check ("expiresAt" is null or "expiresAt" > "issuedAt"),
  constraint rfid_device_credentials_revoke_chk check ("revokedAt" is null or "revokedAt" >= "issuedAt")
);

create unique index rfid_device_credentials_one_active_uq
  on private.rfid_device_credentials ("deviceId")
  where "revokedAt" is null;

create table public.rfid_scan_events (
  id uuid primary key default gen_random_uuid(),
  "deviceId" uuid not null
    references public.rfid_devices (id) on update restrict on delete restrict,
  "eventKey" text not null,
  "rawUid" text,
  "deviceScannedAt" timestamptz,
  "receivedAt" timestamptz not null default clock_timestamp(),
  "rawPayload" jsonb not null default '{}'::jsonb,
  constraint rfid_scan_events_device_event_uq unique ("deviceId", "eventKey"),
  constraint rfid_scan_events_event_key_chk check (
    "eventKey" = btrim("eventKey") and length("eventKey") between 1 and 128
  ),
  constraint rfid_scan_events_raw_uid_chk check ("rawUid" is null or length("rawUid") between 1 and 64),
  constraint rfid_scan_events_payload_chk check (jsonb_typeof("rawPayload") = 'object')
);

create index rfid_scan_events_received_idx on public.rfid_scan_events ("receivedAt" desc);
create index rfid_scan_events_device_received_idx
  on public.rfid_scan_events ("deviceId", "receivedAt" desc);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  "studentId" uuid not null
    references public.students (id) on update restrict on delete restrict,
  "sectionEnrollmentId" uuid not null,
  "attendanceDate" date not null,
  direction public.attendance_direction not null,
  "occurredAt" timestamptz not null,
  "sourceScanEventId" uuid not null unique
    references public.rfid_scan_events (id) on update restrict on delete restrict,
  status public.attendance_record_status not null default 'VALID',
  revision integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "correctedAt" timestamptz,
  constraint attendance_records_enrollment_student_fk
    foreign key ("sectionEnrollmentId", "studentId")
    references public.student_section_enrollments (id, "studentId")
    on update restrict on delete restrict,
  constraint attendance_records_revision_chk check (revision >= 0),
  constraint attendance_records_corrected_chk check (
    (revision = 0 and "correctedAt" is null)
    or (revision > 0 and "correctedAt" is not null)
  )
);

create unique index attendance_records_one_direction_daily_uq
  on public.attendance_records ("studentId", "attendanceDate", direction)
  where status = 'VALID';
create index attendance_records_student_date_idx
  on public.attendance_records ("studentId", "attendanceDate" desc)
  where status = 'VALID';
create index attendance_records_enrollment_date_idx
  on public.attendance_records ("sectionEnrollmentId", "attendanceDate" desc)
  where status = 'VALID';
create index attendance_records_occurred_idx on public.attendance_records ("occurredAt" desc);

create table public.rfid_scan_results (
  "scanEventId" uuid primary key
    references public.rfid_scan_events (id) on update restrict on delete restrict,
  outcome public.rfid_scan_outcome not null,
  "normalizedUid" text,
  "cardId" uuid
    references public.rfid_cards (id) on update restrict on delete restrict,
  "cardAssignmentId" uuid
    references public.rfid_card_assignments (id) on update restrict on delete restrict,
  "studentId" uuid
    references public.students (id) on update restrict on delete restrict,
  "sectionEnrollmentId" uuid
    references public.student_section_enrollments (id) on update restrict on delete restrict,
  "attendanceDate" date,
  "decidedDirection" public.attendance_direction,
  "reasonCode" text not null,
  "processedAt" timestamptz not null default clock_timestamp(),
  "responsePayload" jsonb not null default '{}'::jsonb,
  constraint rfid_scan_results_uid_chk check (
    "normalizedUid" is null
    or "normalizedUid" ~ '^(?:[0-9A-F]{8}|[0-9A-F]{14}|[0-9A-F]{20})$'
  ),
  constraint rfid_scan_results_reason_chk check ("reasonCode" = btrim("reasonCode") and length("reasonCode") between 2 and 100),
  constraint rfid_scan_results_payload_chk check (jsonb_typeof("responsePayload") = 'object'),
  constraint rfid_scan_results_accepted_chk check (
    (
      outcome in ('ACCEPTED_IN', 'ACCEPTED_OUT')
      and "studentId" is not null
      and "sectionEnrollmentId" is not null
      and "cardId" is not null
      and "cardAssignmentId" is not null
      and "attendanceDate" is not null
      and "decidedDirection" is not null
      and (
        (outcome = 'ACCEPTED_IN' and "decidedDirection" = 'IN')
        or (outcome = 'ACCEPTED_OUT' and "decidedDirection" = 'OUT')
      )
    )
    or outcome not in ('ACCEPTED_IN', 'ACCEPTED_OUT')
  )
);

create index rfid_scan_results_outcome_idx on public.rfid_scan_results (outcome, "processedAt" desc);
create index rfid_scan_results_student_idx
  on public.rfid_scan_results ("studentId", "processedAt" desc)
  where "studentId" is not null;
create index rfid_scan_results_enrollment_idx
  on public.rfid_scan_results ("sectionEnrollmentId", "processedAt" desc)
  where "sectionEnrollmentId" is not null;

create table public.sms_notifications (
  id uuid primary key default gen_random_uuid(),
  "attendanceRecordId" uuid not null
    references public.attendance_records (id) on update restrict on delete restrict,
  "studentGuardianId" uuid not null,
  "guardianId" uuid not null,
  kind public.sms_notification_kind not null,
  "recipientName" text not null,
  "recipientPhone" text not null,
  "messageBody" text not null,
  status public.sms_notification_status not null default 'QUEUED',
  "attemptCount" integer not null default 0,
  "maxAttempts" integer not null default 5,
  "nextAttemptAt" timestamptz default now(),
  "lockedAt" timestamptz,
  "lockedBy" text,
  "sentAt" timestamptz,
  "lastErrorCode" text,
  "lastErrorMessage" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint sms_notifications_delivery_uq
    unique ("attendanceRecordId", "studentGuardianId", kind),
  constraint sms_notifications_guardian_relationship_fk
    foreign key ("studentGuardianId", "guardianId")
    references public.student_guardians (id, "guardianId")
    on update restrict on delete restrict,
  constraint sms_notifications_recipient_name_chk check (length(btrim("recipientName")) > 0),
  constraint sms_notifications_recipient_phone_chk check ("recipientPhone" ~ '^\+[1-9][0-9]{7,14}$'),
  constraint sms_notifications_message_chk check (length("messageBody") between 1 and 1600),
  constraint sms_notifications_attempt_count_chk check (
    "attemptCount" >= 0 and "maxAttempts" between 1 and 20 and "attemptCount" <= "maxAttempts"
  ),
  constraint sms_notifications_sent_state_chk check (
    (status = 'SENT' and "sentAt" is not null)
    or (status <> 'SENT' and "sentAt" is null)
  ),
  constraint sms_notifications_lock_state_chk check (
    ("lockedAt" is null and "lockedBy" is null)
    or ("lockedAt" is not null and "lockedBy" is not null)
  )
);

create index sms_notifications_attendance_idx on public.sms_notifications ("attendanceRecordId");
create index sms_notifications_guardian_idx on public.sms_notifications ("guardianId", "createdAt" desc);
create index sms_notifications_queue_idx
  on public.sms_notifications ("nextAttemptAt", "createdAt")
  where status in ('QUEUED', 'RETRY');
create index sms_notifications_stale_lock_idx
  on public.sms_notifications ("lockedAt")
  where status = 'PROCESSING';

create table public.sms_attempts (
  id uuid primary key default gen_random_uuid(),
  "smsNotificationId" uuid not null
    references public.sms_notifications (id) on update restrict on delete restrict,
  "attemptNumber" integer not null,
  "providerName" text not null,
  "providerMessageId" text,
  status public.sms_attempt_status not null,
  "requestPayload" jsonb not null default '{}'::jsonb,
  "responsePayload" jsonb not null default '{}'::jsonb,
  "errorCode" text,
  "errorMessage" text,
  "startedAt" timestamptz not null default clock_timestamp(),
  "completedAt" timestamptz,
  constraint sms_attempts_number_uq unique ("smsNotificationId", "attemptNumber"),
  constraint sms_attempts_attempt_number_chk check ("attemptNumber" > 0),
  constraint sms_attempts_provider_chk check ("providerName" = btrim("providerName") and length("providerName") between 1 and 100),
  constraint sms_attempts_request_payload_chk check (jsonb_typeof("requestPayload") = 'object'),
  constraint sms_attempts_response_payload_chk check (jsonb_typeof("responsePayload") = 'object'),
  constraint sms_attempts_completion_chk check (
    (status = 'PROCESSING' and "completedAt" is null)
    or (status in ('SENT', 'FAILED') and "completedAt" is not null)
  )
);

create unique index sms_attempts_provider_message_uq
  on public.sms_attempts ("providerName", "providerMessageId")
  where "providerMessageId" is not null;
create index sms_attempts_notification_idx
  on public.sms_attempts ("smsNotificationId", "attemptNumber" desc);

create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  "attendanceRecordId" uuid not null
    references public.attendance_records (id) on update restrict on delete restrict,
  "sourceScanEventId" uuid not null
    references public.rfid_scan_events (id) on update restrict on delete restrict,
  "expectedRevision" integer not null,
  "originalAttendanceDate" date not null,
  "originalDirection" public.attendance_direction not null,
  "originalOccurredAt" timestamptz not null,
  "originalStatus" public.attendance_record_status not null,
  "proposedAttendanceDate" date not null,
  "proposedDirection" public.attendance_direction not null,
  "proposedOccurredAt" timestamptz not null,
  "proposedStatus" public.attendance_record_status not null,
  reason text not null,
  status public.attendance_correction_status not null default 'PENDING',
  "requestedByProfileId" uuid not null
    references public.profiles (id) on update restrict on delete restrict,
  "requestedAt" timestamptz not null default now(),
  "reviewedByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "reviewedAt" timestamptz,
  "reviewNote" text,
  "appliedValues" jsonb,
  constraint attendance_corrections_revision_chk check ("expectedRevision" >= 0),
  constraint attendance_corrections_reason_chk check (length(btrim(reason)) between 3 and 1000),
  constraint attendance_corrections_review_state_chk check (
    (status = 'PENDING' and "reviewedByProfileId" is null and "reviewedAt" is null and "appliedValues" is null)
    or (status <> 'PENDING' and "reviewedByProfileId" is not null and "reviewedAt" is not null)
  ),
  constraint attendance_corrections_applied_values_chk check (
    "appliedValues" is null or jsonb_typeof("appliedValues") = 'object'
  )
);

create unique index attendance_corrections_one_pending_uq
  on public.attendance_corrections ("attendanceRecordId")
  where status = 'PENDING';
create index attendance_corrections_status_idx
  on public.attendance_corrections (status, "requestedAt");
create index attendance_corrections_requester_idx
  on public.attendance_corrections ("requestedByProfileId", "requestedAt" desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  "actorType" public.audit_actor_type not null default 'SYSTEM',
  "actorProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "actorDeviceId" uuid
    references public.rfid_devices (id) on update restrict on delete restrict,
  action text not null,
  "entitySchema" text not null default 'public',
  "entityTable" text not null,
  "entityId" uuid,
  "oldValues" jsonb,
  "newValues" jsonb,
  "requestId" uuid,
  "ipAddress" inet,
  "userAgent" text,
  "occurredAt" timestamptz not null default clock_timestamp(),
  constraint audit_logs_action_chk check (action = upper(btrim(action)) and length(action) between 2 and 100),
  constraint audit_logs_entity_schema_chk check (length(btrim("entitySchema")) between 1 and 63),
  constraint audit_logs_entity_table_chk check (length(btrim("entityTable")) between 1 and 63),
  constraint audit_logs_values_chk check (
    ("oldValues" is null or jsonb_typeof("oldValues") = 'object')
    and ("newValues" is null or jsonb_typeof("newValues") = 'object')
  ),
  constraint audit_logs_actor_chk check (
    ("actorType" = 'USER' and "actorProfileId" is not null and "actorDeviceId" is null)
    or ("actorType" = 'DEVICE' and "actorDeviceId" is not null and "actorProfileId" is null)
    or ("actorType" in ('SYSTEM', 'SMS_WORKER') and "actorDeviceId" is null)
  )
);

create index audit_logs_occurred_idx on public.audit_logs ("occurredAt" desc);
create index audit_logs_actor_idx
  on public.audit_logs ("actorProfileId", "occurredAt" desc)
  where "actorProfileId" is not null;
create index audit_logs_entity_idx
  on public.audit_logs ("entityTable", "entityId", "occurredAt" desc);
create index audit_logs_action_idx on public.audit_logs (action, "occurredAt" desc);

create table private.auth_security_states (
  "userId" uuid primary key
    references auth.users (id) on update restrict on delete restrict,
  "consecutiveFailedAttempts" integer not null default 0,
  "lockedUntil" timestamptz,
  "lastFailedAt" timestamptz,
  "lastSuccessfulLoginAt" timestamptz,
  "lastPasswordChangedAt" timestamptz,
  "mustChangePassword" boolean not null default false,
  "passwordChangeReason" text,
  "passwordChangeRequiredAt" timestamptz,
  "passwordChangeRequiredByProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "passwordChangeReservationId" uuid,
  "passwordChangeReservedUntil" timestamptz,
  "updatedAt" timestamptz not null default now(),
  constraint auth_security_states_attempts_chk check ("consecutiveFailedAttempts" between 0 and 100),
  constraint auth_security_states_required_change_chk check (
    (
      "mustChangePassword"
      and "passwordChangeReason" is not null
      and "passwordChangeReason" = btrim("passwordChangeReason")
      and length("passwordChangeReason") between 3 and 1000
      and "passwordChangeRequiredAt" is not null
    )
    or (
      not "mustChangePassword"
      and "passwordChangeReason" is null
      and "passwordChangeRequiredAt" is null
      and "passwordChangeRequiredByProfileId" is null
    )
  ),
  constraint auth_security_states_password_reservation_chk check (
    ("passwordChangeReservationId" is null and "passwordChangeReservedUntil" is null)
    or ("passwordChangeReservationId" is not null and "passwordChangeReservedUntil" is not null)
  )
);

create index auth_security_states_lock_idx
  on private.auth_security_states ("lockedUntil")
  where "lockedUntil" is not null;

create table private.password_change_history (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null
    references auth.users (id) on update restrict on delete restrict,
  "changedAt" timestamptz not null default now(),
  "changeMethod" text not null,
  "actorProfileId" uuid
    references public.profiles (id) on update restrict on delete restrict,
  "authAuditLogId" uuid,
  metadata jsonb not null default '{}'::jsonb,
  constraint password_change_history_method_chk check (length(btrim("changeMethod")) between 2 and 50),
  constraint password_change_history_metadata_chk check (jsonb_typeof(metadata) = 'object')
);

create index password_change_history_user_idx
  on private.password_change_history ("userId", "changedAt" desc);

create table private.app_sessions (
  "authSessionId" uuid primary key,
  "userId" uuid not null
    references auth.users (id) on update restrict on delete restrict,
  "createdAt" timestamptz not null default now(),
  "lastActivityAt" timestamptz not null default now(),
  "revokedAt" timestamptz,
  "lastIpAddress" inet,
  "userAgent" text,
  constraint app_sessions_activity_chk check ("lastActivityAt" >= "createdAt"),
  constraint app_sessions_revoke_chk check ("revokedAt" is null or "revokedAt" >= "createdAt")
);

create index app_sessions_user_idx on private.app_sessions ("userId", "lastActivityAt" desc);
create index app_sessions_active_idx
  on private.app_sessions ("lastActivityAt")
  where "revokedAt" is null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new."updatedAt" := clock_timestamp();
  return new;
end;
$$;

create or replace function private.validate_app_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new."institutionTimezone" <> 'Asia/Manila' then
    raise exception 'Institution attendance timezone is fixed to Asia/Manila'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function private.validate_semester_dates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_year public.academic_years%rowtype;
begin
  select * into strict v_year
  from public.academic_years
  where id = new."academicYearId";

  if new."startsOn" < v_year."startsOn" or new."endsOn" > v_year."endsOn" then
    raise exception 'Semester dates must fall inside academic year dates'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_exactly_five_active_sections()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.sections
  where "isActive";

  if v_count <> 5 then
    raise exception 'Exactly five sections must be active; found %', v_count
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create or replace function private.enforce_student_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new."profileId" is not null and not exists (
    select 1
    from public.profiles p
    where p.id = new."profileId"
      and p.role = 'STUDENT'
  ) then
    raise exception 'Student profile must have STUDENT role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_teacher_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new."teacherProfileId"
      and p.role = 'TEACHER'
  ) then
    raise exception 'Teacher section assignment requires TEACHER role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.protect_linked_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if exists (select 1 from public.students s where s."profileId" = old.id) then
      raise exception 'Cannot change role of profile linked to student history'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.teacher_section_assignments tsa
      where tsa."teacherProfileId" = old.id
    ) then
      raise exception 'Cannot change role of profile linked to teacher assignment history'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.protect_linked_student_profile_name()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_student public.students%rowtype;
begin
  select * into v_student
  from public.students s
  where s."profileId" = old.id;

  if found and (
    new."firstName" is distinct from v_student."firstName"
    or new."middleName" is distinct from v_student."middleName"
    or new."lastName" is distinct from v_student."lastName"
  ) then
    raise exception 'Linked student name must be changed through the students record'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.sync_student_profile_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new."profileId" is not null then
    update public.profiles
    set "firstName" = new."firstName",
        "middleName" = new."middleName",
        "lastName" = new."lastName"
    where id = new."profileId"
      and (
        "firstName" is distinct from new."firstName"
        or "middleName" is distinct from new."middleName"
        or "lastName" is distinct from new."lastName"
      );
  end if;

  return new;
end;
$$;

create or replace function private.normalize_rfid_uid(p_uid text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_uid text;
begin
  v_uid := pg_catalog.regexp_replace(pg_catalog.upper(pg_catalog.btrim(p_uid)), '[[:space:]:-]', '', 'g');

  if v_uid ~ '^([0-9A-F]{8}|[0-9A-F]{14}|[0-9A-F]{20})$' then
    return v_uid;
  end if;

  return null;
end;
$$;

create or replace function private.reject_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Rows in %.% are immutable', tg_table_schema, tg_table_name
    using errcode = '55000';
end;
$$;

create or replace function private.reject_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Historical rows in %.% cannot be deleted', tg_table_schema, tg_table_name
    using errcode = '55000';
end;
$$;

create or replace function private.protect_rfid_assignment_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'RFID assignment history cannot be deleted'
      using errcode = '55000';
  end if;

  if old."unassignedAt" is not null then
    raise exception 'Closed RFID assignments are immutable'
      using errcode = '55000';
  end if;

  if new."cardId" is distinct from old."cardId"
    or new."studentId" is distinct from old."studentId"
    or new."assignedAt" is distinct from old."assignedAt"
    or new."assignedByProfileId" is distinct from old."assignedByProfileId"
  then
    raise exception 'RFID assignment identity and start fields are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.protect_attendance_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Attendance history cannot be deleted; void it through correction workflow'
      using errcode = '55000';
  end if;

  if new."studentId" is distinct from old."studentId"
    or new."sectionEnrollmentId" is distinct from old."sectionEnrollmentId"
    or new."sourceScanEventId" is distinct from old."sourceScanEventId"
    or new."createdAt" is distinct from old."createdAt"
  then
    raise exception 'Attendance identity and source scan are immutable'
      using errcode = '55000';
  end if;

  if new.revision <> old.revision + 1 then
    raise exception 'Attendance update must increment revision by exactly one'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.protect_enrollment_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'ENROLLED' then
    raise exception 'Closed student enrollment is immutable'
      using errcode = '55000';
  end if;

  if new.id is distinct from old.id
    or new."studentId" is distinct from old."studentId"
    or new."sectionId" is distinct from old."sectionId"
    or new."semesterId" is distinct from old."semesterId"
    or new."enrolledAt" is distinct from old."enrolledAt"
    or new."createdByProfileId" is distinct from old."createdByProfileId"
    or new."createdAt" is distinct from old."createdAt"
  then
    raise exception 'Enrollment identity and start fields are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.protect_teacher_assignment_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old."revokedAt" is not null then
    raise exception 'Revoked teacher assignment is immutable'
      using errcode = '55000';
  end if;

  if new.id is distinct from old.id
    or new."teacherProfileId" is distinct from old."teacherProfileId"
    or new."sectionId" is distinct from old."sectionId"
    or new."semesterId" is distinct from old."semesterId"
    or new."assignedAt" is distinct from old."assignedAt"
    or new."assignedByProfileId" is distinct from old."assignedByProfileId"
  then
    raise exception 'Teacher assignment identity and start fields are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.protect_rfid_card_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.uid is distinct from old.uid
    or new."issuedAt" is distinct from old."issuedAt"
    or new."createdByProfileId" is distinct from old."createdByProfileId"
  then
    raise exception 'RFID card identity fields are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.protect_rfid_device_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new."deviceCode" is distinct from old."deviceCode"
    or new."registeredAt" is distinct from old."registeredAt"
    or new."registeredByProfileId" is distinct from old."registeredByProfileId"
  then
    raise exception 'RFID device identity fields are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.protect_sms_notification_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new."attendanceRecordId" is distinct from old."attendanceRecordId"
    or new."studentGuardianId" is distinct from old."studentGuardianId"
    or new."guardianId" is distinct from old."guardianId"
    or new.kind is distinct from old.kind
    or new."recipientName" is distinct from old."recipientName"
    or new."recipientPhone" is distinct from old."recipientPhone"
    or new."messageBody" is distinct from old."messageBody"
    or new."maxAttempts" is distinct from old."maxAttempts"
    or new."createdAt" is distinct from old."createdAt"
  then
    raise exception 'SMS recipient and message snapshot fields are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.protect_sms_attempt_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'PROCESSING' then
    raise exception 'Completed SMS attempt is immutable'
      using errcode = '55000';
  end if;

  if new.id is distinct from old.id
    or new."smsNotificationId" is distinct from old."smsNotificationId"
    or new."attemptNumber" is distinct from old."attemptNumber"
    or new."providerName" is distinct from old."providerName"
    or new."requestPayload" is distinct from old."requestPayload"
    or new."startedAt" is distinct from old."startedAt"
  then
    raise exception 'SMS attempt identity and request snapshot are immutable'
      using errcode = '55000';
  end if;

  if new.status = 'PROCESSING' then
    raise exception 'SMS attempt update must complete attempt'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.protect_attendance_correction_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'PENDING' then
    raise exception 'Reviewed attendance correction is immutable'
      using errcode = '55000';
  end if;

  if new.id is distinct from old.id
    or new."attendanceRecordId" is distinct from old."attendanceRecordId"
    or new."sourceScanEventId" is distinct from old."sourceScanEventId"
    or new."expectedRevision" is distinct from old."expectedRevision"
    or new."originalAttendanceDate" is distinct from old."originalAttendanceDate"
    or new."originalDirection" is distinct from old."originalDirection"
    or new."originalOccurredAt" is distinct from old."originalOccurredAt"
    or new."originalStatus" is distinct from old."originalStatus"
    or new."proposedAttendanceDate" is distinct from old."proposedAttendanceDate"
    or new."proposedDirection" is distinct from old."proposedDirection"
    or new."proposedOccurredAt" is distinct from old."proposedOccurredAt"
    or new."proposedStatus" is distinct from old."proposedStatus"
    or new.reason is distinct from old.reason
    or new."requestedByProfileId" is distinct from old."requestedByProfileId"
    or new."requestedAt" is distinct from old."requestedAt"
  then
    raise exception 'Attendance correction request snapshot is immutable'
      using errcode = '55000';
  end if;

  if new.status = 'PENDING' then
    raise exception 'Pending attendance correction cannot be edited'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function private.validate_attendance_correction_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_record public.attendance_records%rowtype;
  v_timezone text;
begin
  select * into v_record
  from public.attendance_records ar
  where ar.id = new."attendanceRecordId";

  if not found then
    raise exception 'Attendance record not found for correction' using errcode = '23503';
  end if;

  if new."sourceScanEventId" is distinct from v_record."sourceScanEventId"
    or new."expectedRevision" is distinct from v_record.revision
    or new."originalAttendanceDate" is distinct from v_record."attendanceDate"
    or new."originalDirection" is distinct from v_record.direction
    or new."originalOccurredAt" is distinct from v_record."occurredAt"
    or new."originalStatus" is distinct from v_record.status
  then
    raise exception 'Correction original snapshot must match current attendance record'
      using errcode = '23514';
  end if;

  select cfg."institutionTimezone" into v_timezone
  from public.app_settings cfg
  where cfg.singleton;

  if (new."proposedOccurredAt" at time zone v_timezone)::date
    <> new."proposedAttendanceDate"
  then
    raise exception 'Proposed correction date must match timestamp in institution timezone'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.assert_attendance_day_valid(
  p_student_id uuid,
  p_attendance_date date
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_in_at timestamptz;
  v_out_at timestamptz;
begin
  select
    max(ar."occurredAt") filter (where ar.direction = 'IN'),
    max(ar."occurredAt") filter (where ar.direction = 'OUT')
  into v_in_at, v_out_at
  from public.attendance_records ar
  where ar."studentId" = p_student_id
    and ar."attendanceDate" = p_attendance_date
    and ar.status = 'VALID';

  if v_out_at is not null and v_in_at is null then
    raise exception 'Valid OUT requires valid IN on same attendance date'
      using errcode = '23514';
  end if;

  if v_in_at is not null and v_out_at is not null and v_out_at < v_in_at then
    raise exception 'OUT time cannot precede IN time'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function private.enforce_attendance_sequence()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_timezone text;
begin
  select cfg."institutionTimezone" into v_timezone
  from public.app_settings cfg
  where cfg.singleton;

  if (new."occurredAt" at time zone v_timezone)::date <> new."attendanceDate" then
    raise exception 'Attendance date must match occurredAt in institution timezone'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.student_section_enrollments e
    join public.semesters sem on sem.id = e."semesterId"
    where e.id = new."sectionEnrollmentId"
      and new."attendanceDate" between sem."startsOn" and sem."endsOn"
      and new."occurredAt" >= e."enrolledAt"
      and (e."endedAt" is null or new."occurredAt" < e."endedAt")
  ) then
    raise exception 'Attendance time must fall within enrollment and semester period'
      using errcode = '23514';
  end if;

  perform private.assert_attendance_day_valid(new."studentId", new."attendanceDate");

  if tg_op = 'UPDATE' and old."attendanceDate" is distinct from new."attendanceDate" then
    perform private.assert_attendance_day_valid(old."studentId", old."attendanceDate");
  end if;

  return null;
end;
$$;

create or replace function private.enforce_attendance_source_result()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.rfid_scan_results r
    where r."scanEventId" = new."sourceScanEventId"
      and r."studentId" = new."studentId"
      and r."sectionEnrollmentId" = new."sectionEnrollmentId"
      and r."attendanceDate" = new."attendanceDate"
      and r."decidedDirection" = new.direction
      and (
        (new.direction = 'IN' and r.outcome = 'ACCEPTED_IN')
        or (new.direction = 'OUT' and r.outcome = 'ACCEPTED_OUT')
      )
  ) then
    raise exception 'Attendance source scan must have matching accepted interpretation'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create or replace function private.enforce_scan_result_attendance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.outcome in ('ACCEPTED_IN', 'ACCEPTED_OUT') and not exists (
    select 1
    from public.attendance_records ar
    where ar."sourceScanEventId" = new."scanEventId"
      and ar."studentId" = new."studentId"
      and ar."sectionEnrollmentId" = new."sectionEnrollmentId"
      and ar."attendanceDate" = new."attendanceDate"
      and ar.direction = new."decidedDirection"
  ) then
    raise exception 'Accepted scan interpretation must have matching attendance record'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_entity_text text;
  v_entity_id uuid;
  v_actor_id uuid;
  v_actor_type public.audit_actor_type := 'SYSTEM';
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new);
  end if;

  v_entity_text := coalesce(v_new ->> 'id', v_old ->> 'id');
  if v_entity_text is not null and v_entity_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_entity_id := v_entity_text::uuid;
  end if;

  v_actor_id := auth.uid();
  if v_actor_id is not null and exists (
    select 1 from public.profiles p where p.id = v_actor_id
  ) then
    v_actor_type := 'USER';
  else
    v_actor_id := null;
  end if;

  insert into public.audit_logs (
    "actorType",
    "actorProfileId",
    action,
    "entitySchema",
    "entityTable",
    "entityId",
    "oldValues",
    "newValues"
  ) values (
    v_actor_type,
    v_actor_id,
    upper(tg_table_name || '_' || tg_op),
    tg_table_schema,
    tg_table_name,
    v_entity_id,
    v_old,
    v_new
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger profiles_protect_linked_role
before update of role on public.profiles
for each row execute function private.protect_linked_profile_role();

create trigger profiles_protect_linked_student_name
before update of "firstName", "middleName", "lastName" on public.profiles
for each row execute function private.protect_linked_student_profile_name();

create trigger app_settings_validate
before insert or update on public.app_settings
for each row execute function private.validate_app_settings();

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function private.set_updated_at();

create trigger semesters_validate_dates
before insert or update on public.semesters
for each row execute function private.validate_semester_dates();

create trigger semesters_set_updated_at
before update on public.semesters
for each row execute function private.set_updated_at();

create constraint trigger sections_exactly_five_active
after insert or delete or update on public.sections
deferrable initially deferred
for each row execute function private.enforce_exactly_five_active_sections();

create trigger students_enforce_profile_role
before insert or update of "profileId" on public.students
for each row execute function private.enforce_student_profile_role();

create trigger students_set_updated_at
before update on public.students
for each row execute function private.set_updated_at();

create trigger students_sync_profile_name
after insert or update of "profileId", "firstName", "middleName", "lastName" on public.students
for each row execute function private.sync_student_profile_name();

create trigger teacher_assignments_enforce_profile_role
before insert or update of "teacherProfileId" on public.teacher_section_assignments
for each row execute function private.enforce_teacher_profile_role();

create trigger teacher_assignments_protect_history
before update on public.teacher_section_assignments
for each row execute function private.protect_teacher_assignment_history();

create trigger student_enrollments_protect_history
before update on public.student_section_enrollments
for each row execute function private.protect_enrollment_history();

create trigger guardians_set_updated_at
before update on public.guardians
for each row execute function private.set_updated_at();

create trigger rfid_assignments_protect_history
before update or delete on public.rfid_card_assignments
for each row execute function private.protect_rfid_assignment_history();

create trigger rfid_cards_protect_identity
before update on public.rfid_cards
for each row execute function private.protect_rfid_card_identity();

create trigger rfid_devices_protect_identity
before update on public.rfid_devices
for each row execute function private.protect_rfid_device_identity();

create trigger rfid_scan_events_immutable
before update or delete on public.rfid_scan_events
for each row execute function private.reject_mutation();

create trigger rfid_scan_results_immutable
before update or delete on public.rfid_scan_results
for each row execute function private.reject_mutation();

create constraint trigger rfid_scan_results_attendance_guard
after insert on public.rfid_scan_results
deferrable initially deferred
for each row execute function private.enforce_scan_result_attendance();

create trigger attendance_records_protect_history
before update or delete on public.attendance_records
for each row execute function private.protect_attendance_history();

create constraint trigger attendance_records_sequence_guard
after insert or update on public.attendance_records
deferrable initially immediate
for each row execute function private.enforce_attendance_sequence();

create constraint trigger attendance_records_source_result_guard
after insert on public.attendance_records
deferrable initially deferred
for each row execute function private.enforce_attendance_source_result();

create trigger sms_notifications_set_updated_at
before update on public.sms_notifications
for each row execute function private.set_updated_at();

create trigger sms_notifications_protect_snapshot
before update on public.sms_notifications
for each row execute function private.protect_sms_notification_snapshot();

create trigger sms_attempts_immutable
before update on public.sms_attempts
for each row execute function private.protect_sms_attempt_history();

create trigger attendance_corrections_protect_history
before update on public.attendance_corrections
for each row execute function private.protect_attendance_correction_history();

create trigger attendance_corrections_validate_snapshot
before insert on public.attendance_corrections
for each row execute function private.validate_attendance_correction_snapshot();

create trigger audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function private.reject_mutation();

create trigger password_change_history_immutable
before update or delete on private.password_change_history
for each row execute function private.reject_mutation();

create trigger profiles_audit
after insert or update or delete on public.profiles
for each row execute function private.audit_row_change();
create trigger app_settings_audit
after update on public.app_settings
for each row execute function private.audit_row_change();
create trigger students_audit
after insert or update or delete on public.students
for each row execute function private.audit_row_change();
create trigger teacher_section_assignments_audit
after insert or update or delete on public.teacher_section_assignments
for each row execute function private.audit_row_change();
create trigger student_section_enrollments_audit
after insert or update or delete on public.student_section_enrollments
for each row execute function private.audit_row_change();
create trigger guardians_audit
after insert or update or delete on public.guardians
for each row execute function private.audit_row_change();
create trigger student_guardians_audit
after insert or update or delete on public.student_guardians
for each row execute function private.audit_row_change();
create trigger rfid_cards_audit
after insert or update or delete on public.rfid_cards
for each row execute function private.audit_row_change();
create trigger rfid_card_assignments_audit
after insert or update or delete on public.rfid_card_assignments
for each row execute function private.audit_row_change();
create trigger rfid_devices_audit_insert
after insert on public.rfid_devices
for each row execute function private.audit_row_change();
create trigger rfid_devices_audit_material_update
after update of status, "directionMode", name, location, "firmwareVersion", "statusReason"
on public.rfid_devices
for each row execute function private.audit_row_change();
create trigger attendance_corrections_audit
after insert or update or delete on public.attendance_corrections
for each row execute function private.audit_row_change();

create trigger profiles_reject_delete
before delete on public.profiles
for each row execute function private.reject_delete();
create trigger app_settings_reject_delete
before delete on public.app_settings
for each row execute function private.reject_delete();
create trigger academic_years_reject_delete
before delete on public.academic_years
for each row execute function private.reject_delete();
create trigger semesters_reject_delete
before delete on public.semesters
for each row execute function private.reject_delete();
create trigger sections_reject_delete
before delete on public.sections
for each row execute function private.reject_delete();
create trigger students_reject_delete
before delete on public.students
for each row execute function private.reject_delete();
create trigger teacher_section_assignments_reject_delete
before delete on public.teacher_section_assignments
for each row execute function private.reject_delete();
create trigger student_section_enrollments_reject_delete
before delete on public.student_section_enrollments
for each row execute function private.reject_delete();
create trigger guardians_reject_delete
before delete on public.guardians
for each row execute function private.reject_delete();
create trigger student_guardians_reject_delete
before delete on public.student_guardians
for each row execute function private.reject_delete();
create trigger rfid_cards_reject_delete
before delete on public.rfid_cards
for each row execute function private.reject_delete();
create trigger rfid_devices_reject_delete
before delete on public.rfid_devices
for each row execute function private.reject_delete();
create trigger sms_notifications_reject_delete
before delete on public.sms_notifications
for each row execute function private.reject_delete();
create trigger sms_attempts_reject_delete
before delete on public.sms_attempts
for each row execute function private.reject_delete();
create trigger attendance_corrections_reject_delete
before delete on public.attendance_corrections
for each row execute function private.reject_delete();
create trigger rfid_device_credentials_reject_delete
before delete on private.rfid_device_credentials
for each row execute function private.reject_delete();

create trigger academic_years_audit
after insert or update or delete on public.academic_years
for each row execute function private.audit_row_change();
create trigger semesters_audit
after insert or update or delete on public.semesters
for each row execute function private.audit_row_change();
create trigger sections_audit
after insert or update or delete on public.sections
for each row execute function private.audit_row_change();

create or replace function private.jwt_session_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_session_id text;
begin
  v_session_id := auth.jwt() ->> 'session_id';
  if v_session_id is null or v_session_id = '' then
    return null;
  end if;

  return v_session_id::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function private.request_has_active_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.app_sessions aps
    join public.profiles p on p.id = aps."userId"
    left join private.auth_security_states security_state
      on security_state."userId" = aps."userId"
    cross join public.app_settings cfg
    where aps."authSessionId" = private.jwt_session_id()
      and aps."userId" = auth.uid()
      and aps."revokedAt" is null
      and aps."lastActivityAt" >= now() - pg_catalog.make_interval(secs => cfg."sessionIdleTimeoutSeconds")
      and p."isActive"
      and not coalesce(security_state."mustChangePassword", false)
  );
$$;

create or replace function private.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.request_has_active_session()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = p_role
        and p."isActive"
    );
$$;

create or replace function private.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.students s
  where s."profileId" = auth.uid()
    and s.status = 'ACTIVE'
  limit 1;
$$;

create or replace function private.teacher_can_access_enrollment(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('TEACHER') and exists (
    select 1
    from public.student_section_enrollments e
    join public.teacher_section_assignments tsa
      on tsa."sectionId" = e."sectionId"
     and tsa."semesterId" = e."semesterId"
     and tsa."teacherProfileId" = auth.uid()
     and tsa."revokedAt" is null
    where e.id = p_enrollment_id
  );
$$;

create or replace function private.teacher_can_access_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('TEACHER') and exists (
    select 1
    from public.student_section_enrollments e
    join public.teacher_section_assignments tsa
      on tsa."sectionId" = e."sectionId"
     and tsa."semesterId" = e."semesterId"
     and tsa."teacherProfileId" = auth.uid()
     and tsa."revokedAt" is null
    where e."studentId" = p_student_id
  );
$$;

create or replace function private.current_student_has_guardian(p_guardian_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.request_has_active_session() and exists (
    select 1
    from public.student_guardians sg
    where sg."studentId" = private.current_student_id()
      and sg."guardianId" = p_guardian_id
      and sg."effectiveFrom" <= (clock_timestamp() at time zone 'Asia/Manila')::date
      and (
        sg."effectiveTo" is null
        or sg."effectiveTo" >= (clock_timestamp() at time zone 'Asia/Manila')::date
      )
  );
$$;

create or replace function private.can_access_attendance(p_attendance_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.attendance_records ar
    where ar.id = p_attendance_record_id
      and (
        private.has_role('ADMIN')
        or ar."studentId" = private.current_student_id()
        or private.teacher_can_access_enrollment(ar."sectionEnrollmentId")
      )
  );
$$;

create or replace function public.touch_my_session(
  p_ip_address inet default null,
  p_user_agent text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid := private.jwt_session_id();
  v_timeout_seconds integer;
  v_session private.app_sessions%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null or v_session_id is null then
    raise exception 'Authenticated Supabase session required'
      using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = v_user_id and p."isActive"
  ) then
    raise exception 'Account is disabled or not provisioned'
      using errcode = '28000';
  end if;

  if exists (
    select 1
    from private.auth_security_states security_state
    where security_state."userId" = v_user_id
      and security_state."mustChangePassword"
  ) then
    raise exception 'Password change required before application access'
      using errcode = '28000';
  end if;

  select "sessionIdleTimeoutSeconds" into v_timeout_seconds
  from public.app_settings
  where singleton;

  select * into v_session
  from private.app_sessions aps
  where aps."authSessionId" = v_session_id
  for update;

  if not found then
    insert into private.app_sessions (
      "authSessionId",
      "userId",
      "createdAt",
      "lastActivityAt",
      "lastIpAddress",
      "userAgent"
    ) values (
      v_session_id,
      v_user_id,
      v_now,
      v_now,
      p_ip_address,
      left(p_user_agent, 1000)
    );
  else
    if v_session."userId" <> v_user_id
      or v_session."revokedAt" is not null
      or v_session."lastActivityAt" < v_now - pg_catalog.make_interval(secs => v_timeout_seconds)
    then
      raise exception 'Application session expired after inactivity'
        using errcode = '28000';
    end if;

    update private.app_sessions
    set "lastActivityAt" = v_now,
        "lastIpAddress" = coalesce(p_ip_address, "lastIpAddress"),
        "userAgent" = coalesce(left(p_user_agent, 1000), "userAgent")
    where "authSessionId" = v_session_id;
  end if;

  return v_now + pg_catalog.make_interval(secs => v_timeout_seconds);
end;
$$;

create or replace function public.my_session_status()
returns table ("isActive" boolean, "expiresAt" timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(
      aps."revokedAt" is null
      and aps."lastActivityAt" >= now() - pg_catalog.make_interval(secs => cfg."sessionIdleTimeoutSeconds")
      and p."isActive"
      and not coalesce(security_state."mustChangePassword", false),
      false
    ) as "isActive",
    case
      when aps."authSessionId" is null then null
      else aps."lastActivityAt" + pg_catalog.make_interval(secs => cfg."sessionIdleTimeoutSeconds")
    end as "expiresAt"
  from public.app_settings cfg
  left join private.app_sessions aps
    on aps."authSessionId" = private.jwt_session_id()
   and aps."userId" = auth.uid()
  left join public.profiles p on p.id = aps."userId"
  left join private.auth_security_states security_state
    on security_state."userId" = aps."userId"
  where cfg.singleton;
$$;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_claims jsonb := event -> 'claims';
  v_role text;
  v_active boolean := false;
  v_must_change_password boolean := false;
begin
  select p.role::text, p."isActive", coalesce(s."mustChangePassword", false)
  into v_role, v_active, v_must_change_password
  from public.profiles p
  left join private.auth_security_states s on s."userId" = p.id
  where p.id = (event ->> 'user_id')::uuid;

  v_claims := pg_catalog.jsonb_set(
    v_claims,
    '{user_role}',
    coalesce(to_jsonb(v_role), 'null'::jsonb),
    true
  );
  v_claims := pg_catalog.jsonb_set(
    v_claims,
    '{account_active}',
    to_jsonb(coalesce(v_active, false)),
    true
  );
  v_claims := pg_catalog.jsonb_set(
    v_claims,
    '{must_change_password}',
    to_jsonb(coalesce(v_must_change_password, false)),
    true
  );

  return pg_catalog.jsonb_set(event, '{claims}', v_claims, true);
end;
$$;

create or replace function public.login_security_state(p_email text)
returns table (
  "userId" uuid,
  "consecutiveFailedAttempts" integer,
  "lockedUntil" timestamptz,
  "mustChangePassword" boolean,
  "accountActive" boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    coalesce(s."consecutiveFailedAttempts", 0),
    s."lockedUntil",
    coalesce(s."mustChangePassword", false),
    coalesce(p."isActive", false)
  from auth.users u
  left join private.auth_security_states s on s."userId" = u.id
  left join public.profiles p on p.id = u.id
  where p_email is not null
    and u.email is not null
    and pg_catalog.lower(u.email) = pg_catalog.lower(pg_catalog.btrim(p_email))
  limit 1;
$$;

create or replace function public.record_failed_login_attempt(p_email text)
returns table ("consecutiveFailedAttempts" integer, "lockedUntil" timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_state private.auth_security_states%rowtype;
  v_now timestamptz := clock_timestamp();
  v_limit integer;
  v_lockout_minutes integer;
  v_new_attempts integer;
  v_new_locked_until timestamptz;
begin
  select u.id into v_user_id
  from auth.users u
  where p_email is not null
    and u.email is not null
    and pg_catalog.lower(u.email) = pg_catalog.lower(pg_catalog.btrim(p_email))
  limit 1;

  if v_user_id is null then
    "consecutiveFailedAttempts" := 0;
    "lockedUntil" := null;
    return next;
    return;
  end if;

  select cfg."maxFailedPasswordAttempts", cfg."lockoutMinutes"
  into v_limit, v_lockout_minutes
  from public.app_settings cfg
  where cfg.singleton;

  insert into private.auth_security_states ("userId")
  values (v_user_id)
  on conflict ("userId") do nothing;

  select * into strict v_state
  from private.auth_security_states s
  where s."userId" = v_user_id
  for update;

  v_new_attempts := case
    when v_state."lockedUntil" is not null and v_state."lockedUntil" <= v_now then 1
    else least(v_state."consecutiveFailedAttempts" + 1, 100)
  end;
  v_new_locked_until := case
    when v_new_attempts >= v_limit
      then v_now + pg_catalog.make_interval(mins => v_lockout_minutes)
    else null
  end;

  update private.auth_security_states
  set "consecutiveFailedAttempts" = v_new_attempts,
      "lastFailedAt" = v_now,
      "lockedUntil" = v_new_locked_until,
      "updatedAt" = v_now
  where "userId" = v_user_id;

  "consecutiveFailedAttempts" := v_new_attempts;
  "lockedUntil" := v_new_locked_until;
  return next;
end;
$$;

create or replace function public.record_successful_login(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.auth_security_states (
    "userId",
    "consecutiveFailedAttempts",
    "lockedUntil",
    "lastSuccessfulLoginAt",
    "updatedAt"
  ) values (
    p_user_id,
    0,
    null,
    clock_timestamp(),
    clock_timestamp()
  )
  on conflict ("userId") do update
  set "consecutiveFailedAttempts" = 0,
      "lockedUntil" = null,
      "lastSuccessfulLoginAt" = excluded."lastSuccessfulLoginAt",
      "updatedAt" = excluded."updatedAt";
end;
$$;

create or replace function public.password_verification_attempt_hook(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := (event ->> 'user_id')::uuid;
  v_valid boolean := coalesce((event ->> 'valid')::boolean, false);
  v_now timestamptz := clock_timestamp();
  v_limit integer;
  v_lockout_minutes integer;
  v_state private.auth_security_states%rowtype;
  v_attempts integer;
begin
  select "maxFailedPasswordAttempts", "lockoutMinutes"
  into v_limit, v_lockout_minutes
  from public.app_settings
  where singleton;

  insert into private.auth_security_states ("userId")
  values (v_user_id)
  on conflict ("userId") do nothing;

  select * into strict v_state
  from private.auth_security_states
  where "userId" = v_user_id
  for update;

  if not exists (
    select 1 from public.profiles p where p.id = v_user_id and p."isActive"
  ) then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Unable to sign in.',
      'should_logout_user', false
    );
  end if;

  if v_state."lockedUntil" is not null and v_state."lockedUntil" > v_now then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Unable to sign in. Try again later.',
      'should_logout_user', false
    );
  end if;

  if v_valid then
    update private.auth_security_states
    set "consecutiveFailedAttempts" = 0,
        "lockedUntil" = null,
        "lastSuccessfulLoginAt" = v_now,
        "updatedAt" = v_now
    where "userId" = v_user_id;

    return jsonb_build_object('decision', 'continue');
  end if;

  v_attempts := case
    when v_state."lockedUntil" is not null and v_state."lockedUntil" <= v_now then 1
    else v_state."consecutiveFailedAttempts" + 1
  end;

  update private.auth_security_states
  set "consecutiveFailedAttempts" = v_attempts,
      "lastFailedAt" = v_now,
      "lockedUntil" = case
        when v_attempts >= v_limit
          then v_now + pg_catalog.make_interval(mins => v_lockout_minutes)
        else null
      end,
      "updatedAt" = v_now
  where "userId" = v_user_id;

  if v_attempts >= v_limit then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Unable to sign in. Try again later.',
      'should_logout_user', false
    );
  end if;

  return jsonb_build_object('decision', 'continue');
end;
$$;

create or replace function public.begin_password_change(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state private.auth_security_states%rowtype;
  v_reservation_id uuid := gen_random_uuid();
  v_now timestamptz := clock_timestamp();
begin
  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  insert into private.auth_security_states ("userId")
  values (p_user_id)
  on conflict ("userId") do nothing;

  select * into strict v_state
  from private.auth_security_states s
  where s."userId" = p_user_id
  for update;

  if v_state."passwordChangeReservedUntil" is not null
    and v_state."passwordChangeReservedUntil" > v_now
  then
    raise exception 'Another password change is already in progress'
      using errcode = '55000';
  end if;

  update private.auth_security_states
  set "passwordChangeReservationId" = v_reservation_id,
      "passwordChangeReservedUntil" = v_now + interval '5 minutes',
      "updatedAt" = v_now
  where "userId" = p_user_id;

  return v_reservation_id;
end;
$$;

create or replace function public.complete_password_change(
  p_user_id uuid,
  p_reservation_id uuid,
  p_change_method text,
  p_actor_profile_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state private.auth_security_states%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_change_method is null or length(btrim(p_change_method)) not between 2 and 50 then
    raise exception 'changeMethod must contain 2 to 50 characters' using errcode = '22023';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'metadata must be a JSON object' using errcode = '22023';
  end if;

  select * into v_state
  from private.auth_security_states s
  where s."userId" = p_user_id
  for update;

  if not found
    or v_state."passwordChangeReservationId" is null
    or v_state."passwordChangeReservedUntil" is null
    or v_state."passwordChangeReservationId" is distinct from p_reservation_id
    or v_state."passwordChangeReservedUntil" <= v_now
  then
    raise exception 'Password change reservation is missing, invalid, or expired'
      using errcode = '55000';
  end if;

  update private.auth_security_states
  set "lastPasswordChangedAt" = v_now,
      "mustChangePassword" = false,
      "passwordChangeReason" = null,
      "passwordChangeRequiredAt" = null,
      "passwordChangeRequiredByProfileId" = null,
      "passwordChangeReservationId" = null,
      "passwordChangeReservedUntil" = null,
      "updatedAt" = v_now
  where "userId" = p_user_id;

  insert into private.password_change_history (
    "userId",
    "changeMethod",
    "actorProfileId",
    metadata
  ) values (
    p_user_id,
    btrim(p_change_method),
    p_actor_profile_id,
    p_metadata
  );
end;
$$;

create or replace function public.cancel_password_change(
  p_user_id uuid,
  p_reservation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.auth_security_states
  set "passwordChangeReservationId" = null,
      "passwordChangeReservedUntil" = null,
      "updatedAt" = clock_timestamp()
  where "userId" = p_user_id
    and "passwordChangeReservationId" = p_reservation_id;

  if not found then
    raise exception 'Password change reservation not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.force_password_change(
  p_user_id uuid,
  p_reason text,
  p_suspected_compromise boolean default false
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
begin
  if not private.has_role('ADMIN') then
    raise exception 'ADMIN role required' using errcode = '42501';
  end if;

  if p_reason is null or length(btrim(p_reason)) not between 3 and 1000 then
    raise exception 'Password change reason must contain 3 to 1000 characters'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'Target profile not found' using errcode = 'P0002';
  end if;

  insert into private.auth_security_states (
    "userId",
    "mustChangePassword",
    "passwordChangeReason",
    "passwordChangeRequiredAt",
    "passwordChangeRequiredByProfileId",
    "updatedAt"
  ) values (
    p_user_id,
    true,
    btrim(p_reason),
    v_now,
    auth.uid(),
    v_now
  )
  on conflict ("userId") do update
  set "mustChangePassword" = true,
      "passwordChangeReason" = excluded."passwordChangeReason",
      "passwordChangeRequiredAt" = excluded."passwordChangeRequiredAt",
      "passwordChangeRequiredByProfileId" = excluded."passwordChangeRequiredByProfileId",
      "passwordChangeReservationId" = null,
      "passwordChangeReservedUntil" = null,
      "updatedAt" = excluded."updatedAt";

  update private.app_sessions
  set "revokedAt" = v_now
  where "userId" = p_user_id
    and "revokedAt" is null;

  insert into public.audit_logs (
    "actorType",
    "actorProfileId",
    action,
    "entitySchema",
    "entityTable",
    "entityId",
    "newValues"
  ) values (
    'USER',
    auth.uid(),
    case
      when coalesce(p_suspected_compromise, false)
        then 'ACCOUNT_COMPROMISE_PASSWORD_CHANGE_REQUIRED'
      else 'PASSWORD_CHANGE_FORCED'
    end,
    'private',
    'auth_security_states',
    p_user_id,
    jsonb_build_object(
      'userId', p_user_id,
      'reason', btrim(p_reason),
      'suspectedCompromise', coalesce(p_suspected_compromise, false),
      'passwordChangeRequiredAt', v_now,
      'applicationSessionsRevoked', true
    )
  );

  return v_now;
end;
$$;

create or replace function public.provision_rfid_device_credential(p_device_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_now timestamptz := clock_timestamp();
begin
  if not private.has_role('ADMIN') then
    raise exception 'ADMIN role required' using errcode = '42501';
  end if;

  perform 1 from public.rfid_devices d where d.id = p_device_id for update;
  if not found then
    raise exception 'RFID device not found' using errcode = 'P0002';
  end if;

  v_secret := 'rfid_' || pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');

  update private.rfid_device_credentials
  set "revokedAt" = v_now
  where "deviceId" = p_device_id
    and "revokedAt" is null;

  insert into private.rfid_device_credentials (
    "deviceId",
    "keyPrefix",
    "secretDigest",
    "issuedAt",
    "createdByProfileId"
  ) values (
    p_device_id,
    left(v_secret, 12),
    extensions.digest(pg_catalog.convert_to(v_secret, 'UTF8'), 'sha256'),
    v_now,
    auth.uid()
  );

  insert into public.audit_logs (
    "actorType",
    "actorProfileId",
    action,
    "entityTable",
    "entityId",
    "newValues"
  ) values (
    'USER',
    auth.uid(),
    'RFID_DEVICE_CREDENTIAL_ROTATED',
    'rfid_devices',
    p_device_id,
    jsonb_build_object('rotatedAt', v_now)
  );

  return v_secret;
end;
$$;

create or replace function public.authenticate_rfid_device(
  p_device_code text,
  p_secret text
)
returns table (
  "deviceId" uuid,
  device_status public.rfid_device_status,
  "directionMode" public.rfid_direction_mode
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.status, d."directionMode"
  from public.rfid_devices d
  join private.rfid_device_credentials c on c."deviceId" = d.id
  where d."deviceCode" = upper(btrim(p_device_code))
    and c."revokedAt" is null
    and (c."expiresAt" is null or c."expiresAt" > now())
    and c."secretDigest" = extensions.digest(pg_catalog.convert_to(p_secret, 'UTF8'), 'sha256')
  limit 1;
$$;

create or replace function public.process_rfid_scan(
  p_device_id uuid,
  p_event_key text,
  p_raw_uid text,
  p_device_scanned_at timestamptz default null,
  p_raw_payload jsonb default '{}'::jsonb
)
returns table (
  "scanEventId" uuid,
  outcome public.rfid_scan_outcome,
  direction public.attendance_direction,
  "studentId" uuid,
  student_name text,
  section_code text,
  "occurredAt" timestamptz,
  is_idempotent_replay boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_received_at timestamptz;
  v_is_replay boolean := false;
  v_existing_raw_uid text;
  v_existing_raw_payload jsonb;
  v_existing_device_scanned_at timestamptz;
  v_device public.rfid_devices%rowtype;
  v_timezone text;
  v_duplicate_seconds integer;
  v_sms_max_attempts integer;
  v_attendance_date date;
  v_normalized_uid text;
  v_card public.rfid_cards%rowtype;
  v_assignment public.rfid_card_assignments%rowtype;
  v_student public.students%rowtype;
  v_enrollment public.student_section_enrollments%rowtype;
  v_section_code text;
  v_student_name text;
  v_last_scan_at timestamptz;
  v_has_in boolean := false;
  v_has_out boolean := false;
  v_direction public.attendance_direction;
  v_outcome public.rfid_scan_outcome;
  v_reason text;
  v_response jsonb := '{}'::jsonb;
  v_attendance_id uuid;
  v_notification_kind public.sms_notification_kind;
  v_sms_error text;
  v_sms_sqlstate text;
  v_processing_error text;
  v_processing_sqlstate text;
begin
  if p_event_key is null or p_event_key <> btrim(p_event_key)
    or length(p_event_key) not between 1 and 128
  then
    raise exception 'eventKey must contain 1 to 128 trimmed characters'
      using errcode = '22023';
  end if;

  if p_raw_payload is null or jsonb_typeof(p_raw_payload) <> 'object' then
    raise exception 'rawPayload must be a JSON object'
      using errcode = '22023';
  end if;

  insert into public.rfid_scan_events (
    "deviceId",
    "eventKey",
    "rawUid",
    "deviceScannedAt",
    "rawPayload"
  ) values (
    p_device_id,
    p_event_key,
    p_raw_uid,
    p_device_scanned_at,
    p_raw_payload
  )
  on conflict ("deviceId", "eventKey") do nothing
  returning id, "receivedAt" into v_event_id, v_received_at;

  if not found then
    v_is_replay := true;

    select e.id, e."receivedAt", e."rawUid", e."deviceScannedAt", e."rawPayload"
    into strict
      v_event_id,
      v_received_at,
      v_existing_raw_uid,
      v_existing_device_scanned_at,
      v_existing_raw_payload
    from public.rfid_scan_events e
    where e."deviceId" = p_device_id
      and e."eventKey" = p_event_key;

    if v_existing_raw_uid is distinct from p_raw_uid
      or v_existing_device_scanned_at is distinct from p_device_scanned_at
      or v_existing_raw_payload is distinct from p_raw_payload
    then
      raise exception 'eventKey was reused with different scan payload'
        using errcode = '23505';
    end if;

    return query
    select
      e.id,
      r.outcome,
      r."decidedDirection",
      r."studentId",
      case
        when s.id is null then null
        else concat_ws(' ', s."firstName", s."middleName", s."lastName")
      end,
      sec.code,
      coalesce(ar."occurredAt", e."receivedAt"),
      true
    from public.rfid_scan_events e
    join public.rfid_scan_results r on r."scanEventId" = e.id
    left join public.students s on s.id = r."studentId"
    left join public.student_section_enrollments enr on enr.id = r."sectionEnrollmentId"
    left join public.sections sec on sec.id = enr."sectionId"
    left join public.attendance_records ar on ar."sourceScanEventId" = e.id
    where e.id = v_event_id;

    if not found then
      raise exception 'Idempotent scan event exists without interpretation result'
        using errcode = '55000';
    end if;

    return;
  end if;

  select * into strict v_device
  from public.rfid_devices d
  where d.id = p_device_id;

  update public.rfid_devices
  set "lastSeenAt" = v_received_at
  where id = p_device_id;

  select
    cfg."institutionTimezone",
    cfg."duplicateScanWindowSeconds",
    cfg."smsMaxAttempts"
  into v_timezone, v_duplicate_seconds, v_sms_max_attempts
  from public.app_settings cfg
  where cfg.singleton;

  v_attendance_date := (v_received_at at time zone v_timezone)::date;

  <<interpret_scan>>
  begin
    if v_device.status <> 'ACTIVE' then
      v_outcome := 'DEVICE_DISABLED';
      v_reason := 'DEVICE_' || v_device.status::text;
      exit interpret_scan;
    end if;

    v_normalized_uid := private.normalize_rfid_uid(p_raw_uid);
    if v_normalized_uid is null then
      v_outcome := 'INVALID_UID';
      v_reason := 'UID_FORMAT_INVALID';
      exit interpret_scan;
    end if;

    select * into v_card
    from public.rfid_cards c
    where c.uid = v_normalized_uid;

    if not found then
      v_outcome := 'UNKNOWN_CARD';
      v_reason := 'UID_NOT_REGISTERED';
      exit interpret_scan;
    end if;

    if v_card.status <> 'ENABLED' then
      v_outcome := 'DISABLED_CARD';
      v_reason := 'CARD_' || v_card.status::text;
      exit interpret_scan;
    end if;

    select * into v_assignment
    from public.rfid_card_assignments a
    where a."cardId" = v_card.id
      and a."unassignedAt" is null;

    if not found then
      v_outcome := 'UNASSIGNED_CARD';
      v_reason := 'CARD_HAS_NO_ACTIVE_ASSIGNMENT';
      exit interpret_scan;
    end if;

    select * into strict v_student
    from public.students s
    where s.id = v_assignment."studentId";

    v_student_name := concat_ws(' ', v_student."firstName", v_student."middleName", v_student."lastName");

    if v_student.status <> 'ACTIVE' then
      v_outcome := 'INACTIVE_STUDENT';
      v_reason := 'STUDENT_' || v_student.status::text;
      exit interpret_scan;
    end if;

    select e.*
    into v_enrollment
    from public.student_section_enrollments e
    join public.semesters sem
      on sem.id = e."semesterId"
     and sem.status = 'ACTIVE'
     and v_attendance_date between sem."startsOn" and sem."endsOn"
    join public.sections active_section
      on active_section.id = e."sectionId"
     and active_section."isActive"
    where e."studentId" = v_student.id
      and e.status = 'ENROLLED'
      and e."enrolledAt" <= v_received_at
      and (e."endedAt" is null or e."endedAt" > v_received_at);

    if not found then
      v_outcome := 'NO_ACTIVE_ENROLLMENT';
      v_reason := 'NO_ENROLLMENT_FOR_ACTIVE_SEMESTER';
      exit interpret_scan;
    end if;

    select sec.code into strict v_section_code
    from public.sections sec
    where sec.id = v_enrollment."sectionId";

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_student.id::text || ':' || v_attendance_date::text, 0)
    );

    select max(e."receivedAt")
    into v_last_scan_at
    from public.attendance_records ar
    join public.rfid_scan_events e on e.id = ar."sourceScanEventId"
    where ar."studentId" = v_student.id
      and ar."attendanceDate" = v_attendance_date
      and ar.status = 'VALID';

    if v_last_scan_at is not null
      and v_received_at >= v_last_scan_at
      and v_received_at - v_last_scan_at
        <= pg_catalog.make_interval(secs => v_duplicate_seconds)
    then
      v_outcome := 'DUPLICATE_TAP';
      v_reason := 'WITHIN_DUPLICATE_WINDOW';
      exit interpret_scan;
    end if;

    select
      coalesce(bool_or(ar.direction = 'IN'), false),
      coalesce(bool_or(ar.direction = 'OUT'), false)
    into v_has_in, v_has_out
    from public.attendance_records ar
    where ar."studentId" = v_student.id
      and ar."attendanceDate" = v_attendance_date
      and ar.status = 'VALID';

    if v_device."directionMode" = 'IN_ONLY' then
      v_direction := 'IN';
    elsif v_device."directionMode" = 'OUT_ONLY' then
      v_direction := 'OUT';
    elsif not v_has_in then
      v_direction := 'IN';
    elsif not v_has_out then
      v_direction := 'OUT';
    else
      v_outcome := 'DAY_COMPLETE';
      v_reason := 'IN_AND_OUT_ALREADY_RECORDED';
      exit interpret_scan;
    end if;

    if v_direction = 'IN' and v_has_in then
      v_outcome := 'DAY_COMPLETE';
      v_reason := 'IN_ALREADY_RECORDED';
      exit interpret_scan;
    end if;

    if v_direction = 'OUT' and not v_has_in then
      v_outcome := 'OUT_WITHOUT_IN';
      v_reason := 'NO_VALID_IN_FOR_DATE';
      exit interpret_scan;
    end if;

    if v_direction = 'OUT' and v_has_out then
      v_outcome := 'DAY_COMPLETE';
      v_reason := 'OUT_ALREADY_RECORDED';
      exit interpret_scan;
    end if;

    insert into public.attendance_records (
      "studentId",
      "sectionEnrollmentId",
      "attendanceDate",
      direction,
      "occurredAt",
      "sourceScanEventId"
    ) values (
      v_student.id,
      v_enrollment.id,
      v_attendance_date,
      v_direction,
      v_received_at,
      v_event_id
    )
    returning id into v_attendance_id;

    if v_direction = 'IN' then
      v_outcome := 'ACCEPTED_IN';
      v_reason := 'ATTENDANCE_IN_RECORDED';
      v_notification_kind := 'ATTENDANCE_IN';
    else
      v_outcome := 'ACCEPTED_OUT';
      v_reason := 'ATTENDANCE_OUT_RECORDED';
      v_notification_kind := 'ATTENDANCE_OUT';
    end if;
  exception
    when others then
      get stacked diagnostics
        v_processing_error = message_text,
        v_processing_sqlstate = returned_sqlstate;

      v_outcome := 'PROCESSING_ERROR';
      v_reason := 'DATABASE_INTERPRETATION_ERROR';
      v_direction := null;
      v_attendance_id := null;
  end interpret_scan;

  v_response := jsonb_strip_nulls(jsonb_build_object(
    'eventKey', p_event_key,
    'outcome', v_outcome,
    'studentName', v_student_name,
    'section', v_section_code,
    'direction', v_direction,
    'date', v_attendance_date,
    'time', to_char(v_received_at at time zone v_timezone, 'HH24:MI:SS'),
    'occurredAt', v_received_at,
    'errorSqlstate', v_processing_sqlstate,
    'errorMessage', v_processing_error
  ));

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
    "reasonCode",
    "responsePayload"
  ) values (
    v_event_id,
    v_outcome,
    v_normalized_uid,
    v_card.id,
    v_assignment.id,
    v_student.id,
    v_enrollment.id,
    v_attendance_date,
    v_direction,
    v_reason,
    v_response
  );

  if v_outcome = 'PROCESSING_ERROR' then
    insert into public.audit_logs (
      "actorType",
      "actorDeviceId",
      action,
      "entityTable",
      "entityId",
      "newValues"
    ) values (
      'DEVICE',
      p_device_id,
      'RFID_SCAN_PROCESSING_ERROR',
      'rfid_scan_events',
      v_event_id,
      jsonb_build_object(
        'sqlstate', v_processing_sqlstate,
        'message_text', v_processing_error
      )
    );
  end if;

  if v_attendance_id is not null then
    begin
      insert into public.sms_notifications (
        "attendanceRecordId",
        "studentGuardianId",
        "guardianId",
        kind,
        "recipientName",
        "recipientPhone",
        "messageBody",
        "maxAttempts"
      )
      select
        v_attendance_id,
        sg.id,
        g.id,
        v_notification_kind,
        concat_ws(' ', g."firstName", g."middleName", g."lastName"),
        g."phoneE164",
        format(
          '%s (%s) recorded %s at %s on %s.',
          v_student_name,
          v_section_code,
          v_direction::text,
          to_char(v_received_at at time zone v_timezone, 'HH12:MI AM'),
          to_char(v_attendance_date, 'YYYY-MM-DD')
        ),
        v_sms_max_attempts
      from public.student_guardians sg
      join public.guardians g on g.id = sg."guardianId"
      where sg."studentId" = v_student.id
        and sg."receivesSms"
        and g."isActive"
        and sg."effectiveFrom" <= v_attendance_date
        and (sg."effectiveTo" is null or sg."effectiveTo" >= v_attendance_date)
      on conflict ("attendanceRecordId", "studentGuardianId", kind) do nothing;
    exception
      when others then
        get stacked diagnostics
          v_sms_error = message_text,
          v_sms_sqlstate = returned_sqlstate;

        insert into public.audit_logs (
          "actorType",
          "actorDeviceId",
          action,
          "entityTable",
          "entityId",
          "newValues"
        ) values (
          'DEVICE',
          p_device_id,
          'SMS_ENQUEUE_FAILED',
          'attendance_records',
          v_attendance_id,
          jsonb_build_object('sqlstate', v_sms_sqlstate, 'message', v_sms_error)
        );
    end;
  end if;

  return query
  select
    v_event_id,
    v_outcome,
    v_direction,
    v_student.id,
    v_student_name,
    v_section_code,
    v_received_at,
    v_is_replay;
end;
$$;

create or replace function public.assign_rfid_card(
  p_student_id uuid,
  p_card_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignment_id uuid;
  v_card_status public.rfid_card_status;
begin
  if not private.has_role('ADMIN') then
    raise exception 'ADMIN role required' using errcode = '42501';
  end if;

  perform 1 from public.students s where s.id = p_student_id and s.status = 'ACTIVE' for update;
  if not found then
    raise exception 'Active student not found' using errcode = 'P0002';
  end if;

  select c.status into v_card_status
  from public.rfid_cards c
  where c.id = p_card_id
  for update;

  if not found then
    raise exception 'RFID card not found' using errcode = 'P0002';
  end if;

  if v_card_status <> 'ENABLED' then
    raise exception 'Only ENABLED RFID card can be assigned' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.rfid_card_assignments a
    where a."studentId" = p_student_id and a."unassignedAt" is null
  ) then
    raise exception 'Student already has active RFID card assignment' using errcode = '23505';
  end if;

  if exists (
    select 1 from public.rfid_card_assignments a
    where a."cardId" = p_card_id and a."unassignedAt" is null
  ) then
    raise exception 'RFID card already has active student assignment' using errcode = '23505';
  end if;

  insert into public.rfid_card_assignments (
    "cardId",
    "studentId",
    "assignedByProfileId",
    notes
  ) values (
    p_card_id,
    p_student_id,
    auth.uid(),
    p_notes
  )
  returning id into v_assignment_id;

  return v_assignment_id;
end;
$$;

create or replace function public.replace_student_rfid_card(
  p_student_id uuid,
  p_new_card_id uuid,
  p_old_card_status public.rfid_card_status default 'LOST',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_assignment public.rfid_card_assignments%rowtype;
  v_new_card_status public.rfid_card_status;
  v_end_reason public.rfid_assignment_end_reason;
  v_new_assignment_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  if not private.has_role('ADMIN') then
    raise exception 'ADMIN role required' using errcode = '42501';
  end if;

  if p_old_card_status not in ('LOST', 'DAMAGED', 'DISABLED', 'RETIRED') then
    raise exception 'Replacement must retire old card as LOST, DAMAGED, DISABLED, or RETIRED'
      using errcode = '23514';
  end if;

  select * into v_old_assignment
  from public.rfid_card_assignments a
  where a."studentId" = p_student_id
    and a."unassignedAt" is null
  for update;

  if not found then
    raise exception 'Student has no active RFID card assignment' using errcode = 'P0002';
  end if;

  if v_old_assignment."cardId" = p_new_card_id then
    raise exception 'Replacement card must differ from old card' using errcode = '23514';
  end if;

  select c.status into v_new_card_status
  from public.rfid_cards c
  where c.id = p_new_card_id
  for update;

  if not found then
    raise exception 'Replacement RFID card not found' using errcode = 'P0002';
  end if;

  if v_new_card_status <> 'ENABLED' then
    raise exception 'Replacement RFID card must be ENABLED' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.rfid_card_assignments a
    where a."cardId" = p_new_card_id and a."unassignedAt" is null
  ) then
    raise exception 'Replacement RFID card already assigned' using errcode = '23505';
  end if;

  v_end_reason := case p_old_card_status
    when 'LOST' then 'LOST'::public.rfid_assignment_end_reason
    when 'DAMAGED' then 'DAMAGED'::public.rfid_assignment_end_reason
    when 'DISABLED' then 'DISABLED'::public.rfid_assignment_end_reason
    else 'REPLACED'::public.rfid_assignment_end_reason
  end;

  update public.rfid_card_assignments
  set "unassignedAt" = v_now,
      "unassignedByProfileId" = auth.uid(),
      "endReason" = v_end_reason,
      notes = coalesce(p_notes, notes)
  where id = v_old_assignment.id;

  update public.rfid_cards
  set status = p_old_card_status,
      "statusChangedAt" = v_now,
      "statusReason" = coalesce(p_notes, 'Card replaced')
  where id = v_old_assignment."cardId";

  insert into public.rfid_card_assignments (
    "cardId",
    "studentId",
    "assignedAt",
    "assignedByProfileId",
    notes
  ) values (
    p_new_card_id,
    p_student_id,
    v_now,
    auth.uid(),
    p_notes
  )
  returning id into v_new_assignment_id;

  return v_new_assignment_id;
end;
$$;

create or replace function public.request_attendance_correction(
  p_attendance_record_id uuid,
  p_proposed_attendance_date date,
  p_proposed_direction public.attendance_direction,
  p_proposed_occurred_at timestamptz,
  p_proposed_status public.attendance_record_status,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record public.attendance_records%rowtype;
  v_correction_id uuid;
  v_actor_id uuid := auth.uid();
  v_timezone text;
begin
  if not private.request_has_active_session() then
    raise exception 'Active application session required' using errcode = '28000';
  end if;

  select * into v_record
  from public.attendance_records ar
  where ar.id = p_attendance_record_id;

  if not found then
    raise exception 'Attendance record not found' using errcode = 'P0002';
  end if;

  if not (
    private.has_role('ADMIN')
    or v_record."studentId" = private.current_student_id()
    or private.teacher_can_access_enrollment(v_record."sectionEnrollmentId")
  ) then
    raise exception 'Attendance record outside authorized scope' using errcode = '42501';
  end if;

  if p_reason is null or length(btrim(p_reason)) < 3 then
    raise exception 'Correction reason must contain at least 3 characters' using errcode = '22023';
  end if;

  select "institutionTimezone" into v_timezone
  from public.app_settings
  where singleton;

  if (p_proposed_occurred_at at time zone v_timezone)::date <> p_proposed_attendance_date then
    raise exception 'Proposed attendance date must match proposed timestamp in institution timezone'
      using errcode = '23514';
  end if;

  if p_proposed_attendance_date = v_record."attendanceDate"
    and p_proposed_direction = v_record.direction
    and p_proposed_occurred_at = v_record."occurredAt"
    and p_proposed_status = v_record.status
  then
    raise exception 'Correction must change at least one attendance value' using errcode = '22023';
  end if;

  insert into public.attendance_corrections (
    "attendanceRecordId",
    "sourceScanEventId",
    "expectedRevision",
    "originalAttendanceDate",
    "originalDirection",
    "originalOccurredAt",
    "originalStatus",
    "proposedAttendanceDate",
    "proposedDirection",
    "proposedOccurredAt",
    "proposedStatus",
    reason,
    "requestedByProfileId"
  ) values (
    v_record.id,
    v_record."sourceScanEventId",
    v_record.revision,
    v_record."attendanceDate",
    v_record.direction,
    v_record."occurredAt",
    v_record.status,
    p_proposed_attendance_date,
    p_proposed_direction,
    p_proposed_occurred_at,
    p_proposed_status,
    btrim(p_reason),
    v_actor_id
  )
  returning id into v_correction_id;

  return v_correction_id;
end;
$$;

create or replace function public.review_attendance_correction(
  p_correction_id uuid,
  p_approve boolean,
  p_review_note text default null
)
returns public.attendance_correction_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_correction public.attendance_corrections%rowtype;
  v_record public.attendance_records%rowtype;
  v_new_status public.attendance_correction_status;
  v_applied jsonb;
begin
  if p_approve is null then
    raise exception 'approve decision is required' using errcode = '22023';
  end if;

  if not private.has_role('ADMIN') then
    raise exception 'ADMIN role required' using errcode = '42501';
  end if;

  select * into v_correction
  from public.attendance_corrections c
  where c.id = p_correction_id
  for update;

  if not found then
    raise exception 'Attendance correction not found' using errcode = 'P0002';
  end if;

  if v_correction.status <> 'PENDING' then
    raise exception 'Attendance correction already reviewed' using errcode = '55000';
  end if;

  select * into strict v_record
  from public.attendance_records ar
  where ar.id = v_correction."attendanceRecordId"
  for update;

  if p_approve then
    if v_record.revision <> v_correction."expectedRevision"
      or v_record."sourceScanEventId" <> v_correction."sourceScanEventId"
    then
      raise exception 'Attendance correction is stale; submit a new request'
        using errcode = '40001';
    end if;

    update public.attendance_records
    set "attendanceDate" = v_correction."proposedAttendanceDate",
        direction = v_correction."proposedDirection",
        "occurredAt" = v_correction."proposedOccurredAt",
        status = v_correction."proposedStatus",
        revision = revision + 1,
        "correctedAt" = clock_timestamp()
    where id = v_record.id;

    v_new_status := 'APPROVED';
    v_applied := jsonb_build_object(
      'attendanceDate', v_correction."proposedAttendanceDate",
      'direction', v_correction."proposedDirection",
      'occurredAt', v_correction."proposedOccurredAt",
      'status', v_correction."proposedStatus",
      'revision', v_record.revision + 1
    );
  else
    v_new_status := 'REJECTED';
    v_applied := null;
  end if;

  update public.attendance_corrections
  set status = v_new_status,
      "reviewedByProfileId" = auth.uid(),
      "reviewedAt" = clock_timestamp(),
      "reviewNote" = nullif(btrim(p_review_note), ''),
      "appliedValues" = v_applied
  where id = p_correction_id;

  return v_new_status;
end;
$$;

create or replace function public.list_accessible_sms_status(p_limit integer default 100)
returns table (
  "smsNotificationId" uuid,
  "attendanceRecordId" uuid,
  "studentId" uuid,
  kind public.sms_notification_kind,
  delivery_status public.sms_notification_status,
  "attemptCount" integer,
  "maxAttempts" integer,
  recipient_phone_masked text,
  "createdAt" timestamptz,
  "sentAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    n.id,
    n."attendanceRecordId",
    ar."studentId",
    n.kind,
    n.status,
    n."attemptCount",
    n."maxAttempts",
    '***' || right(n."recipientPhone", 4),
    n."createdAt",
    n."sentAt"
  from public.sms_notifications n
  join public.attendance_records ar on ar.id = n."attendanceRecordId"
  where private.request_has_active_session()
    and (
      private.has_role('ADMIN')
      or ar."studentId" = private.current_student_id()
      or private.teacher_can_access_enrollment(ar."sectionEnrollmentId")
    )
  order by n."createdAt" desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

create or replace function public.claim_sms_notifications(
  p_worker_id text,
  p_limit integer default 20
)
returns table (
  "smsNotificationId" uuid,
  "recipientPhone" text,
  "messageBody" text,
  next_attempt_number integer,
  provider_idempotency_key text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_worker_id is null or length(btrim(p_worker_id)) not between 1 and 100 then
    raise exception 'worker_id must contain 1 to 100 characters' using errcode = '22023';
  end if;

  update public.sms_attempts a
  set status = 'FAILED',
      "responsePayload" = jsonb_build_object('reason', 'worker_lease_expired'),
      "errorCode" = 'WORKER_LEASE_EXPIRED',
      "errorMessage" = 'SMS result was not recorded before worker lease expired',
      "completedAt" = clock_timestamp()
  from public.sms_notifications n
  where n.id = a."smsNotificationId"
    and n.status = 'PROCESSING'
    and n."lockedAt" < clock_timestamp() - interval '5 minutes'
    and a.status = 'PROCESSING';

  with stale_counts as (
    select
      n.id,
      greatest(n."attemptCount", coalesce(max(a."attemptNumber"), n."attemptCount")) as new_attempt_count,
      n."maxAttempts"
    from public.sms_notifications n
    left join public.sms_attempts a on a."smsNotificationId" = n.id
    where n.status = 'PROCESSING'
      and n."lockedAt" < clock_timestamp() - interval '5 minutes'
    group by n.id, n."attemptCount", n."maxAttempts"
  )
  update public.sms_notifications n
  set status = case
        when s.new_attempt_count >= s."maxAttempts" then 'FAILED'
        else 'RETRY'
      end,
      "attemptCount" = s.new_attempt_count,
      "nextAttemptAt" = case
        when s.new_attempt_count >= s."maxAttempts" then null
        else clock_timestamp()
      end,
      "lockedAt" = null,
      "lockedBy" = null,
      "lastErrorCode" = 'WORKER_LEASE_EXPIRED',
      "lastErrorMessage" = 'Previous SMS worker lease expired'
  from stale_counts s
  where n.id = s.id;

  return query
  with candidates as (
    select n.id
    from public.sms_notifications n
    where n.status in ('QUEUED', 'RETRY')
      and n."nextAttemptAt" <= clock_timestamp()
      and n."attemptCount" < n."maxAttempts"
    order by n."nextAttemptAt", n."createdAt"
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  ), claimed as (
    update public.sms_notifications n
    set status = 'PROCESSING',
        "nextAttemptAt" = null,
        "lockedAt" = clock_timestamp(),
        "lockedBy" = btrim(p_worker_id)
    from candidates c
    where n.id = c.id
    returning n.*
  )
  select
    c.id,
    c."recipientPhone",
    c."messageBody",
    c."attemptCount" + 1,
    c.id::text
  from claimed c;
end;
$$;

create or replace function public.begin_sms_attempt(
  p_sms_notification_id uuid,
  p_worker_id text,
  p_provider_name text,
  p_request_payload jsonb
)
returns table (
  sms_attempt_id uuid,
  "attemptNumber" integer,
  provider_idempotency_key text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_notification public.sms_notifications%rowtype;
  v_attempt_id uuid;
  v_attempt_number integer;
begin
  if p_provider_name is null or length(btrim(p_provider_name)) not between 1 and 100 then
    raise exception 'providerName must contain 1 to 100 characters' using errcode = '22023';
  end if;

  if p_request_payload is null or jsonb_typeof(p_request_payload) <> 'object' then
    raise exception 'requestPayload must be a JSON object' using errcode = '22023';
  end if;

  select * into v_notification
  from public.sms_notifications n
  where n.id = p_sms_notification_id
  for update;

  if not found then
    raise exception 'SMS notification not found' using errcode = 'P0002';
  end if;

  if v_notification.status <> 'PROCESSING'
    or v_notification."lockedBy" is distinct from btrim(p_worker_id)
  then
    raise exception 'SMS notification not claimed by this worker' using errcode = '55000';
  end if;

  v_attempt_number := v_notification."attemptCount" + 1;

  insert into public.sms_attempts (
    "smsNotificationId",
    "attemptNumber",
    "providerName",
    status,
    "requestPayload",
    "responsePayload",
    "startedAt"
  ) values (
    p_sms_notification_id,
    v_attempt_number,
    btrim(p_provider_name),
    'PROCESSING',
    p_request_payload,
    '{}'::jsonb,
    clock_timestamp()
  )
  returning id into v_attempt_id;

  return query
  select v_attempt_id, v_attempt_number, p_sms_notification_id::text;
end;
$$;

create or replace function public.finish_sms_attempt(
  p_sms_attempt_id uuid,
  p_worker_id text,
  p_succeeded boolean,
  p_provider_message_id text default null,
  p_response_payload jsonb default '{}'::jsonb,
  p_error_code text default null,
  p_error_message text default null
)
returns public.sms_notification_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.sms_attempts%rowtype;
  v_notification public.sms_notifications%rowtype;
  v_notification_id uuid;
  v_initial_delay integer;
  v_delay_seconds integer;
  v_new_status public.sms_notification_status;
  v_now timestamptz := clock_timestamp();
begin
  if p_succeeded is null then
    raise exception 'succeeded result is required' using errcode = '22023';
  end if;

  if p_response_payload is null or jsonb_typeof(p_response_payload) <> 'object' then
    raise exception 'responsePayload must be a JSON object' using errcode = '22023';
  end if;

  select a."smsNotificationId" into v_notification_id
  from public.sms_attempts a
  where a.id = p_sms_attempt_id;

  if not found then
    raise exception 'SMS attempt not found' using errcode = 'P0002';
  end if;

  select * into v_notification
  from public.sms_notifications n
  where n.id = v_notification_id
  for update;

  if v_notification.status <> 'PROCESSING'
    or v_notification."lockedBy" is distinct from btrim(p_worker_id)
  then
    raise exception 'SMS notification not claimed by this worker' using errcode = '55000';
  end if;

  select * into v_attempt
  from public.sms_attempts a
  where a.id = p_sms_attempt_id
  for update;

  if v_attempt.status <> 'PROCESSING'
    or v_attempt."attemptNumber" <> v_notification."attemptCount" + 1
  then
    raise exception 'SMS attempt is completed or out of sequence' using errcode = '55000';
  end if;

  update public.sms_attempts
  set "providerMessageId" = nullif(btrim(p_provider_message_id), ''),
      status = case when p_succeeded then 'SENT' else 'FAILED' end,
      "responsePayload" = p_response_payload,
      "errorCode" = case when p_succeeded then null else p_error_code end,
      "errorMessage" = case when p_succeeded then null else p_error_message end,
      "completedAt" = v_now
  where id = p_sms_attempt_id;

  if p_succeeded then
    v_new_status := 'SENT';

    update public.sms_notifications
    set status = v_new_status,
        "attemptCount" = v_attempt."attemptNumber",
        "nextAttemptAt" = null,
        "lockedAt" = null,
        "lockedBy" = null,
        "sentAt" = v_now,
        "lastErrorCode" = null,
        "lastErrorMessage" = null
    where id = v_notification_id;
  elsif v_attempt."attemptNumber" >= v_notification."maxAttempts" then
    v_new_status := 'FAILED';

    update public.sms_notifications
    set status = v_new_status,
        "attemptCount" = v_attempt."attemptNumber",
        "nextAttemptAt" = null,
        "lockedAt" = null,
        "lockedBy" = null,
        "lastErrorCode" = p_error_code,
        "lastErrorMessage" = p_error_message
    where id = v_notification_id;
  else
    select "smsInitialRetrySeconds" into v_initial_delay
    from public.app_settings
    where singleton;

    v_delay_seconds := least(
      3600::numeric,
      v_initial_delay::numeric * power(5::numeric, greatest(v_attempt."attemptNumber" - 1, 0))
    )::integer;
    v_new_status := 'RETRY';

    update public.sms_notifications
    set status = v_new_status,
        "attemptCount" = v_attempt."attemptNumber",
        "nextAttemptAt" = v_now + pg_catalog.make_interval(secs => v_delay_seconds),
        "lockedAt" = null,
        "lockedBy" = null,
        "lastErrorCode" = p_error_code,
        "lastErrorMessage" = p_error_message
    where id = v_notification_id;
  end if;

  return v_new_status;
end;
$$;

alter table public.attendance_corrections
  add constraint attendance_corrections_approved_values_chk check (
    (status = 'APPROVED' and "appliedValues" is not null)
    or (status <> 'APPROVED' and "appliedValues" is null)
  );

create trigger attendance_records_audit_corrections
after update on public.attendance_records
for each row execute function private.audit_row_change();

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.teacher_section_assignments enable row level security;
alter table public.student_section_enrollments enable row level security;
alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;
alter table public.rfid_cards enable row level security;
alter table public.rfid_card_assignments enable row level security;
alter table public.rfid_devices enable row level security;
alter table public.rfid_scan_events enable row level security;
alter table public.rfid_scan_results enable row level security;
alter table public.attendance_records enable row level security;
alter table public.sms_notifications enable row level security;
alter table public.sms_attempts enable row level security;
alter table public.attendance_corrections enable row level security;
alter table public.audit_logs enable row level security;
alter table private.rfid_device_credentials enable row level security;
alter table private.auth_security_states enable row level security;
alter table private.password_change_history enable row level security;
alter table private.app_sessions enable row level security;

create policy profiles_select_authorized
on public.profiles for select to authenticated
using (
  (select private.request_has_active_session())
  and (id = (select auth.uid()) or (select private.has_role('ADMIN')))
);

create policy profiles_auth_hook_read
on public.profiles for select to supabase_auth_admin
using (true);

create policy app_settings_select_authenticated
on public.app_settings for select to authenticated
using ((select private.request_has_active_session()));

create policy app_settings_auth_hook_read
on public.app_settings for select to supabase_auth_admin
using (true);

create policy academic_years_select_authenticated
on public.academic_years for select to authenticated
using ((select private.request_has_active_session()));

create policy semesters_select_authenticated
on public.semesters for select to authenticated
using ((select private.request_has_active_session()));

create policy sections_select_authenticated
on public.sections for select to authenticated
using ((select private.request_has_active_session()));

create policy students_select_authorized
on public.students for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or "profileId" = (select auth.uid())
    or private.teacher_can_access_student(id)
  )
);

create policy teacher_assignments_select_authorized
on public.teacher_section_assignments for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or "teacherProfileId" = (select auth.uid())
  )
);

create policy enrollments_select_authorized
on public.student_section_enrollments for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or "studentId" = (select private.current_student_id())
    or private.teacher_can_access_enrollment(id)
  )
);

create policy guardians_select_authorized
on public.guardians for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or private.current_student_has_guardian(id)
  )
);

create policy student_guardians_select_authorized
on public.student_guardians for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or "studentId" = (select private.current_student_id())
  )
);

create policy rfid_cards_select_admin
on public.rfid_cards for select to authenticated
using ((select private.has_role('ADMIN')));

create policy rfid_card_assignments_select_admin
on public.rfid_card_assignments for select to authenticated
using ((select private.has_role('ADMIN')));

create policy rfid_devices_select_admin
on public.rfid_devices for select to authenticated
using ((select private.has_role('ADMIN')));

create policy rfid_scan_events_select_admin
on public.rfid_scan_events for select to authenticated
using ((select private.has_role('ADMIN')));

create policy rfid_scan_results_select_authorized
on public.rfid_scan_results for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or "studentId" = (select private.current_student_id())
    or private.teacher_can_access_enrollment("sectionEnrollmentId")
  )
);

create policy attendance_records_select_authorized
on public.attendance_records for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or "studentId" = (select private.current_student_id())
    or private.teacher_can_access_enrollment("sectionEnrollmentId")
  )
);

create policy sms_notifications_select_admin
on public.sms_notifications for select to authenticated
using ((select private.has_role('ADMIN')));

create policy sms_attempts_select_admin
on public.sms_attempts for select to authenticated
using ((select private.has_role('ADMIN')));

create policy attendance_corrections_select_authorized
on public.attendance_corrections for select to authenticated
using (
  (select private.request_has_active_session())
  and (
    (select private.has_role('ADMIN'))
    or "requestedByProfileId" = (select auth.uid())
    or private.can_access_attendance("attendanceRecordId")
  )
);

create policy audit_logs_select_admin
on public.audit_logs for select to authenticated
using ((select private.has_role('ADMIN')));

create policy auth_security_states_auth_hook_manage
on private.auth_security_states for all to supabase_auth_admin
using (true)
with check (true);

revoke all on public.profiles from anon, authenticated;
revoke all on public.app_settings from anon, authenticated;
revoke all on public.academic_years from anon, authenticated;
revoke all on public.semesters from anon, authenticated;
revoke all on public.sections from anon, authenticated;
revoke all on public.students from anon, authenticated;
revoke all on public.teacher_section_assignments from anon, authenticated;
revoke all on public.student_section_enrollments from anon, authenticated;
revoke all on public.guardians from anon, authenticated;
revoke all on public.student_guardians from anon, authenticated;
revoke all on public.rfid_cards from anon, authenticated;
revoke all on public.rfid_card_assignments from anon, authenticated;
revoke all on public.rfid_devices from anon, authenticated;
revoke all on public.rfid_scan_events from anon, authenticated;
revoke all on public.rfid_scan_results from anon, authenticated;
revoke all on public.attendance_records from anon, authenticated;
revoke all on public.sms_notifications from anon, authenticated;
revoke all on public.sms_attempts from anon, authenticated;
revoke all on public.attendance_corrections from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.app_settings to authenticated;
grant select on public.academic_years to authenticated;
grant select on public.semesters to authenticated;
grant select on public.sections to authenticated;
grant select on public.students to authenticated;
grant select on public.teacher_section_assignments to authenticated;
grant select on public.student_section_enrollments to authenticated;
grant select on public.guardians to authenticated;
grant select on public.student_guardians to authenticated;
grant select on public.rfid_cards to authenticated;
grant select on public.rfid_card_assignments to authenticated;
grant select on public.rfid_devices to authenticated;
grant select on public.rfid_scan_events to authenticated;
grant select on public.rfid_scan_results to authenticated;
grant select on public.attendance_records to authenticated;
grant select on public.sms_notifications to authenticated;
grant select on public.sms_attempts to authenticated;
grant select on public.attendance_corrections to authenticated;
grant select on public.audit_logs to authenticated;

grant all on public.profiles to service_role;
grant all on public.app_settings to service_role;
grant all on public.academic_years to service_role;
grant all on public.semesters to service_role;
grant all on public.sections to service_role;
grant all on public.students to service_role;
grant all on public.teacher_section_assignments to service_role;
grant all on public.student_section_enrollments to service_role;
grant all on public.guardians to service_role;
grant all on public.student_guardians to service_role;
grant all on public.rfid_cards to service_role;
grant all on public.rfid_card_assignments to service_role;
grant all on public.rfid_devices to service_role;
grant all on public.rfid_scan_events to service_role;
grant all on public.rfid_scan_results to service_role;
grant all on public.attendance_records to service_role;
grant all on public.sms_notifications to service_role;
grant all on public.sms_attempts to service_role;
grant all on public.attendance_corrections to service_role;
grant all on public.audit_logs to service_role;

grant usage on schema private to service_role, supabase_auth_admin, authenticated;
grant usage on schema public to supabase_auth_admin;
grant usage on type public.app_role to supabase_auth_admin;
grant all on all tables in schema private to service_role;
grant select on public.profiles, public.app_settings to supabase_auth_admin;
grant select, insert, update on private.auth_security_states to supabase_auth_admin;

revoke execute on function private.set_updated_at() from public;
revoke execute on function private.validate_app_settings() from public;
revoke execute on function private.validate_semester_dates() from public;
revoke execute on function private.enforce_exactly_five_active_sections() from public;
revoke execute on function private.enforce_student_profile_role() from public;
revoke execute on function private.enforce_teacher_profile_role() from public;
revoke execute on function private.protect_linked_profile_role() from public;
revoke execute on function private.protect_linked_student_profile_name() from public;
revoke execute on function private.sync_student_profile_name() from public;
revoke execute on function private.normalize_rfid_uid(text) from public;
revoke execute on function private.reject_mutation() from public;
revoke execute on function private.reject_delete() from public;
revoke execute on function private.protect_rfid_assignment_history() from public;
revoke execute on function private.protect_attendance_history() from public;
revoke execute on function private.protect_enrollment_history() from public;
revoke execute on function private.protect_teacher_assignment_history() from public;
revoke execute on function private.protect_rfid_card_identity() from public;
revoke execute on function private.protect_rfid_device_identity() from public;
revoke execute on function private.protect_sms_notification_snapshot() from public;
revoke execute on function private.protect_sms_attempt_history() from public;
revoke execute on function private.protect_attendance_correction_history() from public;
revoke execute on function private.validate_attendance_correction_snapshot() from public;
revoke execute on function private.assert_attendance_day_valid(uuid, date) from public;
revoke execute on function private.enforce_attendance_sequence() from public;
revoke execute on function private.enforce_attendance_source_result() from public;
revoke execute on function private.enforce_scan_result_attendance() from public;
revoke execute on function private.audit_row_change() from public;
revoke execute on function private.jwt_session_id() from public;
revoke execute on function private.request_has_active_session() from public;
revoke execute on function private.has_role(public.app_role) from public;
revoke execute on function private.current_student_id() from public;
revoke execute on function private.teacher_can_access_enrollment(uuid) from public;
revoke execute on function private.teacher_can_access_student(uuid) from public;
revoke execute on function private.current_student_has_guardian(uuid) from public;
revoke execute on function private.can_access_attendance(uuid) from public;

grant execute on function private.jwt_session_id() to authenticated;
grant execute on function private.request_has_active_session() to authenticated;
grant execute on function private.has_role(public.app_role) to authenticated;
grant execute on function private.current_student_id() to authenticated;
grant execute on function private.teacher_can_access_enrollment(uuid) to authenticated;
grant execute on function private.teacher_can_access_student(uuid) to authenticated;
grant execute on function private.current_student_has_guardian(uuid) to authenticated;
grant execute on function private.can_access_attendance(uuid) to authenticated;

revoke execute on function public.touch_my_session(inet, text) from public, anon;
grant execute on function public.touch_my_session(inet, text) to authenticated;

revoke execute on function public.my_session_status() from public, anon;
grant execute on function public.my_session_status() to authenticated;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

revoke execute on function public.password_verification_attempt_hook(jsonb) from public, anon, authenticated;
grant execute on function public.password_verification_attempt_hook(jsonb) to supabase_auth_admin;

revoke execute on function public.login_security_state(text) from public, anon, authenticated;
grant execute on function public.login_security_state(text) to service_role;

revoke execute on function public.record_failed_login_attempt(text) from public, anon, authenticated;
grant execute on function public.record_failed_login_attempt(text) to service_role;

revoke execute on function public.record_successful_login(uuid) from public, anon, authenticated;
grant execute on function public.record_successful_login(uuid) to service_role;

revoke execute on function public.begin_password_change(uuid) from public, anon, authenticated;
grant execute on function public.begin_password_change(uuid) to service_role;

revoke execute on function public.complete_password_change(uuid, uuid, text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_password_change(uuid, uuid, text, uuid, jsonb)
  to service_role;

revoke execute on function public.cancel_password_change(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_password_change(uuid, uuid) to service_role;

revoke execute on function public.force_password_change(uuid, text, boolean)
  from public, anon;
grant execute on function public.force_password_change(uuid, text, boolean)
  to authenticated;

revoke execute on function public.provision_rfid_device_credential(uuid) from public, anon;
grant execute on function public.provision_rfid_device_credential(uuid) to authenticated;

revoke execute on function public.authenticate_rfid_device(text, text)
  from public, anon, authenticated;
grant execute on function public.authenticate_rfid_device(text, text) to service_role;

revoke execute on function public.process_rfid_scan(uuid, text, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.process_rfid_scan(uuid, text, text, timestamptz, jsonb)
  to service_role;

revoke execute on function public.assign_rfid_card(uuid, uuid, text) from public, anon;
grant execute on function public.assign_rfid_card(uuid, uuid, text) to authenticated;

revoke execute on function public.replace_student_rfid_card(uuid, uuid, public.rfid_card_status, text)
  from public, anon;
grant execute on function public.replace_student_rfid_card(uuid, uuid, public.rfid_card_status, text)
  to authenticated;

revoke execute on function public.request_attendance_correction(
  uuid, date, public.attendance_direction, timestamptz, public.attendance_record_status, text
) from public, anon;
grant execute on function public.request_attendance_correction(
  uuid, date, public.attendance_direction, timestamptz, public.attendance_record_status, text
) to authenticated;

revoke execute on function public.review_attendance_correction(uuid, boolean, text)
  from public, anon;
grant execute on function public.review_attendance_correction(uuid, boolean, text)
  to authenticated;

revoke execute on function public.list_accessible_sms_status(integer) from public, anon;
grant execute on function public.list_accessible_sms_status(integer) to authenticated;

revoke execute on function public.claim_sms_notifications(text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_sms_notifications(text, integer) to service_role;

revoke execute on function public.begin_sms_attempt(uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.begin_sms_attempt(uuid, text, text, jsonb) to service_role;

revoke execute on function public.finish_sms_attempt(
  uuid, text, boolean, text, jsonb, text, text
) from public, anon, authenticated;
grant execute on function public.finish_sms_attempt(
  uuid, text, boolean, text, jsonb, text, text
) to service_role;

commit;
