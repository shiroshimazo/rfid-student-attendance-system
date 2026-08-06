"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

const idleTimeoutMs = 5 * 60 * 1000;
const heartbeatThrottleMs = 60 * 1000;
const lastActivityKey = "rfid-attendance:last-activity";
const signedOutKey = "rfid-attendance:signed-out";

export function InactivityGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef(0);
  const signingOutRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function signOutForInactivity(broadcast = true) {
      if (signingOutRef.current) {
        return;
      }

      signingOutRef.current = true;
      await supabase.auth.signOut({ scope: "local" });
      if (broadcast) {
        window.localStorage.setItem(signedOutKey, String(Date.now()));
      }
      router.replace("/login?reason=idle");
      router.refresh();
    }

    function scheduleTimeout(lastActivityAt: number) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      const remaining = Math.max(0, idleTimeoutMs - (Date.now() - lastActivityAt));
      timeoutRef.current = window.setTimeout(signOutForInactivity, remaining);
    }

    async function touchServerSession() {
      try {
        const response = await fetch("/api/auth/activity", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (response.status === 401 || response.status === 403) {
          await signOutForInactivity();
        }
      } catch {
        // A transient network failure must not create synthetic activity.
      }
    }

    function recordActivity() {
      const now = Date.now();
      window.localStorage.setItem(lastActivityKey, String(now));
      scheduleTimeout(now);

      if (now - lastHeartbeatRef.current >= heartbeatThrottleMs) {
        lastHeartbeatRef.current = now;
        void touchServerSession();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }

      const stored = Number(window.localStorage.getItem(lastActivityKey));
      const lastActivityAt = Number.isFinite(stored) && stored > 0 ? stored : 0;
      if (!lastActivityAt || Date.now() - lastActivityAt >= idleTimeoutMs) {
        void signOutForInactivity();
      } else {
        scheduleTimeout(lastActivityAt);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === signedOutKey && event.newValue) {
        void signOutForInactivity(false);
        return;
      }

      if (event.key === lastActivityKey && event.newValue) {
        const timestamp = Number(event.newValue);
        if (Number.isFinite(timestamp)) {
          scheduleTimeout(timestamp);
        }
      }
    }

    const initialActivity = Date.now();
    window.localStorage.setItem(lastActivityKey, String(initialActivity));
    scheduleTimeout(initialActivity);
    lastHeartbeatRef.current = initialActivity;
    void touchServerSession();

    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      events.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [router]);

  return children;
}
