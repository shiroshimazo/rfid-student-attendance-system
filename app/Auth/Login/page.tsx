import Link from "next/link";
import { Sms } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { LanyardStage } from "./_Components/LanyardStage";
import { PasswordField } from "./_Components/PasswordField";

export default function LoginPage() {
  return (
    <div className="auth-gradient grid min-h-screen flex-1 lg:grid-cols-2">
      {/* Left panel — 3D lanyard card. */}
      <div className="relative hidden h-screen lg:block">
        <LanyardStage />
        <div className="auth-divider absolute inset-y-0 right-0 w-px" />
      </div>

      {/* Right panel — login. */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="auth-card w-full max-w-[380px] rounded-2xl p-8">
          <div className="text-center">
            <h1 className="font-heading text-2xl font-medium text-auth-fg">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-auth-label">Sign in your account</p>
          </div>

          {/* TODO(auth): wire to a server action that verifies credentials and
              redirects by role. Field names are final; only the action is missing. */}
          <form className="mt-8 space-y-5">
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
                  placeholder="you@example.com"
                  className="h-11 rounded-lg border-auth-hairline bg-auth-field pl-10 text-sm text-auth-fg placeholder:text-auth-placeholder dark:bg-auth-field"
                />
              </div>
            </div>

            <PasswordField />

            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-auth-fg text-sm font-medium text-[var(--color-1)] hover:bg-auth-submit-hover"
            >
              Sign in
            </Button>
          </form>

          <Link
            href="/Auth/ForgotPassword"
            className="mt-6 inline-block text-[13px] text-auth-icon transition-colors hover:text-auth-fg"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
