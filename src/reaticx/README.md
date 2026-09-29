# Reaticx source provenance

These are the complete source files published on the five Reaticx component pages, retrieved on 2026-09-29. ArcList's index is also byte-identical to the user's latest pasted source. The previous integration had invented helper functions and constants; those have been replaced with the published files.

`provenance.json` records upstream and installed SHA-256 hashes. Run `node scripts/check-reaticx.mjs` to verify the reviewed installation. ArcList, FanMenu, ExpandableView, and SplitView's implementation files are unchanged from the provided source. Their geometry, constants, spring configurations, and compound APIs are the original ones.

## Explicit compatibility changes

- `split-view/types.ts`: uses `ReturnType<typeof Gesture.Pan>` because Gesture Handler 3's exported `PanGesture` type refers to its newer API. No gesture implementation was changed.
- `apple-intelligence/index.tsx`: corrects the View ref type for React Native 0.87, supplies Skia's required browser snapshot callback, and stops animations/releases the snapshot after unmount. The original shader, uniforms, constants, context, and animation logic remain intact.
- `apple-intelligence/snapshot.web.ts`: supplies the DOM screenshot that Skia requires on web. Images are excluded from the snapshot to avoid cross-origin canvas tainting. The app displays the real screenshot as normal HTML and clips the shader overlay to the border, keeping controls and text live underneath.
- Vite runs the Worklets Babel plugin, resolves `.web` entry points, and prebundles Skia's optional Reanimated imports. CanvasKit is lazy-loaded only for expanded previews.
- The existing Expo browser adapters remain for blur, symbols, icons, and haptics. Blur now follows the supplied intensity instead of being permanently blurred.
- React StrictMode is disabled at the app root because Skia 2.13's web picture lifecycle throws during development double-mount. Browser tests exercise mount, close, and reopen instead.

App-specific theme colors, dimensions, fan direction, and navigation typography are passed through the components' public props in `App.tsx` and `ResourceControls.tsx`. The globe dock and hover preview use body portals to escape scroll-container clipping. Reduced-motion previews skip the shader overlay.
