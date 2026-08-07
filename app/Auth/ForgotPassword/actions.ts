"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { changeAuthenticatedPassword } from "@/lib/auth/password-change";
import {
  clearRecoveryVerificationFailures,
  inspectRecoveryRequestLimit,
  inspectRecoveryVerificationLimit,
  recordRecoveryRequest,
  recordRecoveryVerificationFailure,
} from "@/lib/auth/recovery-rate-limit";
import {
  normalizeRecoveryEmail,
  normalizeRecoveryOtp,
  recoveryEmailError,
  recoveryOtpError,
  recoveryPasswordError,
} from "@/lib/auth/recovery-validation";
import { requestIp } from "@/lib/auth/request-context";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { createClient } from "@/lib/supabase/server";

import type {
  RecoveryPasswordState,
  RecoveryRequestState,
  RecoveryVerificationState,
} from "./types";

const genericRequestMessage =
  "If this email is registered, a six-digit verification code has been sent.";
const requestLimitMessage =
  "Please wait before requesting another verification code.";
const invalidCodeMessage =
  "The verification code is invalid or expired. Request a new code and try again.";
const genericPasswordError =
  "Unable to update the password. Request a new code and try again.";

function captchaValue(formData: FormData) {
  const value = formData.get("captchaToken");
  return typeof value === "string" ? value.trim() : "";
}

function logRecoveryProviderFailure(stage: string, error: unknown) {
  const details =
    error && typeof error === "object"
      ? {
          name: "name" in error ? String(error.name) : undefined,
          code: "code" in error ? String(error.code) : undefined,
          status: "status" in error ? String(error.status) : undefined,
        }
      : undefined;

  console.error("Password recovery provider request failed", {
    stage,
    ...details,
  });
}

export async function requestRecoveryCode(
  _previousState: RecoveryRequestState,
  formData: FormData,
): Promise<RecoveryRequestState> {
  const email = normalizeRecoveryEmail(formData.get("email"));
  const emailError = recoveryEmailError(email);

  if (emailError) {
    return {
      status: "error",
      message: emailError,
      captchaRequired: false,
      retryAfterSeconds: 0,
      submissionId: randomUUID(),
    };
  }

  const headerStore = await headers();
  const ipAddress = requestIp(headerStore);
  const limit = inspectRecoveryRequestLimit(email, ipAddress);

  if (limit.blocked || limit.cooldownActive) {
    return {
      status: "error",
      message: requestLimitMessage,
      captchaRequired: limit.captchaRequired,
      retryAfterSeconds: limit.retryAfterSeconds,
      submissionId: randomUUID(),
    };
  }

  const token = captchaValue(formData);
  if (limit.captchaRequired && !(await verifyTurnstileToken(token, ipAddress))) {
    return {
      status: "error",
      message: "Complete the security challenge and try again.",
      captchaRequired: true,
      retryAfterSeconds: 0,
      submissionId: randomUUID(),
    };
  }

  const postRequestLimit = recordRecoveryRequest(email, ipAddress);
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    ...(siteUrl
      ? { redirectTo: `${siteUrl}/Auth/Callback?next=/reset-password` }
      : undefined),
    ...(token ? { captchaToken: token } : undefined),
  });

  // Account existence and provider availability are intentionally hidden.
  if (error) {
    logRecoveryProviderFailure("request-code", error);
  }

  return {
    status: "sent",
    message: genericRequestMessage,
    captchaRequired: postRequestLimit.captchaRequired,
    retryAfterSeconds: postRequestLimit.retryAfterSeconds,
    submissionId: randomUUID(),
  };
}

export async function verifyRecoveryCode(
  _previousState: RecoveryVerificationState,
  formData: FormData,
): Promise<RecoveryVerificationState> {
  const email = normalizeRecoveryEmail(formData.get("email"));
  const otp = normalizeRecoveryOtp(formData.get("otp"));

  if (recoveryEmailError(email) || recoveryOtpError(otp)) {
    return {
      status: "error",
      message: invalidCodeMessage,
      captchaRequired: false,
      retryAfterSeconds: 0,
      submissionId: randomUUID(),
    };
  }

  const headerStore = await headers();
  const ipAddress = requestIp(headerStore);
  const limit = inspectRecoveryVerificationLimit(email, ipAddress);

  if (limit.blocked) {
    return {
      status: "error",
      message: "Too many verification attempts. Wait and request a new code.",
      captchaRequired: true,
      retryAfterSeconds: limit.retryAfterSeconds,
      submissionId: randomUUID(),
    };
  }

  const token = captchaValue(formData);
  if (limit.captchaRequired && !(await verifyTurnstileToken(token, ipAddress))) {
    return {
      status: "error",
      message: "Complete the security challenge and try again.",
      captchaRequired: true,
      retryAfterSeconds: 0,
      submissionId: randomUUID(),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "recovery",
    ...(token ? { options: { captchaToken: token } } : undefined),
  });

  if (error || !data.user || !data.session) {
    if (error) {
      logRecoveryProviderFailure("verify-code", error);
    }
    const postFailureLimit = recordRecoveryVerificationFailure(
      email,
      ipAddress,
    );
    return {
      status: "error",
      message: invalidCodeMessage,
      captchaRequired: postFailureLimit.captchaRequired,
      retryAfterSeconds: postFailureLimit.retryAfterSeconds,
      submissionId: randomUUID(),
    };
  }

  clearRecoveryVerificationFailures(email);
  return {
    status: "verified",
    message: "Code verified. Choose a new password.",
    captchaRequired: false,
    retryAfterSeconds: 0,
    submissionId: randomUUID(),
  };
}

export async function completeRecoveryPassword(
  _previousState: RecoveryPasswordState,
  formData: FormData,
): Promise<RecoveryPasswordState> {
  const password = formData.get("password");
  const confirmation = formData.get("passwordConfirmation");

  if (typeof password !== "string" || typeof confirmation !== "string") {
    return { status: "error", message: genericPasswordError };
  }

  const validationError = recoveryPasswordError(password, confirmation);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const result = await changeAuthenticatedPassword(
    password,
    "NEXTJS_RECOVERY_OTP",
  );

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "POLICY"
          ? "The password does not meet the configured security policy."
          : genericPasswordError,
    };
  }

  return {
    status: "success",
    message: "Your password has been updated successfully.",
  };
}
