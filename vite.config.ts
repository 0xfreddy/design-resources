import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { createRecommendHandler } from "./server/recommend.mjs"

declare const process: {
  cwd(): string
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      react(),
      {
        name: "jev-resource-recommendations",
        configureServer(server) {
          server.middlewares.use("/api/recommend", createRecommendHandler(env.TYPESAFE_API_KEY))
        },
      },
    ],
  }
})
