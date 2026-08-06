import type { JwtPayload } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { isAppRole, type AppRole } from "@/lib/auth/routes";
import {
  createProxyClient,
  redirectWithCookies,
} from "@/lib/supabase/proxy";

type SessionStatus = {
  isActive: boolean;
  expiresAt: string | null;
};

function requiredRole(pathname: string): AppRole | null {
  const path = pathname.toLowerCase();

  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/dashboards/admin")) {
    return "ADMIN";
  }
  if (path === "/teacher" || path.startsWith("/teacher/") || path.startsWith("/dashboards/teacher")) {
    return "TEACHER";
  }
  if (path === "/student" || path.startsWith("/student/") || path.startsWith("/dashboards/student")) {
    return "STUDENT";
  }

  return null;
}

function customClaim(claims: JwtPayload, key: string): unknown {
  return (claims as Record<string, unknown>)[key];
}

export async function proxy(request: NextRequest) {
  const expectedRole = requiredRole(request.nextUrl.pathname);
  if (!expectedRole) {
    return;
  }

  const proxyClient = createProxyClient(request);
  const { data: claimsData, error: claimsError } =
    await proxyClient.supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims?.sub) {
    return redirectWithCookies(
      request,
      "/login",
      proxyClient.response(),
    );
  }

  const role = customClaim(claims, "user_role");
  const accountActive = customClaim(claims, "account_active") === true;
  const mustChangePassword =
    customClaim(claims, "must_change_password") === true;

  if (mustChangePassword) {
    return redirectWithCookies(
      request,
      "/reset-password?required=1",
      proxyClient.response(),
    );
  }

  if (!accountActive || !isAppRole(role)) {
    await proxyClient.supabase.auth.signOut({ scope: "local" });
    return redirectWithCookies(
      request,
      "/login",
      proxyClient.response(),
    );
  }

  if (role !== expectedRole) {
    return redirectWithCookies(
      request,
      "/unauthorized",
      proxyClient.response(),
    );
  }

  const { data: rawStatus, error: sessionError } =
    await proxyClient.supabase.rpc("my_session_status");
  const status = Array.isArray(rawStatus)
    ? ((rawStatus[0] as SessionStatus | undefined) ?? null)
    : (rawStatus as SessionStatus | null);

  if (sessionError || !status?.isActive) {
    await proxyClient.supabase.auth.signOut({ scope: "local" });
    return redirectWithCookies(
      request,
      "/login?reason=idle",
      proxyClient.response(),
    );
  }

  return proxyClient.response();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/Dashboards/Admin/:path*",
    "/Dashboards/Teacher/:path*",
    "/Dashboards/Student/:path*",
  ],
};
