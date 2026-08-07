export const RECOVERY_OTP_LENGTH = 6;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 4096;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recoveryOtpPattern = /^\d{6}$/;

export function normalizeRecoveryEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function recoveryEmailError(email: string) {
  if (!email || email.length > 320 || !emailPattern.test(email)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function normalizeRecoveryOtp(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function recoveryOtpError(otp: string) {
  if (!recoveryOtpPattern.test(otp)) {
    return "Enter the six-digit verification code.";
  }

  return null;
}

export type PasswordPolicyChecks = {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
};

export function passwordPolicyChecks(password: string): PasswordPolicyChecks {
  return {
    hasMinLength:
      password.length >= MIN_PASSWORD_LENGTH &&
      password.length <= MAX_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function recoveryPasswordError(
  password: string,
  confirmation: string,
) {
  const checks = passwordPolicyChecks(password);

  if (!Object.values(checks).every(Boolean)) {
    return "Use at least 12 characters with uppercase, lowercase, number, and symbol.";
  }

  if (password !== confirmation) {
    return "Passwords do not match.";
  }

  return null;
}
