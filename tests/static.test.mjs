import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { request } from "node:http"
import { once } from "node:events"
import { readdir } from "node:fs/promises"
import { gunzipSync } from "node:zlib"

test("production assets are compressed and cached without changing their content", async () => {
  const server = spawn(process.execPath, ["server/index.mjs"], { env: { ...process.env, PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] })
  try {
    const [output] = await once(server.stdout, "data")
    const port = Number(String(output).match(/listening on (\d+)/)?.[1])
    assert.ok(port > 0)
    const wasm = (await readdir("dist/assets")).find(name => name.endsWith(".wasm"))
    assert.ok(wasm, "Build the app before running this test")
    const get = (path, encoding, method = "GET") => new Promise((resolve, reject) => {
      const req = request({ hostname: "127.0.0.1", port, path, method, headers: { "Accept-Encoding": encoding } }, res => {
        const chunks = []
        res.on("data", chunk => chunks.push(chunk))
        res.on("end", () => resolve({ headers: res.headers, body: Buffer.concat(chunks) }))
      })
      req.on("error", reject)
      req.end()
    })
    const compressed = await get(`/assets/${wasm}`, "gzip")
    const original = await get(`/assets/${wasm}`, "gzip;q=0")
    assert.equal(compressed.headers["content-encoding"], "gzip")
    assert.equal(compressed.headers["content-type"], "application/wasm")
    assert.match(compressed.headers["cache-control"], /immutable/)
    assert.equal(original.headers["content-encoding"], undefined)
    assert.deepEqual(gunzipSync(compressed.body), original.body)
    assert.ok(compressed.body.length < original.body.length / 2)
    assert.equal((await get(`/assets/${wasm}`, "gzip", "HEAD")).body.length, 0)
    assert.equal((await get("/", "gzip")).headers["cache-control"], "no-cache")
  } finally {
    const stopped = once(server, "exit")
    server.kill()
    await stopped
  }
})
