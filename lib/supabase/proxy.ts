import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseConfig } from "./env";

export function createProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getPublicSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    response: () => response,
  };
}

export function redirectWithCookies(
  request: NextRequest,
  destination: string,
  sourceResponse: NextResponse,
) {
  const redirectResponse = NextResponse.redirect(
    new URL(destination, request.url),
  );
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}
