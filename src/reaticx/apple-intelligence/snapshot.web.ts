import { toPng } from "html-to-image"
import { Skia } from "@shopify/react-native-skia"

// Skia requires an explicit DOM snapshot callback on web.
export async function snapshotView(ref: { current: unknown }) {
  const element = ref.current as HTMLElement | null
  if (!element) return null
  const uri = await toPng(element, { pixelRatio: 1, skipFonts: true, filter: node => !(node instanceof HTMLImageElement) })
  return Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(uri.split(",")[1]))
}
