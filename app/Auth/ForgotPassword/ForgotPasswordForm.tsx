"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordReset } from "./actions";
import { initialForgotPasswordState } from "./types";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialForgotPasswordState,
  );

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Enter your account email. The response is intentionally the same for
        known and unknown accounts.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
          />
        </div>

        {state.message ? (
          <p className="text-sm" role="status" aria-live="polite">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <Link href="/login" className="mt-5 inline-block text-sm underline">
        Back to sign in
      </Link>
    </div>
  );
}
