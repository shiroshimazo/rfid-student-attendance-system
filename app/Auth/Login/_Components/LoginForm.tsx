"use client";

import { Sms } from "iconsax-reactjs";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { TurnstileChallenge } from "@/components/auth/TurnstileChallenge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { login } from "../actions";
import { initialLoginFormState } from "../types";
import { PasswordField } from "./PasswordField";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    login,
    initialLoginFormState,
  );

  return (
    <>
      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-[13px] font-normal text-auth-label"
          >
            Email
          </Label>

          <div className="relative">
            <Sms
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-auth-icon"
            />

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              placeholder="you@example.com"
              className="h-11 rounded-lg border-auth-hairline bg-auth-field pl-10 text-sm text-auth-fg placeholder:text-auth-placeholder"
            />
          </div>
        </div>

        <PasswordField />

        {state.captchaRequired ? (
          <TurnstileChallenge pending={pending} />
        ) : null}

        {state.message ? (
          <p
            className="animate-in fade-in slide-in-from-top-1 text-sm text-pretty text-auth-danger duration-200 ease-out motion-reduce:animate-none"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-lg bg-auth-fg text-sm font-medium text-brand-base transition-[scale,background-color,translate] duration-150 ease-out hover:bg-auth-submit-hover active:not-disabled:scale-[0.96] motion-reduce:active:not-disabled:scale-100"
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Link
        href="/forgot-password"
        className="relative mt-6 inline-block text-[13px] text-auth-link transition-colors after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 hover:text-auth-fg"
      >
        Forgot password?
      </Link>
    </>
  );
}
