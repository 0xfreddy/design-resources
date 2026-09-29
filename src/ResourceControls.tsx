import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { LayoutGrid, List, Plus, X } from "lucide-react"
import { FanDirection, FanItemDirection, FanMenu } from "./reaticx/fan-menu"
import { ExpandableView } from "./reaticx/expandable-view"
import { useExpandable } from "./reaticx/expandable-view/context"
import { GlobeCdn } from "./GlobeCdn"
import { useVisitors, type VisitorData } from "./useVisitors"

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

const noArcs: [] = []

function GlobeContent({ dark, diameter, width, visitors }: { dark: boolean; diameter: number; width: number; visitors: VisitorData }) {
  const { expanded, collapse } = useExpandable("GlobeContent")
  const status = visitors.configured ? `${visitors.total} online now · Countries shown by total visits` : "Visitors unavailable"
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
    return () => {
      document.removeEventListener("keydown", key)
      document.removeEventListener("pointerdown", outside)
    }
  }, [expanded, collapse])
  return (
    <div className="globe-content" style={{ width, height: diameter + 104 }} role={expanded ? "dialog" : undefined} aria-label="Live visitors" aria-hidden={!expanded} inert={!expanded}>
      <div ref={closeRef} className="globe-close">
        <ExpandableView.Close style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "transparent", borderWidth: 0 }}>
          <span className="close-glyph" title="Close visitors" aria-label="Close visitors"><X size={17} strokeWidth={1.7} /></span>
        </ExpandableView.Close>
      </div>
      <h2>Live visitors</h2>
      {expanded && <div className="globe-square" style={{ width: diameter, height: diameter }}><GlobeCdn className="live-globe" markers={visitors.locations} arcs={noArcs} dark={dark} /></div>}
      <p className="globe-note" role="status">{status}</p>
    </div>
  )
}

export function GlobeDock({ dark }: { dark: boolean }) {
  const size = useViewport()
  const visitors = useVisitors()
  const [anchor, setAnchor] = useState({ left: 22, width: 254 })
  useLayoutEffect(() => {
    const sidebar = document.querySelector<HTMLElement>(".side-panel")
    const sponsor = document.querySelector<HTMLElement>(".sponsor-card")
    if (!sidebar || !sponsor) return
    const measure = () => {
      const card = sponsor.getBoundingClientRect()
      const panel = sidebar.getBoundingClientRect()
      setAnchor(card.width ? { left: card.left, width: card.width } : { left: panel.left + 20, width: panel.width - 40 })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(sidebar)
    observer.observe(sponsor)
    measure()
    return () => observer.disconnect()
  }, [size.width])
  const width = anchor.width
  const diameter = Math.max(80, Math.min(width - 40, size.height - 136))
  return createPortal(
    <div className="globe-dock" style={{ left: anchor.left }}>
      <ExpandableView collapsedWidth={width} expandedWidth={width} collapsedHeight={44}
        expandedHeight={diameter + 104} collapsedRadius={8} expandedRadius={8}
        style={{ maxWidth: size.width - 32, maxHeight: size.height - 32, backgroundColor: "var(--paper)", borderWidth: 1, borderColor: "var(--line)", boxShadow: "0 12px 48px rgba(0,0,0,0.16)" }}>
        <ExpandableView.Collapsed><span className="expandable-trigger-copy"><span>{visitors.configured ? `${visitors.total} online now` : "Live visitors"}</span></span></ExpandableView.Collapsed>
        <ExpandableView.Expanded><GlobeContent dark={dark} diameter={diameter} width={width} visitors={visitors} /></ExpandableView.Expanded>
      </ExpandableView>
    </div>, document.body,
  )
}
