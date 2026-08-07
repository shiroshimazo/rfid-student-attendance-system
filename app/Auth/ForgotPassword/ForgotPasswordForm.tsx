"use client";

import {
  CloseCircle,
  Eye,
  EyeSlash,
  Lock,
  Sms,
  TickCircle,
} from "iconsax-reactjs";
import Link from "next/link";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { TurnstileChallenge } from "@/components/auth/TurnstileChallenge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  passwordPolicyChecks,
  RECOVERY_OTP_LENGTH,
} from "@/lib/auth/recovery-validation";

import {
  completeRecoveryPassword,
  requestRecoveryCode,
  verifyRecoveryCode,
} from "./actions";
import {
  initialRecoveryPasswordState,
  initialRecoveryRequestState,
  initialRecoveryVerificationState,
} from "./types";

type RecoveryTarget = {
  email: string;
  cooldownSeconds: number;
  captchaRequired: boolean;
};

export function ForgotPasswordForm() {
  const [target, setTarget] = useState<RecoveryTarget | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleCodeSent = useCallback(
    (
      email: string,
      cooldownSeconds: number,
      captchaRequired: boolean,
    ) => {
      setTarget({ email, cooldownSeconds, captchaRequired });
    },
    [],
  );

  if (completed) {
    return <PasswordUpdated />;
  }

  if (target) {
    return (
      <RecoveryVerification
        target={target}
        onChangeEmail={() => setTarget(null)}
        onCompleted={() => setCompleted(true)}
      />
    );
  }

  return <EmailRequest onCodeSent={handleCodeSent} />;
}

