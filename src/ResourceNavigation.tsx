import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { animate, useReducedMotion } from "framer-motion"
import { ArcList, useArcList } from "./reaticx/arc-list"
import { categories } from "./resources"

const labels = ["UI Components", "Motion & Interaction", "Visuals & Backgrounds", "Icons, Type & Assets", "Inspiration & Tools"]
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const items = categories.flatMap((category, index) => [
  { label: labels[index], id: slug(category.title), child: false },
  ...category.groups.map(group => ({ label: group.title, id: `${slug(category.title)}-${slug(group.title)}`, child: true })),
])

function FollowDirectory({ index }: { index: number }) {
  const { scrollRef, scrollY, itemHeight, halfHeight } = useArcList("DirectorySync")
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    let controls: ReturnType<typeof animate> | undefined
    // Coalesce rapid section changes; never queue native smooth-scroll requests.
    const timer = window.setTimeout(() => {
      const node: unknown = scrollRef.current?.getScrollableNode()
      const viewport = node instanceof HTMLElement ? node : undefined
      const maximum = viewport ? viewport.scrollHeight - viewport.clientHeight : 0
      const target = Math.min(maximum, Math.max(0, index - 2) * itemHeight)
      if (reducedMotion) scrollRef.current?.scrollTo({ y: target, animated: false })
      else controls = animate(scrollY.value, target, {
        type: "spring", stiffness: 135, damping: 30, restDelta: 0.5,
        onUpdate: y => scrollRef.current?.scrollTo({ y, animated: false }),
      })
    }, reducedMotion ? 0 : 90)
    const stop = () => { clearTimeout(timer); controls?.stop() }
    const nav = document.querySelector(".arc-list-nav")
    nav?.addEventListener("wheel", stop, { passive: true })
    nav?.addEventListener("pointerdown", stop)
    return () => { stop(); nav?.removeEventListener("wheel", stop); nav?.removeEventListener("pointerdown", stop) }
  }, [index, itemHeight, halfHeight, scrollRef, scrollY, reducedMotion])
  return null
}

export function ResourceNavigation({ dark, activeId, navigate }: { dark: boolean; activeId: string; navigate: (id: string, close?: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(320)
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => setHeight(host.current?.clientHeight || 320))
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  const colors = dark ? { normal: "#aaa9a4", active: "#c99c74" } : { normal: "#767671", active: "#9c663c" }
  return <nav className="side-nav-shell unified-navigation" aria-label="Categories" data-active-id={activeId}>
    <div className="side-nav arc-list-nav" ref={host}>
      <ArcList.Root height={height} itemHeight={46} radius={680} side="left" snap={false} haptics minOpacity={0.55} minScale={0.94} style={{ flex: 0 }}>
        <FollowDirectory index={Math.max(0, items.findIndex(item => item.id === activeId))} />
        <ArcList.Viewport contentContainerStyle={{ paddingTop: 0, paddingBottom: 0 }} style={{ flex: 1 }}>
          {items.map(item => <ArcList.Item key={item.id} style={{ width: "100%", paddingLeft: item.child ? 18 : 2, paddingRight: 4 }} onPress={() => navigate(item.id, true)}>
            {!item.child && <ArcList.Indicator size={7} color={item.id === activeId ? colors.active : colors.normal} activeColor={item.id === activeId ? colors.active : colors.normal} />}
            <ArcList.Label numberOfLines={2} color={item.id === activeId ? colors.active : colors.normal} activeColor={item.id === activeId ? colors.active : colors.normal} style={{ flex: 1, minWidth: 0, fontFamily: "Inter, system-ui, sans-serif", fontSize: item.child ? 11 : 12, fontWeight: item.id === activeId ? "600" : item.child ? "400" : "500", lineHeight: 16 }}><span data-nav-section={item.id} aria-current={item.id === activeId ? "location" : undefined}>{item.label}</span></ArcList.Label>
          </ArcList.Item>)}
        </ArcList.Viewport>
      </ArcList.Root>
    </div>
  </nav>
}
