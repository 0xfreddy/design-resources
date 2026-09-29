import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { flattenResources } from "./recommend.mjs"

export function createStacksHandler(file = resolve(process.env.STACKS_FILE || ".data/stacks.json")) {
  const allowed = new Set(flattenResources().map(resource => resource.id))
  let writing = Promise.resolve()
  const read = async () => {
    try { return JSON.parse(await readFile(file, "utf8")) } catch (error) { if (error.code === "ENOENT") return []; throw error }
  }
  return async (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Cache-Control", "no-store")
    try {
      if (req.method === "GET") {
        const id = new URL(req.url ?? "/", "http://localhost").searchParams.get("id")
        const stacks = await read()
        if (id) {
          const stack = stacks.find(item => item.id === id)
          res.statusCode = stack ? 200 : 404
          res.end(JSON.stringify(stack ? { stack } : { error: "Stack not found" }))
        } else res.end(JSON.stringify({ stacks: stacks.slice(0, 100) }))
        return
      }
      if (req.method !== "POST") { res.statusCode = 405; res.end(); return }
      const origin = req.headers.origin
      if (origin && new URL(origin).host !== req.headers.host) { res.statusCode = 403; res.end(JSON.stringify({ error: "Request origin rejected" })); return }
      let raw = ""
      for await (const chunk of req) {
        raw += chunk
        if (raw.length > 16000) { res.statusCode = 413; res.end(JSON.stringify({ error: "Stack is too large" })); return }
      }
      let body
      try { body = JSON.parse(raw) } catch { res.statusCode = 400; res.end(JSON.stringify({ error: "Invalid stack" })); return }
      const name = typeof body.name === "string" ? body.name.trim() : ""
      const handle = typeof body.handle === "string" ? body.handle.trim().replace(/^@/, "") : ""
      const ids = Array.isArray(body.ids) ? [...new Set(body.ids)] : []
      if (!name || name.length > 80 || (handle && !/^[a-zA-Z0-9_]{1,15}$/.test(handle)) || ids.length < 1 || ids.length > 30 || ids.some(id => !allowed.has(id))) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: "Use a name, a valid Twitter handle, and 1–30 resources." }))
        return
      }
      const stack = { id: randomUUID(), name, handle, ids, createdAt: new Date().toISOString() }
      const save = writing.then(async () => {
        const stacks = await read()
        const duplicate = stacks.find(item => item.name === name && item.handle === handle && JSON.stringify(item.ids) === JSON.stringify(ids))
        if (duplicate) return duplicate
        await mkdir(dirname(file), { recursive: true })
        await writeFile(`${file}.tmp`, JSON.stringify([stack, ...stacks].slice(0, 1000)))
        await rename(`${file}.tmp`, file)
        return stack
      })
      writing = save.then(() => {}, () => {})
      const saved = await save
      res.statusCode = 201
      res.end(JSON.stringify({ stack: saved }))
    } catch {
      res.statusCode = 503
      res.end(JSON.stringify({ error: "Stacks are temporarily unavailable. Your draft is saved on this device." }))
    }
  }
}
