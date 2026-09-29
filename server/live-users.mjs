import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { countries } from "./countries.mjs"

// Atomic across instances. Only aggregate countries and expiring anonymous IDs.
export const visitorScript = `
local now = tonumber(ARGV[1])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - 90000)
if ARGV[2] ~= '' then
  redis.call('ZADD', KEYS[1], now, ARGV[2])
  redis.call('EXPIRE', KEYS[1], 120)
  if ARGV[3] ~= '' and redis.call('SET', KEYS[3], '1', 'NX', 'EX', 86400) then
    redis.call('HINCRBY', KEYS[2], ARGV[3], 1)
  end
end
return {redis.call('ZCARD', KEYS[1]), redis.call('HGETALL', KEYS[2])}
`

export function createLiveUsersHandler(env = process.env, request = fetch) {
  const prefix = env.VISITORS_REDIS_PREFIX || "design-resources:visitors"
  const cookieName = "resource_visit"
  const sign = value => createHmac("sha256", env.UPSTASH_REDIS_REST_TOKEN).update(value).digest("hex")
  return async (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Cache-Control", "no-store")
    if (!["GET", "POST"].includes(req.method)) {
      res.statusCode = 405; res.setHeader("Allow", "GET, POST"); res.end(); return
    }
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      res.end(JSON.stringify({ configured: false, locations: [], total: 0 })); return
    }
    try {
      if (req.method === "POST" && (req.headers["sec-fetch-site"] === "cross-site" ||
          (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host))) {
        res.statusCode = 403; res.end(JSON.stringify({ error: "Request origin rejected" })); return
      }
      const now = Date.now()
      let id = "", freshCookie = ""
      if (req.method === "POST") {
        const cookie = String(req.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || ""
        const [uuid, issued, signature] = cookie.split(".")
        if (/^[a-f0-9-]{36}$/.test(uuid || "") && /^\d{13}$/.test(issued || "") && /^[a-f0-9]{64}$/.test(signature || "") &&
            now >= Number(issued) && now - Number(issued) < 86400000 &&
            timingSafeEqual(Buffer.from(signature), Buffer.from(sign(`${uuid}.${issued}`)))) id = uuid
        if (!id) {
          id = randomUUID()
          const value = `${id}.${now}`
          const secure = req.socket?.encrypted || req.headers["x-forwarded-proto"] === "https"
          freshCookie = `${cookieName}=${value}.${sign(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure ? "; Secure" : ""}`
        }
      }
      // Opt into a header only when the deployment's trusted proxy overwrites it.
      const header = env.VISITORS_COUNTRY_HEADER?.toLowerCase() || (env.VERCEL ? "x-vercel-ip-country" : "")
      const code = header ? String(req.headers[header] || "").toUpperCase() : ""
      const response = await request(env.UPSTASH_REDIS_REST_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify(["EVAL", visitorScript, 3, `${prefix}:active`, `${prefix}:countries`, `${prefix}:seen:${id}`, now, id, Object.hasOwn(countries, code) ? code : ""]),
      })
      if (!response.ok) throw new Error("Redis unavailable")
      const data = await response.json()
      if (data.error || !Array.isArray(data.result) || !Array.isArray(data.result[1])) throw new Error("Invalid Redis response")
      const [total, counts] = data.result
      const locations = []
      for (let i = 0; i < counts.length; i += 2) {
        const country = countries[counts[i]], visits = Number(counts[i + 1])
        if (country && visits > 0) locations.push({ id: counts[i], ...country, visits })
      }
      locations.sort((a, b) => b.visits - a.visits)
      if (freshCookie) res.setHeader("Set-Cookie", freshCookie)
      res.end(JSON.stringify({ configured: true, total: Number(total), locations }))
    } catch {
      res.statusCode = 503
      res.end(JSON.stringify({ configured: false, error: "Visitors unavailable", locations: [] }))
    }
  }
}
