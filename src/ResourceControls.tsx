import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Globe2, LayoutGrid, List, Plus, X } from "lucide-react"
import { FanDirection, FanItemDirection, FanMenu } from "./reaticx/fan-menu"
import { ExpandableView } from "./reaticx/expandable-view"
import { useExpandable } from "./reaticx/expandable-view/context"
import { GlobeCdn } from "./GlobeCdn"

export function useViewport() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  return size
}

export function ViewMenu({ value, onChange }: { value: "list" | "grid"; onChange: (value: "list" | "grid") => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", close)
    return () => document.removeEventListener("keydown", close)
  }, [])
  return (
    <div className="view-menu" aria-label="Resource view">
      <FanMenu open={open} onOpenChange={setOpen} direction={FanDirection.Left} itemDirection={FanItemDirection.Down}
        spacing={105} spread={10} tilt={5} buttonSize={42} offset={0}
        style={{ position: "relative", right: 0, bottom: 0 }}>
        {(["list", "grid"] as const).map(mode => (
          <FanMenu.Item key={mode} value={mode} onPress={() => onChange(mode)}
            style={{ backgroundColor: value === mode ? "var(--ink)" : "var(--paper)", paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "var(--line)" }}>
            <FanMenu.Icon>{mode === "list" ? <List size={17} color={value === mode ? "var(--paper)" : "var(--ink)"} /> : <LayoutGrid size={17} color={value === mode ? "var(--paper)" : "var(--ink)"} />}</FanMenu.Icon>
            <FanMenu.Label style={{ color: value === mode ? "var(--paper)" : "var(--ink)" }}>{mode === "list" ? "List" : "Grid"}</FanMenu.Label>
          </FanMenu.Item>
        ))}
        <FanMenu.Trigger style={{ backgroundColor: "var(--surface)", borderWidth: 1, borderColor: "var(--line)" }}>
          <span aria-label="Change resource view" title="Change resource view" className="view-menu-icon">{open ? <Plus size={19} /> : value === "list" ? <List size={19} /> : <LayoutGrid size={19} />}</span>
        </FanMenu.Trigger>
      </FanMenu>
    </div>
  )
}

type Location = { id: string; location: [number, number]; region: string }
const noArcs: [] = []

function GlobeContent({ dark }: { dark: boolean }) {
  const { expanded, collapse } = useExpandable("GlobeContent")
  const [locations, setLocations] = useState<Location[]>([])
  const [status, setStatus] = useState("Visitor locations unavailable")
  const closeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!expanded) return
    closeRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") collapse() }
    const outside = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".globe-dock")) collapse()
    }
    document.addEventListener("keydown", key)
    document.addEventListener("pointerdown", outside)
    let disposed = false
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const response = await fetch("/api/live-users", { signal: controller.signal })
        if (!response.ok) throw new Error("Unavailable")
        const data = await response.json()
        if (disposed) return
        setLocations(data.locations ?? [])
        setStatus(data.configured ? `${data.total ?? 0} visitors in the last 5 minutes` : "Visitor locations unavailable")
      } catch { if (!disposed) setStatus("Visitor locations unavailable") }
    }
    void refresh()
    const interval = window.setInterval(refresh, 60000)
    return () => {
      disposed = true
      controller.abort()
      clearInterval(interval)
      document.removeEventListener("keydown", key)
      document.removeEventListener("pointerdown", outside)
    }
  }, [expanded, collapse])
  return (
    <div className="globe-content" role={expanded ? "dialog" : undefined} aria-label="Live visitors" aria-hidden={!expanded} inert={!expanded}>
      <div ref={closeRef} className="globe-close">
        <ExpandableView.Close style={{ backgroundColor: "var(--surface)", borderWidth: 1, borderColor: "var(--line)" }}>
          <span title="Close visitors" aria-label="Close visitors"><X size={18} /></span>
        </ExpandableView.Close>
      </div>
      <h2>Live visitors</h2>
      {expanded && <GlobeCdn className="live-globe" markers={locations} arcs={noArcs} dark={dark} />}
      <p className="globe-note" role="status">{status}</p>
    </div>
  )
}

export function GlobeDock({ dark }: { dark: boolean }) {
  const size = useViewport()
  return createPortal(
    <div className="globe-dock">
      <ExpandableView collapsedWidth={170} expandedWidth={Math.min(370, size.width - 32)} collapsedHeight={44}
        expandedHeight={Math.min(440, size.height - 32)} expandedRadius={24}
        style={{ maxWidth: size.width - 32, maxHeight: size.height - 32, backgroundColor: "var(--paper)", borderWidth: 1, borderColor: "var(--line)", boxShadow: "0 12px 48px rgba(0,0,0,0.16)" }}>
        <ExpandableView.Collapsed><span className="expandable-trigger-copy"><Globe2 size={18} /><span>Live visitors</span></span></ExpandableView.Collapsed>
        <ExpandableView.Expanded><GlobeContent dark={dark} /></ExpandableView.Expanded>
      </ExpandableView>
    </div>, document.body,
  )
}
