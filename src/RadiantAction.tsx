import { Component, lazy, Suspense, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"
import { loadSkia } from "./loadSkia"

const RadiantButton = lazy(async () => {
  await loadSkia()
  return import("./reaticx/radiant-button")
})

class ActionBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function RadiantAction({ label, onPress, disabled = false, compact = false, borderless = false }: { label: string; onPress: () => void; disabled?: boolean; compact?: boolean; borderless?: boolean }) {
  const reducedMotion = useReducedMotion()
  const fallback = <button type="button" className="radiant-fallback" style={borderless ? { border: 0 } : undefined} disabled={disabled} onClick={onPress}>{label}</button>
  return <div className="radiant-action"><ActionBoundary fallback={fallback}><Suspense fallback={fallback}>
    <RadiantButton onPress={onPress} disabled={disabled} borderWidth={borderless ? 0 : 2}
      style={{ width: "100%", height: 48, backgroundColor: "#000" }} paddingHorizontal={compact ? 10 : 24}
      textStyle={{ fontSize: compact ? 12 : 17, fontWeight: "400", letterSpacing: 0 }}
      theme={{ foreground: "#fff", background: "#000", backgroundSubtle: "#000", highlight: "#c99c74", highlightSubtle: "#000" }}
      dotOpacity={1} showDots glowWidth={0.5} shimmerOpacity={0.5}
      showShimmer={!reducedMotion} showGlow={!reducedMotion} breathingEnabled={!reducedMotion}>
      {label}
    </RadiantButton>
  </Suspense></ActionBoundary></div>
}
