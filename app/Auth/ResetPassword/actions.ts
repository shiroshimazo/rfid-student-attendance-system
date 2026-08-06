"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { ResetPasswordState } from "./types";

const genericPasswordError =
  "Unable to change password. Check the configured password policy and try again.";

type SecurityState = {
  mustChangePassword: boolean;
};

export async function updatePassword(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = formData.get("password");
  const confirmation = formData.get("passwordConfirmation");

  if (
    typeof password !== "string" ||
    typeof confirmation !== "string" ||
    !password ||
    password.length > 4096 ||
    password !== confirmation
  ) {
    return { message: genericPasswordError };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return { message: genericPasswordError };
  }

  const admin = createAdminClient();
  const { data: securityRows } = await admin.rpc("login_security_state", {
    p_email: user.email,
  });
  const securityState = Array.isArray(securityRows)
    ? ((securityRows[0] as SecurityState | undefined) ?? null)
    : (securityRows as SecurityState | null);
  const { data: reservationId, error: reservationError } = await admin.rpc(
    "begin_password_change",
    { p_user_id: user.id },
  );

  if (reservationError || typeof reservationId !== "string") {
    return { message: genericPasswordError };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    await admin.rpc("cancel_password_change", {
      p_user_id: user.id,
      p_reservation_id: reservationId,
    });
    return { message: genericPasswordError };
  }

  const { error: completionError } = await admin.rpc(
    "complete_password_change",
    {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_change_method: securityState?.mustChangePassword
        ? "ADMIN_FORCED"
        : "PASSWORD_RECOVERY",
      p_actor_profile_id: user.id,
      p_metadata: { completedThrough: "NEXTJS_RESET_PASSWORD" },
    },
  );

  if (completionError) {
    return { message: genericPasswordError };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?passwordChanged=1");
}
