import geoip from "geoip-lite";
import countries from "i18n-iso-countries";
import { Request } from "express";

// tsconfig doesn't enable resolveJsonModule — require() sidesteps that
// without loosening it project-wide for one language file.
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

// Best-effort client IP: respects a proxy's X-Forwarded-For (first hop is
// the original client) when present, otherwise falls back to the socket.
export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.socket.remoteAddress || req.ip;
}

// Returns an ISO 3166-1 alpha-2 code, or undefined if the IP can't be
// geolocated — always true for loopback/private addresses, which is
// expected in local dev.
export function lookupCountryCode(ip?: string): string | undefined {
  if (!ip) return undefined;
  const geo = geoip.lookup(ip);
  return geo?.country || undefined;
}

export function countryCodeToName(code?: string): string {
  if (!code) return "Unknown";
  return countries.getName(code, "en") || code;
}
