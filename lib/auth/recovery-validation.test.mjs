import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeRecoveryEmail,
  normalizeRecoveryOtp,
  passwordPolicyChecks,
  recoveryEmailError,
  recoveryOtpError,
  recoveryPasswordError,
} from "./recovery-validation.ts";

test("recovery email is normalized without changing valid meaning", () => {
  const email = normalizeRecoveryEmail("  Student@Example.COM ");

  assert.equal(email, "student@example.com");
  assert.equal(recoveryEmailError(email), null);
});

test("malformed recovery emails are rejected", () => {
  assert.match(recoveryEmailError("") ?? "", /valid email/i);
  assert.match(recoveryEmailError("student@example") ?? "", /valid email/i);
  assert.match(
    recoveryEmailError(`${"a".repeat(310)}@example.com`) ?? "",
    /valid email/i,
  );
});

test("only an exact six-digit recovery OTP is valid", () => {
  assert.equal(normalizeRecoveryOtp(" 123456 "), "123456");
  assert.equal(recoveryOtpError("123456"), null);
  assert.match(recoveryOtpError("12345") ?? "", /six-digit/i);
  assert.match(recoveryOtpError("1234567") ?? "", /six-digit/i);
  assert.match(recoveryOtpError("12A456") ?? "", /six-digit/i);
});

test("strong matching recovery passwords pass every requirement", () => {
  const password = "Correct-Horse-9!";

  assert.deepEqual(passwordPolicyChecks(password), {
    hasMinLength: true,
    hasUppercase: true,
    hasLowercase: true,
    hasNumber: true,
    hasSymbol: true,
  });
  assert.equal(recoveryPasswordError(password, password), null);
});

test("weak, mismatched, and oversized recovery passwords are rejected", () => {
  assert.match(
    recoveryPasswordError("short", "short") ?? "",
    /12 characters/i,
  );
  assert.match(
    recoveryPasswordError("Correct-Horse-9!", "Different-Horse-9!") ?? "",
    /do not match/i,
  );
  const oversized = `Aa1!${"x".repeat(4093)}`;
  assert.match(
    recoveryPasswordError(oversized, oversized) ?? "",
    /12 characters/i,
  );
});
