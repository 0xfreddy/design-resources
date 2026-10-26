import { isIP } from "node:net"
import geoip from "geoip-country"

export function visitorCountry(headers, env) {
  const header = env.VISITORS_COUNTRY_HEADER?.toLowerCase() || (env.VERCEL ? "x-vercel-ip-country" : "")
  if (header) return String(headers[header] || "").toUpperCase()
  // Both Fly and Railway overwrite their respective client-IP header at the edge.
  // Never trust a forwarded-IP list on an unconfigured deployment.
  if (!env.RAILWAY_ENVIRONMENT_ID && !env.FLY_APP_NAME) return ""
  const ip = env.FLY_APP_NAME ? headers["fly-client-ip"] : headers["x-real-ip"]
  if (typeof ip !== "string" || !isIP(ip)) return ""
  // This synchronous lookup stays in memory: no network, logs or stored IPs.
  return geoip.lookup(ip)?.country || ""
}
