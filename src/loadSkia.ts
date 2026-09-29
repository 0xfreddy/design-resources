let loading: Promise<void> | undefined

export function loadSkia() {
  return loading ??= import("@shopify/react-native-skia/lib/module/web/LoadSkiaWeb").then(({ LoadSkiaWeb }) =>
    LoadSkiaWeb({ locateFile: () => new URL("../node_modules/canvaskit-wasm/bin/full/canvaskit.wasm", import.meta.url).href }),
  )
}
