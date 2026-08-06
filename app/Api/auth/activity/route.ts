import { headers } from "next/headers";

import { requestIp } from "@/lib/auth/request-context";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const headerStore = await headers();
  const ipAddress = requestIp(headerStore);
  const { data, error } = await supabase.rpc("touch_my_session", {
    p_ip_address: ipAddress === "unknown" ? null : ipAddress,
    p_user_agent: headerStore.get("user-agent")?.slice(0, 1000) ?? null,
  });

  if (error) {
    return Response.json({ ok: false }, { status: 401 });
  }

  return Response.json({ ok: true, expiresAt: data }, { status: 200 });
}
