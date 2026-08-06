"use server";

import { createClient } from "@/lib/supabase/server";

import type { ForgotPasswordState } from "./types";

const genericResetMessage =
  "If an account exists for that email, a password reset link has been sent.";

export async function requestPasswordReset(
  _previousState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (!email || email.length > 320 || !email.includes("@") || !siteUrl) {
    return { message: genericResetMessage };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/Auth/Callback?next=/reset-password`,
  });

  return { message: genericResetMessage };
}