function EmailRequest({
  onCodeSent,
}: {
  onCodeSent: (
    email: string,
    cooldownSeconds: number,
    captchaRequired: boolean,
  ) => void;
}) {
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(
    requestRecoveryCode,
    initialRecoveryRequestState,
  );
  const handledSubmissionId = useRef<string | null>(null);

  useEffect(() => {
    if (
      state.status !== "sent" ||
      !state.submissionId ||
      handledSubmissionId.current === state.submissionId
    ) {
      return;
    }

    handledSubmissionId.current = state.submissionId;
    onCodeSent(
      email.trim().toLowerCase(),
      state.retryAfterSeconds,
      state.captchaRequired,
    );
  }, [email, onCodeSent, state]);

  return (
    <>
      <div className="text-center">
        <h1 className="font-heading text-2xl font-medium text-auth-fg">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-auth-label">
          Enter your email to receive a six-digit verification code.
        </p>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="recovery-email"
            className="text-[13px] font-normal text-auth-label"
          >
            Email Address
          </Label>

          <div className="relative">
            <Sms
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-auth-icon"
            />
            <Input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-lg border-auth-hairline bg-auth-field pl-10 text-sm text-auth-fg placeholder:text-auth-placeholder dark:bg-auth-field"
            />
          </div>
        </div>

        {state.captchaRequired ? (
          <TurnstileChallenge pending={pending} />
        ) : null}

        {state.message ? (
          <p
            className={
              state.status === "error"
                ? "text-sm text-red-500"
                : "text-sm text-auth-label"
            }
            role={state.status === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={pending || !email.trim()}
          className="h-11 w-full rounded-lg bg-auth-fg text-sm font-medium text-[var(--color-1)] hover:bg-auth-submit-hover"
        >
          {pending ? "Sending Code…" : "Send Verification Code"}
        </Button>
      </form>

      <BackToSignIn />
    </>
  );
}

function RecoveryVerification({
  target,
  onChangeEmail,
  onCompleted,
}: {
  target: RecoveryTarget;
  onChangeEmail: () => void;
  onCompleted: () => void;
}) {
  const [verified, setVerified] = useState(false);
  const [resendState, resendAction, resendPending] = useActionState(
    requestRecoveryCode,
    {
      ...initialRecoveryRequestState,
      captchaRequired: target.captchaRequired,
    },
  );
  const resendResultKey = resendState.submissionId ?? "initial-request";
  const resendCooldown = resendState.submissionId
    ? resendState.retryAfterSeconds
    : target.cooldownSeconds;

  return (
    <>
      <div className="text-center">
        <h1 className="font-heading text-2xl font-medium text-auth-fg">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-auth-label">
          {verified ? "Choose a new password for " : "Enter the code sent to "}
          <span className="font-semibold text-auth-fg">{target.email}</span>
          .
        </p>
      </div>

      {verified ? (
        <PasswordForm onCompleted={onCompleted} />
      ) : (
        <>
          <VerifyCodeForm
            key={resendResultKey}
            email={target.email}
            onVerified={() => setVerified(true)}
          />

          <form action={resendAction} className="mt-5 space-y-3">
            <input type="hidden" name="email" value={target.email} />

            {resendState.captchaRequired ? (
              <TurnstileChallenge pending={resendPending} />
            ) : null}

            {resendState.message ? (
              <p
                className={
                  resendState.status === "error"
                    ? "text-sm text-red-500"
                    : "text-sm text-auth-label"
                }
                role={resendState.status === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {resendState.message}
              </p>
            ) : null}

            <div className="flex items-center justify-between text-[13px]">
              <ResendButton
                key={resendResultKey}
                pending={resendPending}
                initialSeconds={resendCooldown}
              />
              <button
                type="button"
                onClick={onChangeEmail}
                disabled={resendPending}
                className="text-auth-icon transition-colors hover:text-auth-fg disabled:opacity-50"
              >
                Change Email
              </button>
            </div>
          </form>
        </>
      )}

      <BackToSignIn />
    </>
  );
}

function ResendButton({
  pending,
  initialSeconds,
}: {
  pending: boolean;
  initialSeconds: number;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <button
      type="submit"
      disabled={pending || seconds > 0}
      className="text-auth-icon transition-colors hover:text-auth-fg disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending
        ? "Sending…"
        : seconds > 0
          ? `Resend in ${seconds}s`
          : "Resend Code"}
    </button>
  );
}

function VerifyCodeForm({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => void;
}) {
  const [otp, setOtp] = useState<string[]>(
    Array.from({ length: RECOVERY_OTP_LENGTH }, () => ""),
  );
  const [state, formAction, pending] = useActionState(
    verifyRecoveryCode,
    initialRecoveryVerificationState,
  );
  const handledSubmissionId = useRef<string | null>(null);
  const code = otp.join("");

  useEffect(() => {
    if (
      state.status !== "verified" ||
      !state.submissionId ||
      handledSubmissionId.current === state.submissionId
    ) {
      return;
    }

    handledSubmissionId.current = state.submissionId;
    onVerified();
  }, [onVerified, state]);

  const applyCode = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, RECOVERY_OTP_LENGTH);
    const digits = Array.from(
      { length: RECOVERY_OTP_LENGTH },
      (_, index) => cleaned[index] ?? "",
    );
    setOtp(digits);
    const focusIndex = Math.max(
      0,
      Math.min(cleaned.length, RECOVERY_OTP_LENGTH) - 1,
    );
    document.getElementById(`recovery-otp-${focusIndex}`)?.focus();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    if (index === 0 && value.length > 1) {
      applyCode(value);
      return;
    }

    const digits = [...otp];
    digits[index] = value.slice(-1);
    setOtp(digits);

    if (value && index < RECOVERY_OTP_LENGTH - 1) {
      document.getElementById(`recovery-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      event.preventDefault();
      const digits = [...otp];
      digits[index - 1] = "";
      setOtp(digits);
      document.getElementById(`recovery-otp-${index - 1}`)?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      document.getElementById(`recovery-otp-${index - 1}`)?.focus();
    }

    if (event.key === "ArrowRight" && index < RECOVERY_OTP_LENGTH - 1) {
      event.preventDefault();
      document.getElementById(`recovery-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) {
      return;
    }

    event.preventDefault();
    applyCode(pasted);
  };

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="otp" value={code} />

      <fieldset disabled={pending} className="space-y-2">
        <legend className="text-[13px] font-normal text-auth-label">
          Six-Digit Verification Code
        </legend>
        <div className="grid grid-cols-6 gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`recovery-otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={index === 0 ? RECOVERY_OTP_LENGTH : 1}
              value={digit}
              onChange={(event) => handleOtpChange(index, event.target.value)}
              onKeyDown={(event) => handleOtpKeyDown(index, event)}
              onPaste={handleOtpPaste}
              className="h-12 w-full min-w-0 rounded-lg border border-auth-hairline bg-auth-field text-center text-base font-medium text-auth-fg outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 dark:bg-auth-field"
              aria-label={`Verification code digit ${index + 1}`}
            />
          ))}
        </div>
      </fieldset>

      {state.captchaRequired ? (
        <TurnstileChallenge pending={pending} />
      ) : null}

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "flex items-center gap-1.5 text-sm text-red-500"
              : "flex items-center gap-1.5 text-sm text-green-500"
          }
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.status === "error" ? (
            <CloseCircle size={16} aria-hidden="true" />
          ) : (
            <TickCircle size={16} aria-hidden="true" />
          )}
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || code.length !== RECOVERY_OTP_LENGTH}
        className="h-11 w-full rounded-lg bg-auth-fg text-sm font-medium text-[var(--color-1)] hover:bg-auth-submit-hover disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify Code"}
      </Button>
    </form>
  );
}

