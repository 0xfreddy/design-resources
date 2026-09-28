import { recommendForQuery } from "../server/recommend.mjs"

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString("utf8")
  return rawBody ? JSON.parse(rawBody) : {}
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ error: "Use POST." }))
    return
  }

  try {
    const body = await readJson(req)
    const query = typeof body.query === "string" ? body.query.trim() : ""

    if (!query) {
      res.statusCode = 400
      res.setHeader("Content-Type", "application/json")
      res.end(JSON.stringify({ error: "Tell Jev what you are building first." }))
      return
    }

    const payload = await recommendForQuery(query, process.env.TYPESAFE_API_KEY)
    res.statusCode = payload.statusCode ?? 200
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(payload))
  } catch (error) {
    res.statusCode = 500
    res.setHeader("Content-Type", "application/json")
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Recommendation failed.",
        picks: [],
        provider: "error",
      }),
    )
  }
}
