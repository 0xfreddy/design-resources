import { test } from "node:test"
import { strict as assert } from "node:assert"
import { Readable } from "node:stream"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createStacksHandler } from "../server/stacks.mjs"
import { createLiveUsersHandler } from "../server/live-users.mjs"
import { flattenResources } from "../server/recommend.mjs"

async function call(handler, method, body, headers = {}, url = "/api/stacks") {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)])
  req.method = method
  req.url = url
  req.headers = { host: "localhost", ...headers }
  let data
  const responseHeaders = {}
  const res = { statusCode: 200, setHeader(name, value) { responseHeaders[name] = value }, end(value) { data = value ? JSON.parse(value) : null } }
  await handler(req, res)
  return { status: res.statusCode, data, headers: responseHeaders }
}

test("published stacks persist, deduplicate and reject unknown resources", async () => {
  const dir = await mkdtemp(join(tmpdir(), "resource-stacks-"))
  try {
    const file = join(dir, "stacks.json")
    const handler = createStacksHandler(file)
    const draft = { name: "Builder", handle: "@builder", ids: [flattenResources()[0].id] }
    const result = await call(handler, "POST", draft)
    assert.equal(result.status, 201)
    await call(handler, "POST", draft)
    const restored = await call(createStacksHandler(file), "GET")
    assert.equal(restored.data.stacks.length, 1)
    assert.equal(restored.data.stacks[0].handle, "builder")
    const shared = await call(createStacksHandler(file), "GET", undefined, {}, `/api/stacks?id=${result.data.stack.id}`)
    assert.deepEqual(shared.data.stack, result.data.stack)
    assert.equal((await call(handler, "GET", undefined, {}, "/api/stacks?id=missing")).status, 404)
    assert.equal((await call(handler, "POST", { ...draft, ids: ["fake"] })).status, 400)
    assert.equal((await call(handler, "POST", draft, { origin: "https://another.example" })).status, 403)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

const visitorEnv = { UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "test-only", VISITORS_COUNTRY_HEADER: "x-vercel-ip-country" }

test("visitor heartbeats reuse signed daily identity and return aggregate country visits", async () => {
  const commands = []
  const handler = createLiveUsersHandler(visitorEnv, async (_url, options) => {
    commands.push(JSON.parse(options.body))
    return { ok: true, json: async () => ({ result: [1, ["GB", "4", "AE", "2"]] }) }
  })
  const first = await call(handler, "POST", undefined, { "x-vercel-ip-country": "GB", "x-forwarded-proto": "https" })
  assert.equal(first.data.total, 1)
  assert.equal(first.data.locations[0].region, "United Kingdom")
  assert.equal(first.data.locations[0].visits, 4)
  assert.match(first.headers["Set-Cookie"], /HttpOnly; SameSite=Lax; Max-Age=86400; Secure/)
  assert.equal(first.headers["Cache-Control"], "no-store")
  const cookie = first.headers["Set-Cookie"].split(";")[0]
  const second = await call(handler, "POST", undefined, { cookie, "x-vercel-ip-country": "GB" })
  assert.equal(second.headers["Set-Cookie"], undefined)
  assert.equal(commands[0][7], commands[1][7])
  assert.equal(commands[1][8], "GB")
  await call(handler, "GET")
  assert.equal(commands[2][7], "") // Reads never create presence.
  await call(handler, "POST", undefined, { cookie: cookie.slice(0, -1) + "x" })
  assert.notEqual(commands[3][7], commands[0][7])
})

test("visitor tracking fails honestly and rejects cross-site heartbeats", async () => {
  assert.deepEqual((await call(createLiveUsersHandler({}), "POST")).data, { configured: false, locations: [], total: 0 })
  const handler = createLiveUsersHandler(visitorEnv, async () => { throw new Error("offline") })
  assert.equal((await call(handler, "POST", undefined, { origin: "https://other.example" })).status, 403)
  assert.equal((await call(handler, "POST")).status, 503)
  assert.equal((await call(handler, "DELETE")).status, 405)
  const noGeo = createLiveUsersHandler({ ...visitorEnv, VISITORS_COUNTRY_HEADER: "" }, async (_url, options) => {
    assert.equal(JSON.parse(options.body)[8], "")
    return { ok: true, json: async () => ({ result: [1, []] }) }
  })
  assert.equal((await call(noGeo, "POST", undefined, { "x-vercel-ip-country": "GB" })).data.total, 1)
})
