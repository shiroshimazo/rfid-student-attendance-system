import "server-only";

import { createHmac } from "node:crypto";

type RequestBucket = {
  attempts: number;
  windowStartedAt: number;
  lastAttemptAt: number | null;
};

type VerificationBucket = {
  failures: number;
  windowStartedAt: number;
};

const globalForRecoveryRateLimit = globalThis as typeof globalThis & {
  recoveryRequestRateLimitStore?: Map<string, RequestBucket>;
  recoveryVerificationRateLimitStore?: Map<string, VerificationBucket>;
};

const requestStore =
  globalForRecoveryRateLimit.recoveryRequestRateLimitStore ??
  (globalForRecoveryRateLimit.recoveryRequestRateLimitStore = new Map());
const verificationStore =
  globalForRecoveryRateLimit.recoveryVerificationRateLimitStore ??
  (globalForRecoveryRateLimit.recoveryVerificationRateLimitStore = new Map());

function positiveInteger(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function requestConfig() {
  return {
    windowMs:
      positiveInteger("RECOVERY_REQUEST_WINDOW_SECONDS", 3600) * 1000,
    cooldownMs:
      positiveInteger("RECOVERY_REQUEST_COOLDOWN_SECONDS", 60) * 1000,
    accountMax: positiveInteger("RECOVERY_ACCOUNT_MAX_REQUESTS", 5),
    ipMax: positiveInteger("RECOVERY_IP_MAX_REQUESTS", 20),
    accountCaptchaAfter: positiveInteger(
      "RECOVERY_ACCOUNT_CAPTCHA_AFTER",
      2,
    ),
    ipCaptchaAfter: positiveInteger("RECOVERY_IP_CAPTCHA_AFTER", 10),
  };
}

function verificationConfig() {
  return {
    windowMs:
      positiveInteger("RECOVERY_VERIFY_WINDOW_SECONDS", 900) * 1000,
    accountMax: positiveInteger("RECOVERY_ACCOUNT_MAX_VERIFY_FAILURES", 6),
    ipMax: positiveInteger("RECOVERY_IP_MAX_VERIFY_FAILURES", 30),
    accountCaptchaAfter: positiveInteger(
      "RECOVERY_VERIFY_CAPTCHA_AFTER",
      3,
    ),
    ipCaptchaAfter: positiveInteger("RECOVERY_IP_VERIFY_CAPTCHA_AFTER", 15),
  };
}

function digest(kind: string, value: string) {
  const secret =
    process.env.AUTH_RATE_LIMIT_SECRET ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "development-only-rate-limit-secret";

  return `${kind}:${createHmac("sha256", secret)
    .update(value.trim().toLowerCase())
    .digest("hex")}`;
}

function requestBucket(key: string, now: number, windowMs: number) {
  const existing = requestStore.get(key);

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    const fresh: RequestBucket = {
      attempts: 0,
      windowStartedAt: now,
      lastAttemptAt: null,
    };
    requestStore.set(key, fresh);
    return fresh;
  }

  return existing;
}

function verificationBucket(key: string, now: number, windowMs: number) {
  const existing = verificationStore.get(key);

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    const fresh: VerificationBucket = { failures: 0, windowStartedAt: now };
    verificationStore.set(key, fresh);
    return fresh;
  }

  return existing;
}

function secondsRemaining(deadline: number, now: number) {
  return Math.max(1, Math.ceil((deadline - now) / 1000));
}

export function inspectRecoveryRequestLimit(account: string, ipAddress: string) {
  const now = Date.now();
  const limits = requestConfig();
  const accountBucket = requestBucket(
    digest("recovery-request-account", account),
    now,
    limits.windowMs,
  );
  const ipBucket = requestBucket(
    digest("recovery-request-ip", ipAddress),
    now,
    limits.windowMs,
  );
  const accountBlocked = accountBucket.attempts >= limits.accountMax;
  const ipBlocked = ipBucket.attempts >= limits.ipMax;
  const cooldownDeadline =
    (accountBucket.lastAttemptAt ?? 0) + limits.cooldownMs;
  const cooldownActive = cooldownDeadline > now;
  const retryDeadlines = [
    ...(accountBlocked
      ? [accountBucket.windowStartedAt + limits.windowMs]
      : []),
    ...(ipBlocked ? [ipBucket.windowStartedAt + limits.windowMs] : []),
    ...(cooldownActive ? [cooldownDeadline] : []),
  ];

  return {
    blocked: accountBlocked || ipBlocked,
    cooldownActive,
    captchaRequired:
      accountBucket.attempts >= limits.accountCaptchaAfter ||
      ipBucket.attempts >= limits.ipCaptchaAfter,
    retryAfterSeconds:
      retryDeadlines.length > 0
        ? secondsRemaining(Math.max(...retryDeadlines), now)
        : 0,
  };
}

export function recordRecoveryRequest(account: string, ipAddress: string) {
  const now = Date.now();
  const limits = requestConfig();
  const accountBucket = requestBucket(
    digest("recovery-request-account", account),
    now,
    limits.windowMs,
  );
  const ipBucket = requestBucket(
    digest("recovery-request-ip", ipAddress),
    now,
    limits.windowMs,
  );

  accountBucket.attempts += 1;
  accountBucket.lastAttemptAt = now;
  ipBucket.attempts += 1;
  ipBucket.lastAttemptAt = now;

  return inspectRecoveryRequestLimit(account, ipAddress);
}

export function inspectRecoveryVerificationLimit(
  account: string,
  ipAddress: string,
) {
  const now = Date.now();
  const limits = verificationConfig();
  const accountBucket = verificationBucket(
    digest("recovery-verify-account", account),
    now,
    limits.windowMs,
  );
  const ipBucket = verificationBucket(
    digest("recovery-verify-ip", ipAddress),
    now,
    limits.windowMs,
  );
  const accountBlocked = accountBucket.failures >= limits.accountMax;
  const ipBlocked = ipBucket.failures >= limits.ipMax;
  const retryDeadlines = [
    ...(accountBlocked
      ? [accountBucket.windowStartedAt + limits.windowMs]
      : []),
    ...(ipBlocked ? [ipBucket.windowStartedAt + limits.windowMs] : []),
  ];

  return {
    blocked: accountBlocked || ipBlocked,
    captchaRequired:
      accountBucket.failures >= limits.accountCaptchaAfter ||
      ipBucket.failures >= limits.ipCaptchaAfter,
    retryAfterSeconds:
      retryDeadlines.length > 0
        ? secondsRemaining(Math.max(...retryDeadlines), now)
        : 0,
  };
}

export function recordRecoveryVerificationFailure(
  account: string,
  ipAddress: string,
) {
  const now = Date.now();
  const limits = verificationConfig();
  const accountBucket = verificationBucket(
    digest("recovery-verify-account", account),
    now,
    limits.windowMs,
  );
  const ipBucket = verificationBucket(
    digest("recovery-verify-ip", ipAddress),
    now,
    limits.windowMs,
  );

  accountBucket.failures += 1;
  ipBucket.failures += 1;

  return inspectRecoveryVerificationLimit(account, ipAddress);
}

export function clearRecoveryVerificationFailures(account: string) {
  verificationStore.delete(digest("recovery-verify-account", account));
}
