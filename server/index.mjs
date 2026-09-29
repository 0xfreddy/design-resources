import { createReadStream, existsSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createRecommendHandler } from "./recommend.mjs"
import { createLiveUsersHandler } from "./live-users.mjs"
import { createStacksHandler } from "./stacks.mjs"

const root = resolve(fileURLToPath(new URL("..", import.meta.url)))
const distDir = join(root, "dist")
const port = Number(process.env.PORT ?? 4173)
const recommendHandler = createRecommendHandler(process.env.TYPESAFE_API_KEY)
const liveUsersHandler = createLiveUsersHandler()
const stacksHandler = createStacksHandler()

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".wasm": "application/wasm",
}

function sendNotFound(res) {
  res.statusCode = 404
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.end("Not found")
}

function sendStatic(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)
  const pathname = decodeURIComponent(url.pathname)
  const candidate = normalize(join(distDir, pathname))
  const filePath = candidate.startsWith(distDir) && existsSync(candidate) && !pathname.endsWith("/")
    ? candidate
    : join(distDir, "index.html")

  if (!existsSync(filePath)) {
    sendNotFound(res)
    return
  }

  res.statusCode = 200
  res.setHeader("Content-Type", mimeTypes[extname(filePath)] ?? "application/octet-stream")
  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  if (req.url?.split("?")[0] === "/api/stacks") {
    void stacksHandler(req, res)
    return
  }
  if (req.url?.split("?")[0] === "/api/live-users") {
    void liveUsersHandler(req, res)
    return
  }
  if (req.url?.startsWith("/api/recommend")) {
    recommendHandler(req, res, () => {
      res.statusCode = 405
      res.setHeader("Allow", "POST")
      res.end()
    })
    return
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405
    res.setHeader("Allow", "GET, HEAD")
    res.end()
    return
  }

  sendStatic(req, res)
})

server.listen(port, "0.0.0.0", () => {
  console.log(`design resources listening on ${port}`)
})
