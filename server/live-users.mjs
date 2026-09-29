export function createLiveUsersHandler(env = process.env, request = fetch) {
  let cache = null
  let expires = 0
  let pending = null
  return async (req, res) => {
    res.setHeader("Content-Type", "application/json")
    if (req.method !== "GET") { res.statusCode = 405; res.end(); return }
    if (!env.POSTHOG_PERSONAL_API_KEY || !env.POSTHOG_PROJECT_ID) {
      res.end(JSON.stringify({ configured: false, locations: [], total: 0 }))
      return
    }
    try {
      if (!cache || Date.now() > expires) {
        pending ??= (async () => {
          const host = env.POSTHOG_HOST || "https://us.posthog.com"
          const response = await request(`${host}/api/projects/${encodeURIComponent(env.POSTHOG_PROJECT_ID)}/query/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({ query: { kind: "HogQLQuery", query: "SELECT properties.$geoip_latitude, properties.$geoip_longitude, properties.$geoip_country_name, count(DISTINCT distinct_id) FROM events WHERE timestamp > now() - INTERVAL 5 MINUTE AND properties.$geoip_latitude IS NOT NULL AND properties.$geoip_longitude IS NOT NULL GROUP BY 1, 2, 3 LIMIT 100" } }),
          })
          if (!response.ok) throw new Error("Analytics unavailable")
          const data = await response.json()
          const rows = (data.results ?? []).filter(row => row[0] != null && row[1] != null && Number.isFinite(Number(row[0])) && Number.isFinite(Number(row[1])))
          cache = { configured: true, total: rows.reduce((sum, row) => sum + Number(row[3]), 0), locations: rows.map((row, index) => ({ id: String(index), location: [Number(row[0]), Number(row[1])], region: String(row[2] ?? "") })) }
          expires = Date.now() + 60000
        })().finally(() => { pending = null })
        await pending
      }
      res.end(JSON.stringify(cache))
    } catch {
      res.statusCode = 503
      res.end(JSON.stringify({ error: "Visitor locations unavailable", locations: [] }))
    }
  }
}
