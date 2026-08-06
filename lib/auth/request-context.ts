import "server-only";

import { isIP } from "node:net";

type HeaderReader = Pick<Headers, "get">;

export function requestIp(headerStore: HeaderReader) {
  const candidates = [
    headerStore.get("cf-connecting-ip"),
    headerStore.get("x-real-ip"),
    headerStore.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && isIP(value) !== 0) {
      return value;
    }
  }

  return "unknown";
}