function PasswordForm({ onCompleted }: { onCompleted: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, pending] = useActionState(
    completeRecoveryPassword,
    initialRecoveryPasswordState,
  );
  const checks = passwordPolicyChecks(newPassword);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const allRequirementsMet =
    Object.values(checks).every(Boolean) && passwordsMatch;

  useEffect(() => {
    if (state.status === "success") {
      onCompleted();
    }
  }, [onCompleted, state.status]);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <p
        className="flex items-center gap-1.5 text-sm text-green-500"
        role="status"
      >
        <TickCircle size={16} aria-hidden="true" />
        Code verified
      </p>

      <PasswordInput
        id="new-password"
        name="password"
        label="New Password"
        value={newPassword}
        show={showNewPassword}
        disabled={pending}
        onChange={setNewPassword}
        onToggle={() => setShowNewPassword((current) => !current)}
      />

      <PasswordInput
        id="confirm-password"
        name="passwordConfirmation"
        label="Confirm New Password"
        value={confirmPassword}
        show={showConfirmPassword}
        disabled={pending}
        onChange={setConfirmPassword}
        onToggle={() => setShowConfirmPassword((current) => !current)}
      />

      <div className="space-y-2">
        <p className="text-[13px] font-normal text-auth-label">
          Password Requirements
        </p>
        <div className="space-y-1.5 text-sm">
          <RequirementItem
            met={checks.hasMinLength}
            text="Minimum 12 characters"
          />
          <RequirementItem
            met={checks.hasUppercase}
            text="At least one uppercase letter"
          />
          <RequirementItem
            met={checks.hasLowercase}
            text="At least one lowercase letter"
          />
          <RequirementItem
            met={checks.hasNumber}
            text="At least one number"
          />
          <RequirementItem
            met={checks.hasSymbol}
            text="At least one symbol"
          />
        </div>
      </div>

      {confirmPassword ? (
        <p
          className={
            passwordsMatch
              ? "flex items-center gap-1.5 text-sm text-green-500"
              : "flex items-center gap-1.5 text-sm text-red-500"
          }
          role="status"
          aria-live="polite"
        >
          {passwordsMatch ? (
            <TickCircle size={16} aria-hidden="true" />
          ) : (
            <CloseCircle size={16} aria-hidden="true" />
          )}
          {passwordsMatch ? "Passwords match" : "Passwords do not match"}
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="text-sm text-red-500" role="alert" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={!allRequirementsMet || pending}
        className="h-11 w-full rounded-lg bg-auth-fg text-sm font-medium text-[var(--color-1)] hover:bg-auth-submit-hover disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}

function PasswordInput({
  id,
  name,
  label,
  value,
  show,
  disabled,
  onChange,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  show: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[13px] font-normal text-auth-label">
        {label}
      </Label>
      <div className="relative">
        <Lock
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-auth-icon"
        />
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          maxLength={4096}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="••••••••••••"
          className="h-11 rounded-lg border-auth-hairline bg-auth-field pr-11 pl-10 text-sm text-auth-fg placeholder:text-auth-placeholder dark:bg-auth-field"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-auth-icon transition-colors outline-none hover:text-auth-fg focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          {show ? (
            <EyeSlash size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${
        met ? "text-green-500" : "text-auth-icon"
      }`}
    >
      {met ? (
        <TickCircle size={16} aria-hidden="true" />
      ) : (
        <CloseCircle size={16} aria-hidden="true" />
      )}
      <span>{text}</span>
    </div>
  );
}

function PasswordUpdated() {
  return (
    <div className="text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
        <TickCircle size={32} className="text-green-500" aria-hidden="true" />
      </div>
      <h1 className="font-heading text-2xl font-medium text-auth-fg">
        Password Updated
      </h1>
      <p className="mt-2 text-sm text-auth-label">
        Your password has been updated. Sign in again on every device.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-auth-fg text-sm font-medium text-[var(--color-1)] transition-colors hover:bg-auth-submit-hover"
      >
        Back to Sign In
      </Link>
    </div>
  );
}

function BackToSignIn() {
  return (
    <Link
      href="/login"
      className="mt-6 inline-block text-[13px] text-auth-icon transition-colors hover:text-auth-fg"
    >
      Back to Sign In
    </Link>
  );
}
