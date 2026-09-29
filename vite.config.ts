import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { createRecommendHandler } from "./server/recommend.mjs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

declare const process: {
  cwd(): string
}

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    define: {
      __DEV__: mode !== "production",
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": resolve(rootDir, "src"),
        "react-native": "react-native-web",
        "react-native-gesture-handler": resolve(
          rootDir,
          "node_modules/react-native-gesture-handler/src/index.ts",
        ),
        "@expo/vector-icons": resolve(rootDir, "src/shims/expo-vector-icons.tsx"),
        "expo-blur": resolve(rootDir, "src/shims/expo-blur.tsx"),
        "expo-haptics": resolve(rootDir, "src/shims/expo-haptics.ts"),
        "expo-symbols": resolve(rootDir, "src/shims/expo-symbols.tsx"),
      },
      extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    optimizeDeps: {
      exclude: ["react-native-gesture-handler"],
    },
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
