import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import { createRecommendHandler } from "./server/recommend.mjs"
import { createLiveUsersHandler } from "./server/live-users.mjs"
import { createStacksHandler } from "./server/stacks.mjs"
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
      alias: [{ find: /^react-native-svg$/, replacement: resolve(rootDir, "src/shims/react-native-svg.ts") }, ...Object.entries({
        "@": resolve(rootDir, "src"),
        "react-native/Libraries/Image/AssetRegistry": resolve(rootDir, "node_modules/react-native-web/dist/modules/AssetRegistry/index.js"),
        "@react-native/assets-registry/registry": resolve(rootDir, "node_modules/react-native-web/dist/modules/AssetRegistry/index.js"),
        "react-native": "react-native-web",
        "react-native-gesture-handler": resolve(
          rootDir,
          "node_modules/react-native-gesture-handler/src/index.ts",
        ),
        "@expo/vector-icons": resolve(rootDir, "src/shims/expo-vector-icons.tsx"),
        "expo-blur": resolve(rootDir, "src/shims/expo-blur.tsx"),
        "expo-haptics": resolve(rootDir, "src/shims/expo-haptics.ts"),
        "expo-symbols": resolve(rootDir, "src/shims/expo-symbols.tsx"),
      }).map(([find, replacement]) => ({ find, replacement }))],
      extensions: [".web.tsx", ".web.ts", ".web.js", ".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    optimizeDeps: {
      exclude: ["react-native-gesture-handler"],
      include: ["@shopify/react-native-skia", "@shopify/react-native-skia/lib/module/web/LoadSkiaWeb", "canvaskit-wasm/bin/full/canvaskit", "react-reconciler", "react-reconciler/constants"],
      rolldownOptions: { resolve: { extensions: [".web.js", ".web.ts", ".web.tsx", ".js", ".ts", ".tsx", ".json"] } },
    },
    plugins: [
      react(),
      babel({ plugins: ["react-native-worklets/plugin"] }),
      {
        name: "jev-resource-recommendations",
        configureServer(server) {
          server.middlewares.use("/api/recommend", createRecommendHandler(env.TYPESAFE_API_KEY))
          server.middlewares.use("/api/live-users", createLiveUsersHandler(env))
          server.middlewares.use("/api/stacks", createStacksHandler(env.STACKS_FILE))
        },
      },
    ],
  }
})
