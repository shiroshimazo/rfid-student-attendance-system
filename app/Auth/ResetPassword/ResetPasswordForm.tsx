"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updatePassword } from "./actions";
import { initialResetPasswordState } from "./types";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialResetPasswordState,
  );

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your Supabase project password policy is enforced when this form is
        submitted.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation">Confirm password</Label>
          <Input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {state.message ? (
          <p className="text-sm text-destructive" role="alert" aria-live="polite">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
