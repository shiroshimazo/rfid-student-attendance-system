begin;

set local timezone = 'UTC';

alter table private.password_change_history
  add column "reservationId" uuid;

create unique index password_change_history_reservation_uidx
  on private.password_change_history ("reservationId")
  where "reservationId" is not null;

comment on column private.password_change_history."reservationId" is
  'Idempotency key from begin_password_change; null only for history written before this corrective migration.';

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
  v_existing_method text;
  v_existing_actor_profile_id uuid;
  v_existing_metadata jsonb;
  v_history_found boolean;
  v_now timestamptz := clock_timestamp();
begin
  if p_user_id is null or p_reservation_id is null then
    raise exception 'userId and reservationId are required' using errcode = '22023';
  end if;

  if p_change_method is null or length(btrim(p_change_method)) not between 2 and 50 then
    raise exception 'changeMethod must contain 2 to 50 characters' using errcode = '22023';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'metadata must be a JSON object' using errcode = '22023';
  end if;

  select h."changeMethod", h."actorProfileId", h.metadata
  into v_existing_method, v_existing_actor_profile_id, v_existing_metadata
  from private.password_change_history h
  where h."userId" = p_user_id
    and h."reservationId" = p_reservation_id;
  v_history_found := found;

  if v_history_found then
    if v_existing_method is distinct from btrim(p_change_method)
      or v_existing_actor_profile_id is distinct from p_actor_profile_id
      or v_existing_metadata is distinct from p_metadata
    then
      raise exception 'Password change reservation was already completed with different values'
        using errcode = '55000';
    end if;

    return;
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
    -- A concurrent identical call may have completed while this call waited
    -- for the security-state row lock. Recheck history before rejecting it.
    select h."changeMethod", h."actorProfileId", h.metadata
    into v_existing_method, v_existing_actor_profile_id, v_existing_metadata
    from private.password_change_history h
    where h."userId" = p_user_id
      and h."reservationId" = p_reservation_id;
    v_history_found := found;

    if v_history_found then
      if v_existing_method is distinct from btrim(p_change_method)
        or v_existing_actor_profile_id is distinct from p_actor_profile_id
        or v_existing_metadata is distinct from p_metadata
      then
        raise exception 'Password change reservation was already completed with different values'
          using errcode = '55000';
      end if;

      return;
    end if;

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

  if btrim(p_change_method) in ('PASSWORD_RECOVERY', 'ADMIN_FORCED') then
    update private.app_sessions
    set "revokedAt" = v_now
    where "userId" = p_user_id
      and "revokedAt" is null;
  end if;

  insert into private.password_change_history (
    "userId",
    "reservationId",
    "changeMethod",
    "actorProfileId",
    metadata
  ) values (
    p_user_id,
    p_reservation_id,
    btrim(p_change_method),
    p_actor_profile_id,
    p_metadata
  );
end;
$$;

revoke execute on function public.complete_password_change(uuid, uuid, text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_password_change(uuid, uuid, text, uuid, jsonb)
  to service_role;

commit;
