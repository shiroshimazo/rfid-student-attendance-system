begin;

set local timezone = 'UTC';

create or replace function private.reset_login_failures_after_password_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new."changeMethod" in ('PASSWORD_RECOVERY', 'ADMIN_FORCED') then
    update private.auth_security_states
    set "consecutiveFailedAttempts" = 0,
        "lastFailedAt" = null,
        "lockedUntil" = null,
        "updatedAt" = clock_timestamp()
    where "userId" = new."userId";
  end if;

  return new;
end;
$$;

create trigger password_change_history_reset_login_failures
after insert on private.password_change_history
for each row execute function private.reset_login_failures_after_password_change();

-- Remediate accounts that completed recovery shortly before this correction
-- was installed but then encountered the old stale-failure behavior.
update private.auth_security_states s
set "consecutiveFailedAttempts" = 0,
    "lastFailedAt" = null,
    "lockedUntil" = null,
    "updatedAt" = clock_timestamp()
where (
    s."consecutiveFailedAttempts" > 0
    or s."lastFailedAt" is not null
    or s."lockedUntil" is not null
  )
  and exists (
    select 1
    from private.password_change_history h
    where h."userId" = s."userId"
      and h."changeMethod" in ('PASSWORD_RECOVERY', 'ADMIN_FORCED')
      and h."changedAt" >= clock_timestamp() - interval '1 hour'
  );

commit;
