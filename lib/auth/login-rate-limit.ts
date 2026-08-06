import "server-only";

import { createHmac } from "node:crypto";

type Bucket = {
  attempts: number;
  windowStartedAt: number;
};

type RateLimitStore = Map<string, Bucket>;

const globalForRateLimit = globalThis as typeof globalThis & {
  loginRateLimitStore?: RateLimitStore;
};

const store =
  globalForRateLimit.loginRateLimitStore ??
  (globalForRateLimit.loginRateLimitStore = new Map());

function positiveInteger(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function config() {
  return {
    windowMs: positiveInteger("AUTH_RATE_LIMIT_WINDOW_SECONDS", 3600) * 1000,
    accountMaxAttempts: positiveInteger("AUTH_ACCOUNT_MAX_ATTEMPTS", 5),
    ipMaxAttempts: positiveInteger("AUTH_IP_MAX_ATTEMPTS", 20),
    accountCaptchaAfter: positiveInteger("AUTH_ACCOUNT_CAPTCHA_AFTER", 3),
    ipCaptchaAfter: positiveInteger("AUTH_IP_CAPTCHA_AFTER", 10),
  };
}

function digest(kind: "account" | "ip", value: string) {
  const secret =
    process.env.AUTH_RATE_LIMIT_SECRET ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "development-only-rate-limit-secret";

  return `${kind}:${createHmac("sha256", secret)
    .update(value.trim().toLowerCase())
    .digest("hex")}`;
}

function currentBucket(key: string, now: number, windowMs: number) {
  const existing = store.get(key);

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    const fresh = { attempts: 0, windowStartedAt: now };
    store.set(key, fresh);
    return fresh;
  }

  return existing;
}

export function inspectLoginRateLimit(account: string, ipAddress: string) {
  const now = Date.now();
  const limits = config();
  const accountBucket = currentBucket(
    digest("account", account),
    now,
    limits.windowMs,
  );
  const ipBucket = currentBucket(digest("ip", ipAddress), now, limits.windowMs);

  return {
    blocked:
      accountBucket.attempts >= limits.accountMaxAttempts ||
      ipBucket.attempts >= limits.ipMaxAttempts,
    captchaRequired:
      accountBucket.attempts >= limits.accountCaptchaAfter ||
      ipBucket.attempts >= limits.ipCaptchaAfter,
  };
}

export function recordLoginFailure(account: string, ipAddress: string) {
  const now = Date.now();
  const limits = config();
  const accountBucket = currentBucket(
    digest("account", account),
    now,
    limits.windowMs,
  );
  const ipBucket = currentBucket(digest("ip", ipAddress), now, limits.windowMs);

  accountBucket.attempts += 1;
  ipBucket.attempts += 1;

  return inspectLoginRateLimit(account, ipAddress);
}

export function recordLoginSuccess(account: string) {
  store.delete(digest("account", account));
}
