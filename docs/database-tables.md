# Database Table Diagrams

Source of truth: [`20260806000100_initial_attendance_schema.sql`](../supabase/migrations/20260806000100_initial_attendance_schema.sql).

The project owns 24 tables: 20 in `public` and 4 in `private`. Supabase-managed `auth.users` is shown only as an external reference.

## Naming rule

- Table names remain `snake_case` so PostgreSQL schema objects stay conventional.
- Every table column uses `lowerCamelCase`. Single-word names such as `id`, `role`, `status`, and `code` are already valid lower camel case.
- PostgreSQL folds unquoted identifiers to lowercase. Therefore every multiword column must be double-quoted in SQL: `students."studentNumber"`, not `students.studentNumber`.
- `PK` = primary key, `FK` = foreign key, and `UK` = unique key. A `nullable` note means the column accepts `NULL`; otherwise it is `NOT NULL`.

## Complete inventory

| # | Table | Schema | Domain |
|---:|---|---|---|
| 1 | `profiles` | `public` | Identity and RBAC |
| 2 | `app_settings` | `public` | Runtime/security settings |
| 3 | `academic_years` | `public` | Academic calendar |
| 4 | `semesters` | `public` | Academic calendar |
| 5 | `sections` | `public` | BSIT sections |
| 6 | `students` | `public` | Student identity |
| 7 | `teacher_section_assignments` | `public` | Teacher authorization |
| 8 | `student_section_enrollments` | `public` | Enrollment history |
| 9 | `guardians` | `public` | Guardian identity |
| 10 | `student_guardians` | `public` | Student-guardian relationships |
| 11 | `rfid_cards` | `public` | RFID card registry |
| 12 | `rfid_card_assignments` | `public` | RFID assignment history |
| 13 | `rfid_devices` | `public` | Reader registry |
| 14 | `rfid_device_credentials` | `private` | Reader authentication secrets |
| 15 | `rfid_scan_events` | `public` | Immutable raw scans |
| 16 | `attendance_records` | `public` | Interpreted IN/OUT attendance |
| 17 | `rfid_scan_results` | `public` | Scan interpretation outcomes |
| 18 | `sms_notifications` | `public` | Durable SMS queue |
| 19 | `sms_attempts` | `public` | Provider attempt history |
| 20 | `attendance_corrections` | `public` | Correction ledger |
| 21 | `audit_logs` | `public` | Audit ledger |
| 22 | `auth_security_states` | `private` | Lockout/password state |
| 23 | `password_change_history` | `private` | Password-change history |
| 24 | `app_sessions` | `private` | Five-minute idle sessions |

## Identity, RBAC, and security

