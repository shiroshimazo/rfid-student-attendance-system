"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  inspectLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/auth/login-rate-limit";
import { dashboardByRole, isAppRole } from "@/lib/auth/routes";
import { requestIp } from "@/lib/auth/request-context";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { LoginFormState } from "./types";

const genericAuthenticationError =
  "Unable to sign in. Check your credentials or try again later.";

type LoginSecurityState = {
  userId: string;
  consecutiveFailedAttempts: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  accountActive: boolean;
};

function failure(captchaRequired: boolean): LoginFormState {
  return { message: genericAuthenticationError, captchaRequired };
}

function firstRow<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function login(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const captchaToken = formData.get("captchaToken");

  if (
    !email ||
    email.length > 320 ||
    !email.includes("@") ||
    !password ||
    password.length > 4096
  ) {
    return failure(false);
  }

  const headerStore = await headers();
  const ipAddress = requestIp(headerStore);
  const localLimit = inspectLoginRateLimit(email, ipAddress);
  const admin = createAdminClient();
  const { data: rawSecurityState, error: securityStateError } = await admin.rpc(
    "login_security_state",
    { p_email: email },
  );

  if (securityStateError) {
    return failure(localLimit.captchaRequired);
  }

  const securityState = firstRow(
    rawSecurityState as LoginSecurityState[] | null,
  );
  const lockedUntil = securityState?.lockedUntil
    ? Date.parse(securityState.lockedUntil)
    : 0;
  const captchaRequired =
    localLimit.captchaRequired ||
    (securityState?.consecutiveFailedAttempts ?? 0) >= 3;

  if (
    localLimit.blocked ||
    lockedUntil > Date.now() ||
    (securityState && !securityState.accountActive)
  ) {
    return failure(captchaRequired);
  }

  const captchaValue =
    typeof captchaToken === "string" ? captchaToken.trim() : "";
  if (
    captchaRequired &&
    !(await verifyTurnstileToken(captchaValue, ipAddress))
  ) {
    return failure(true);
  }

  const supabase = await createClient();
  const { data: authData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
      ...(captchaValue
        ? { options: { captchaToken: captchaValue } }
        : undefined),
    });

  if (signInError || !authData.user) {
    const localState = recordLoginFailure(email, ipAddress);
    let databaseRequiresCaptcha = false;

    if (
      process.env.SUPABASE_PASSWORD_VERIFICATION_HOOK_ENABLED !== "true"
    ) {
      const { data } = await admin.rpc("record_failed_login_attempt", {
        p_email: email,
      });
      const recorded = firstRow(
        data as { consecutiveFailedAttempts: number }[] | null,
      );
      databaseRequiresCaptcha =
        (recorded?.consecutiveFailedAttempts ?? 0) >= 3;
    }

    return failure(
      localState.captchaRequired || databaseRequiresCaptcha,
    );
  }

  recordLoginSuccess(email);

  if (process.env.SUPABASE_PASSWORD_VERIFICATION_HOOK_ENABLED !== "true") {
    const { error } = await admin.rpc("record_successful_login", {
      p_user_id: authData.user.id,
    });
    if (error) {
      await supabase.auth.signOut({ scope: "local" });
      return failure(captchaRequired);
    }
  }

  const { data: refreshedSecurityData, error: refreshedSecurityError } =
    await admin.rpc("login_security_state", { p_email: email });
  const refreshedSecurity = firstRow(
    refreshedSecurityData as LoginSecurityState[] | null,
  );

  if (
    refreshedSecurityError ||
    !refreshedSecurity ||
    refreshedSecurity.userId !== authData.user.id ||
    !refreshedSecurity.accountActive
  ) {
    await supabase.auth.signOut({ scope: "local" });
    return failure(captchaRequired);
  }

  if (refreshedSecurity.mustChangePassword) {
    redirect("/reset-password?required=1");
  }

  const { error: touchError } = await supabase.rpc("touch_my_session", {
    p_ip_address: ipAddress === "unknown" ? null : ipAddress,
    p_user_agent: headerStore.get("user-agent")?.slice(0, 1000) ?? null,
  });

  if (touchError) {
    await supabase.auth.signOut({ scope: "local" });
    return failure(captchaRequired);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || !isAppRole(profile.role)) {
    await supabase.auth.signOut({ scope: "local" });
    return failure(captchaRequired);
  }

  redirect(dashboardByRole[profile.role]);
}
