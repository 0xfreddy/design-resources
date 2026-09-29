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
  const res = { statusCode: 200, setHeader() {}, end(value) { data = value ? JSON.parse(value) : null } }
  await handler(req, res)
  return { status: res.statusCode, data }
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

test("globe exposes no fake visitors without PostHog and caches aggregate queries", async () => {
  assert.deepEqual((await call(createLiveUsersHandler({}), "GET")).data, { configured: false, locations: [], total: 0 })
  let requests = 0
  const handler = createLiveUsersHandler({ POSTHOG_PROJECT_ID: "123", POSTHOG_PERSONAL_API_KEY: "test-only" }, async (url, options) => {
    requests++
    assert.match(url, /projects\/123\/query/)
    assert.match(JSON.parse(options.body).query.query, /INTERVAL 5 MINUTE/)
    return { ok: true, json: async () => ({ results: [[51.5, -0.1, "United Kingdom", 3]] }) }
  })
  const result = await call(handler, "GET")
  assert.equal(result.data.total, 3)
  assert.deepEqual(result.data.locations[0].location, [51.5, -0.1])
  await call(handler, "GET")
  assert.equal(requests, 1)
})