`AUTH_USERS` is not project-owned. It represents the minimum external key used from Supabase `auth.users`.

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
    }

    PUBLIC_PROFILES {
        uuid id PK,FK
        app_role role
        text firstName
        text middleName "nullable"
        text lastName
        boolean isActive "default true"
        timestamptz disabledAt "nullable"
        uuid disabledByProfileId FK "nullable"
        text disabledReason "nullable"
        timestamptz createdAt "default now()"
        timestamptz updatedAt "default now()"
    }

    PUBLIC_APP_SETTINGS {
        boolean singleton PK "always true"
        text institutionTimezone "default Asia/Manila"
        integer duplicateScanWindowSeconds "default 5"
        integer maxFailedPasswordAttempts "default 5"
        integer lockoutMinutes "default 60"
        integer sessionIdleTimeoutSeconds "default 300"
        integer smsMaxAttempts "default 5"
        integer smsInitialRetrySeconds "default 60"
        timestamptz updatedAt "default now()"
        uuid updatedByProfileId FK "nullable"
    }

    PRIVATE_AUTH_SECURITY_STATES {
        uuid userId PK,FK
        integer consecutiveFailedAttempts "default 0"
        timestamptz lockedUntil "nullable"
        timestamptz lastFailedAt "nullable"
        timestamptz lastSuccessfulLoginAt "nullable"
        timestamptz lastPasswordChangedAt "nullable"
        boolean mustChangePassword "default false"
        text passwordChangeReason "nullable"
        timestamptz passwordChangeRequiredAt "nullable"
        uuid passwordChangeRequiredByProfileId FK "nullable"
        uuid passwordChangeReservationId "nullable"
        timestamptz passwordChangeReservedUntil "nullable"
        timestamptz updatedAt "default now()"
    }

    PRIVATE_PASSWORD_CHANGE_HISTORY {
        uuid id PK
        uuid userId FK
        timestamptz changedAt "default now()"
        text changeMethod
        uuid actorProfileId FK "nullable"
        uuid authAuditLogId "nullable"
        jsonb metadata "default empty object"
    }

    PRIVATE_APP_SESSIONS {
        uuid authSessionId PK
        uuid userId FK
        timestamptz createdAt "default now()"
        timestamptz lastActivityAt "default now()"
        timestamptz revokedAt "nullable"
        inet lastIpAddress "nullable"
        text userAgent "nullable"
    }

    AUTH_USERS ||--|| PUBLIC_PROFILES : owns
    AUTH_USERS ||--o| PRIVATE_AUTH_SECURITY_STATES : secured_by
    AUTH_USERS ||--o{ PRIVATE_PASSWORD_CHANGE_HISTORY : changes
    AUTH_USERS ||--o{ PRIVATE_APP_SESSIONS : opens
    PUBLIC_PROFILES o|--o{ PUBLIC_PROFILES : disables
    PUBLIC_PROFILES o|--o{ PRIVATE_PASSWORD_CHANGE_HISTORY : acts_for
    PUBLIC_PROFILES o|--o{ PRIVATE_AUTH_SECURITY_STATES : requires_change
    PUBLIC_PROFILES o|--o| PUBLIC_APP_SETTINGS : updates
```

## Academic structure and authorization

`PUBLIC_PROFILES` is a cross-domain reference drawn above.

```mermaid
erDiagram
    PUBLIC_ACADEMIC_YEARS {
        uuid id PK
        text code UK
        date startsOn
        date endsOn
        timestamptz createdAt "default now()"
    }

    PUBLIC_SEMESTERS {
        uuid id PK
        uuid academicYearId FK
        text code
        text name
        date startsOn
        date endsOn
        semester_status status "default PLANNED"
        timestamptz createdAt "default now()"
        timestamptz updatedAt "default now()"
    }

    PUBLIC_SECTIONS {
        uuid id PK
        text code UK
        text name
        boolean isActive "default true"
        timestamptz createdAt "default now()"
        timestamptz retiredAt "nullable"
    }

    PUBLIC_STUDENTS {
        uuid id PK
        uuid profileId FK,UK "nullable"
        text studentNumber UK
        text firstName
        text middleName "nullable"
        text lastName
        student_status status "default ACTIVE"
        timestamptz createdAt "default now()"
        timestamptz updatedAt "default now()"
    }

    PUBLIC_TEACHER_SECTION_ASSIGNMENTS {
        uuid id PK
        uuid teacherProfileId FK
        uuid sectionId FK
        uuid semesterId FK
        timestamptz assignedAt "default now()"
        uuid assignedByProfileId FK "nullable"
        timestamptz revokedAt "nullable"
        uuid revokedByProfileId FK "nullable"
        text revokeReason "nullable"
    }

    PUBLIC_STUDENT_SECTION_ENROLLMENTS {
        uuid id PK
        uuid studentId FK
        uuid sectionId FK
        uuid semesterId FK
        enrollment_status status "default ENROLLED"
        timestamptz enrolledAt "default now()"
        timestamptz endedAt "nullable"
        uuid createdByProfileId FK "nullable"
        uuid endedByProfileId FK "nullable"
        text endReason "nullable"
        timestamptz createdAt "default now()"
    }

    PUBLIC_PROFILES {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_ACADEMIC_YEARS ||--o{ PUBLIC_SEMESTERS : contains
    PUBLIC_PROFILES o|--o| PUBLIC_STUDENTS : portal_account
    PUBLIC_PROFILES ||--o{ PUBLIC_TEACHER_SECTION_ASSIGNMENTS : teaches
    PUBLIC_SECTIONS ||--o{ PUBLIC_TEACHER_SECTION_ASSIGNMENTS : authorizes
    PUBLIC_SEMESTERS ||--o{ PUBLIC_TEACHER_SECTION_ASSIGNMENTS : scopes
    PUBLIC_STUDENTS ||--o{ PUBLIC_STUDENT_SECTION_ENROLLMENTS : enrolls
    PUBLIC_SECTIONS ||--o{ PUBLIC_STUDENT_SECTION_ENROLLMENTS : contains
    PUBLIC_SEMESTERS ||--o{ PUBLIC_STUDENT_SECTION_ENROLLMENTS : scopes
    PUBLIC_PROFILES o|--o{ PUBLIC_TEACHER_SECTION_ASSIGNMENTS : assigns_or_revokes
    PUBLIC_PROFILES o|--o{ PUBLIC_STUDENT_SECTION_ENROLLMENTS : creates_or_ends
```

Important compound rules visible in the migration:

- `semesters`: unique (`academicYearId`, `code`); one partial-unique `ACTIVE` semester.
- `student_section_enrollments`: unique (`studentId`, `semesterId`) and unique (`id`, `studentId`).
- `teacher_section_assignments`: partial unique (`teacherProfileId`, `sectionId`, `semesterId`) while `revokedAt IS NULL`.
- `sections`: deferred trigger requires exactly five active sections at transaction commit.
- `students` is canonical for official student names; linked `profiles` names are trigger-maintained mirrors and reject direct divergence.

## Guardians, cards, and devices

`PUBLIC_STUDENTS` and `PUBLIC_PROFILES` are cross-domain references drawn above.

```mermaid
erDiagram
    PUBLIC_GUARDIANS {
        uuid id PK
        text firstName
        text middleName "nullable"
        text lastName
        text phoneE164
        boolean isActive "default true"
        timestamptz createdAt "default now()"
        timestamptz updatedAt "default now()"
    }

    PUBLIC_STUDENT_GUARDIANS {
        uuid id PK
        uuid studentId FK
        uuid guardianId FK
        text relationshipLabel
        boolean receivesSms "default true"
        date effectiveFrom "default Manila local date"
        date effectiveTo "nullable"
        timestamptz createdAt "default now()"
        uuid createdByProfileId FK "nullable"
    }

    PUBLIC_RFID_CARDS {
        uuid id PK
        text uid UK
        rfid_card_status status "default ENABLED"
        text label "nullable"
        timestamptz issuedAt "default now()"
        timestamptz statusChangedAt "default now()"
        text statusReason "nullable"
        uuid createdByProfileId FK "nullable"
    }

    PUBLIC_RFID_CARD_ASSIGNMENTS {
        uuid id PK
        uuid cardId FK
        uuid studentId FK
        timestamptz assignedAt "default now()"
        uuid assignedByProfileId FK "nullable"
        timestamptz unassignedAt "nullable"
        uuid unassignedByProfileId FK "nullable"
        rfid_assignment_end_reason endReason "nullable"
        text notes "nullable"
    }

    PUBLIC_RFID_DEVICES {
        uuid id PK
        text deviceCode UK
        text name
        text location
        rfid_device_status status "default ACTIVE"
        rfid_direction_mode directionMode "default AUTO"
        text firmwareVersion "nullable"
        timestamptz registeredAt "default now()"
        uuid registeredByProfileId FK "nullable"
        timestamptz lastSeenAt "nullable"
        timestamptz statusChangedAt "default now()"
        text statusReason "nullable"
    }

    PRIVATE_RFID_DEVICE_CREDENTIALS {
        uuid id PK
        uuid deviceId FK
        text keyPrefix
        bytea secretDigest UK
        timestamptz issuedAt "default now()"
        timestamptz expiresAt "nullable"
        timestamptz revokedAt "nullable"
        uuid createdByProfileId FK "nullable"
    }

    PUBLIC_STUDENTS {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_PROFILES {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_STUDENTS ||--o{ PUBLIC_STUDENT_GUARDIANS : has
    PUBLIC_GUARDIANS ||--o{ PUBLIC_STUDENT_GUARDIANS : relates
    PUBLIC_RFID_CARDS ||--o{ PUBLIC_RFID_CARD_ASSIGNMENTS : assignment_history
    PUBLIC_STUDENTS ||--o{ PUBLIC_RFID_CARD_ASSIGNMENTS : card_history
    PUBLIC_RFID_DEVICES ||--o{ PRIVATE_RFID_DEVICE_CREDENTIALS : authenticates
    PUBLIC_PROFILES o|--o{ PUBLIC_STUDENT_GUARDIANS : creates
    PUBLIC_PROFILES o|--o{ PUBLIC_RFID_CARDS : registers
    PUBLIC_PROFILES o|--o{ PUBLIC_RFID_CARD_ASSIGNMENTS : assigns_or_unassigns
    PUBLIC_PROFILES o|--o{ PUBLIC_RFID_DEVICES : registers
    PUBLIC_PROFILES o|--o{ PRIVATE_RFID_DEVICE_CREDENTIALS : issues
```

Important compound rules visible in the migration:

- `student_guardians` prevents overlapping effective periods for the same (`studentId`, `guardianId`).
- `student_guardians` has unique (`id`, `guardianId`) so notification rows cannot pair a relationship with the wrong guardian.
- `rfid_card_assignments` prevents overlapping assignment periods for both `cardId` and `studentId`.
- Partial unique indexes allow only one active assignment per card and one active card per student.
- RFID `uid` is canonical uppercase hexadecimal and globally unique.

## Scans, attendance, SMS, corrections, and audit

Small cross-domain reference boxes are included so every foreign-key path remains visible.

```mermaid
erDiagram
    PUBLIC_RFID_SCAN_EVENTS {
        uuid id PK
        uuid deviceId FK
        text eventKey
        text rawUid "nullable"
        timestamptz deviceScannedAt "nullable"
        timestamptz receivedAt "default clock_timestamp()"
        jsonb rawPayload "default empty object"
    }

    PUBLIC_ATTENDANCE_RECORDS {
        uuid id PK
        uuid studentId FK
        uuid sectionEnrollmentId FK
        date attendanceDate
        attendance_direction direction
        timestamptz occurredAt
        uuid sourceScanEventId FK,UK
        attendance_record_status status "default VALID"
        integer revision "default 0"
        timestamptz createdAt "default now()"
        timestamptz correctedAt "nullable"
    }

    PUBLIC_RFID_SCAN_RESULTS {
        uuid scanEventId PK,FK
        rfid_scan_outcome outcome
        text normalizedUid "nullable"
        uuid cardId FK "nullable"
        uuid cardAssignmentId FK "nullable"
        uuid studentId FK "nullable"
        uuid sectionEnrollmentId FK "nullable"
        date attendanceDate "nullable"
        attendance_direction decidedDirection "nullable"
        text reasonCode
        timestamptz processedAt "default clock_timestamp()"
        jsonb responsePayload "default empty object"
    }

    PUBLIC_SMS_NOTIFICATIONS {
        uuid id PK
        uuid attendanceRecordId FK
        uuid studentGuardianId FK "composite with guardianId"
        uuid guardianId FK "composite with studentGuardianId"
        sms_notification_kind kind
        text recipientName
        text recipientPhone
        text messageBody
        sms_notification_status status "default QUEUED"
        integer attemptCount "default 0"
        integer maxAttempts "default 5"
        timestamptz nextAttemptAt "nullable default now()"
        timestamptz lockedAt "nullable"
        text lockedBy "nullable"
        timestamptz sentAt "nullable"
        text lastErrorCode "nullable"
        text lastErrorMessage "nullable"
        timestamptz createdAt "default now()"
        timestamptz updatedAt "default now()"
    }

    PUBLIC_SMS_ATTEMPTS {
        uuid id PK
        uuid smsNotificationId FK
        integer attemptNumber
        text providerName
        text providerMessageId "nullable"
        sms_attempt_status status
        jsonb requestPayload "default empty object"
        jsonb responsePayload "default empty object"
        text errorCode "nullable"
        text errorMessage "nullable"
        timestamptz startedAt "default clock_timestamp()"
        timestamptz completedAt "nullable"
    }

    PUBLIC_ATTENDANCE_CORRECTIONS {
        uuid id PK
        uuid attendanceRecordId FK
        uuid sourceScanEventId FK
        integer expectedRevision
        date originalAttendanceDate
        attendance_direction originalDirection
        timestamptz originalOccurredAt
        attendance_record_status originalStatus
        date proposedAttendanceDate
        attendance_direction proposedDirection
        timestamptz proposedOccurredAt
        attendance_record_status proposedStatus
        text reason
        attendance_correction_status status "default PENDING"
        uuid requestedByProfileId FK
        timestamptz requestedAt "default now()"
        uuid reviewedByProfileId FK "nullable"
        timestamptz reviewedAt "nullable"
        text reviewNote "nullable"
        jsonb appliedValues "nullable"
    }

    PUBLIC_AUDIT_LOGS {
        uuid id PK
        audit_actor_type actorType "default SYSTEM"
        uuid actorProfileId FK "nullable"
        uuid actorDeviceId FK "nullable"
        text action
        text entitySchema "default public"
        text entityTable
        uuid entityId "nullable"
        jsonb oldValues "nullable"
        jsonb newValues "nullable"
        uuid requestId "nullable"
        inet ipAddress "nullable"
        text userAgent "nullable"
        timestamptz occurredAt "default clock_timestamp()"
    }

    PUBLIC_RFID_DEVICES {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_RFID_CARDS {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_RFID_CARD_ASSIGNMENTS {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_STUDENTS {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_STUDENT_SECTION_ENROLLMENTS {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_STUDENT_GUARDIANS {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_GUARDIANS {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_PROFILES {
        uuid id PK "cross-domain reference"
    }

    PUBLIC_RFID_DEVICES ||--o{ PUBLIC_RFID_SCAN_EVENTS : emits
    PUBLIC_RFID_SCAN_EVENTS ||--|| PUBLIC_RFID_SCAN_RESULTS : interpreted_as
    PUBLIC_RFID_SCAN_EVENTS ||--o| PUBLIC_ATTENDANCE_RECORDS : source
    PUBLIC_RFID_CARDS o|--o{ PUBLIC_RFID_SCAN_RESULTS : resolves
    PUBLIC_RFID_CARD_ASSIGNMENTS o|--o{ PUBLIC_RFID_SCAN_RESULTS : resolves
    PUBLIC_STUDENTS o|--o{ PUBLIC_RFID_SCAN_RESULTS : resolves
    PUBLIC_STUDENT_SECTION_ENROLLMENTS o|--o{ PUBLIC_RFID_SCAN_RESULTS : resolves
    PUBLIC_STUDENTS ||--o{ PUBLIC_ATTENDANCE_RECORDS : owns
    PUBLIC_STUDENT_SECTION_ENROLLMENTS ||--o{ PUBLIC_ATTENDANCE_RECORDS : scopes
    PUBLIC_ATTENDANCE_RECORDS ||--o{ PUBLIC_SMS_NOTIFICATIONS : queues
    PUBLIC_STUDENT_GUARDIANS ||--o{ PUBLIC_SMS_NOTIFICATIONS : recipient_relation
    PUBLIC_GUARDIANS ||--o{ PUBLIC_SMS_NOTIFICATIONS : recipient
    PUBLIC_SMS_NOTIFICATIONS ||--o{ PUBLIC_SMS_ATTEMPTS : attempts
    PUBLIC_ATTENDANCE_RECORDS ||--o{ PUBLIC_ATTENDANCE_CORRECTIONS : corrected_by
    PUBLIC_RFID_SCAN_EVENTS ||--o{ PUBLIC_ATTENDANCE_CORRECTIONS : preserves_source
    PUBLIC_PROFILES ||--o{ PUBLIC_ATTENDANCE_CORRECTIONS : requests_or_reviews
    PUBLIC_PROFILES o|--o{ PUBLIC_AUDIT_LOGS : user_actor
    PUBLIC_RFID_DEVICES o|--o{ PUBLIC_AUDIT_LOGS : device_actor
```

Important compound rules visible in the migration:

- `rfid_scan_events`: unique (`deviceId`, `eventKey`) provides database idempotency.
- Event-key replay also requires identical `rawUid`, `deviceScannedAt`, and `rawPayload`.
- `attendance_records`: unique `sourceScanEventId`; partial unique (`studentId`, `attendanceDate`, `direction`) while status is `VALID`.
- `sms_notifications`: unique (`attendanceRecordId`, `studentGuardianId`, `kind`).
- `sms_notifications`: composite (`studentGuardianId`, `guardianId`) FK enforces recipient relationship consistency.
- `sms_attempts`: unique (`smsNotificationId`, `attemptNumber`).
- Raw scans, scan results, SMS attempts, closed assignment history, password history, and audit rows are protected from destructive mutation.

## SQL example

Because multiword columns are case-sensitive quoted identifiers:

```sql
select
  s."studentNumber",
  s."firstName",
  s."lastName",
  ar."attendanceDate",
  ar."occurredAt"
from public.students as s
join public.attendance_records as ar
  on ar."studentId" = s.id;
```
