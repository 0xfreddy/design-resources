import { isIP } from "node:net"
import geoip from "geoip-country"

export function visitorCountry(headers, env) {
  const header = env.VISITORS_COUNTRY_HEADER?.toLowerCase() || (env.VERCEL ? "x-vercel-ip-country" : "")
  if (header) return String(headers[header] || "").toUpperCase()
  // Railway overwrites X-Real-IP at its public edge. Never trust a client-supplied
  // country header or a forwarded-IP list on an unconfigured deployment.
  if (!env.RAILWAY_ENVIRONMENT_ID) return ""
  const ip = headers["x-real-ip"]
  if (typeof ip !== "string" || !isIP(ip)) return ""
  // This synchronous lookup stays in memory: no network, logs or stored IPs.
  return geoip.lookup(ip)?.country || ""
}
