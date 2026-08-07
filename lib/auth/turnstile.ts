import "server-only";

type TurnstileResponse = {
  success?: boolean;
};

export async function verifyTurnstileToken(
  token: string,
  ipAddress: string,
) {
  const secret =
    process.env.NODE_ENV === "production"
      ? process.env.TURNSTILE_SECRET_KEY
      : "1x0000000000000000000000000000000AA";

  if (!secret || !token) {
    return false;
  }

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (ipAddress !== "unknown") {
    body.set("remoteip", ipAddress);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as TurnstileResponse;
    return result.success === true;
  } catch {
    return false;
  }
}
