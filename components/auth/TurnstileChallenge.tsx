"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export function TurnstileChallenge({ pending }: { pending: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const wasPendingRef = useRef(false);
  const [token, setToken] = useState("");
  const siteKey =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      : "1x00000000000000000000AA";

  const renderWidget = useCallback(() => {
    if (
      !siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }, [siteKey]);

  useEffect(() => {
    if (wasPendingRef.current && !pending && widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
      setToken("");
    }
    wasPendingRef.current = pending;
  }, [pending]);

  useEffect(
    () => () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
      }
    },
    [],
  );

  if (!siteKey) {
    return (
      <p className="text-sm text-auth-danger" role="alert">
        Security challenge is not configured. Contact the administrator.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
