import "server-only";

import { recordLoginSuccess } from "@/lib/auth/login-rate-limit";
import { recoveryPasswordError } from "@/lib/auth/recovery-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PasswordChangeSource =
  | "NEXTJS_RECOVERY_OTP"
  | "NEXTJS_RESET_PASSWORD";

type SecurityState = {
  userId: string;
  mustChangePassword: boolean;
  accountActive: boolean;
};

export type PasswordChangeResult =
  | { ok: true }
  | { ok: false; reason: "SESSION" | "POLICY" | "SYSTEM" };

function firstRow<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function logPasswordChangeFailure(stage: string, error: unknown) {
  const details =
    error && typeof error === "object"
      ? {
          name: "name" in error ? String(error.name) : undefined,
          code: "code" in error ? String(error.code) : undefined,
          status: "status" in error ? String(error.status) : undefined,
          message: "message" in error ? String(error.message) : undefined,
        }
      : { message: String(error) };

  console.error("Password change failed", { stage, ...details });
}

export async function changeAuthenticatedPassword(
  password: string,
  source: PasswordChangeSource,
): Promise<PasswordChangeResult> {
  if (recoveryPasswordError(password, password)) {
    return { ok: false, reason: "POLICY" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return { ok: false, reason: "SESSION" };
    }

    const admin = createAdminClient();
    const { data: securityRows, error: securityError } = await admin.rpc(
      "login_security_state",
      { p_email: user.email },
    );
    const securityState = firstRow(
      securityRows as SecurityState[] | SecurityState | null,
    );

    if (
      securityError ||
      !securityState ||
      securityState.userId !== user.id ||
      !securityState.accountActive
    ) {
      if (securityError) {
        logPasswordChangeFailure("security-state", securityError);
      }
      return { ok: false, reason: "SESSION" };
    }

    const { data: reservationId, error: reservationError } = await admin.rpc(
      "begin_password_change",
      { p_user_id: user.id },
    );

    if (reservationError || typeof reservationId !== "string") {
      logPasswordChangeFailure(
        "reservation",
        reservationError ?? new Error("Missing reservation identifier"),
      );
      return { ok: false, reason: "SYSTEM" };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      const { error: cancellationError } = await admin.rpc(
        "cancel_password_change",
        {
          p_user_id: user.id,
          p_reservation_id: reservationId,
        },
      );

      if (cancellationError) {
        logPasswordChangeFailure("reservation-cancel", cancellationError);
      }

      return { ok: false, reason: "POLICY" };
    }

    const completionArguments = {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_change_method: securityState.mustChangePassword
        ? "ADMIN_FORCED"
        : "PASSWORD_RECOVERY",
      p_actor_profile_id: user.id,
      p_metadata: { completedThrough: source },
    };
    let completionError: unknown = null;

    // The corrective migration makes this RPC idempotent by reservation ID,
    // so retrying a transient response failure cannot duplicate audit history.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const completion = await admin.rpc(
        "complete_password_change",
        completionArguments,
      );
      completionError = completion.error;
      if (!completion.error) {
        break;
      }
    }

    if (completionError) {
      logPasswordChangeFailure("completion", completionError);
      return { ok: false, reason: "SYSTEM" };
    }

    // Recovery establishes control of the account, so stale process-local
    // failures must not force the user through CAPTCHA with the new password.
    recordLoginSuccess(user.email);

    const { error: globalSignOutError } = await supabase.auth.signOut({
      scope: "global",
    });

    if (globalSignOutError) {
      logPasswordChangeFailure("global-sign-out", globalSignOutError);
      await supabase.auth.signOut({ scope: "local" });
    }

    return { ok: true };
  } catch (error) {
    logPasswordChangeFailure("unexpected", error);
    return { ok: false, reason: "SYSTEM" };
  }
}
