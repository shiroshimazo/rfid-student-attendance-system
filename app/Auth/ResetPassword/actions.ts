"use server";

import { redirect } from "next/navigation";

import { changeAuthenticatedPassword } from "@/lib/auth/password-change";
import { recoveryPasswordError } from "@/lib/auth/recovery-validation";

import type { ResetPasswordState } from "./types";

const genericPasswordError =
  "Unable to change password. Check the configured password policy and try again.";

export async function updatePassword(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = formData.get("password");
  const confirmation = formData.get("passwordConfirmation");

  if (
    typeof password !== "string" ||
    typeof confirmation !== "string" ||
    recoveryPasswordError(password, confirmation)
  ) {
    return { message: genericPasswordError };
  }

  const result = await changeAuthenticatedPassword(
    password,
    "NEXTJS_RESET_PASSWORD",
  );

  if (!result.ok) {
    return { message: genericPasswordError };
  }

  redirect("/login?passwordChanged=1");
}
