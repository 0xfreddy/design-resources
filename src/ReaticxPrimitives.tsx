import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"

type FanMenuProps<T extends string> = {
  value: T
  items: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function FanMenu<T extends string>({ value, items, onChange }: FanMenuProps<T>) {
  const [open, setOpen] = useState(false)
  const active = items.find((item) => item.value === value)

  return (
    <div className="fan-menu">
      <AnimatePresence>
        {open && (
          <motion.div
            className="fan-menu-items"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { opacity: 1, scale: 1 },
              closed: { opacity: 0, scale: 0.96 },
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.28 }}
          >
            {items.map((item, index) => (
              <motion.button
                key={item.value}
                type="button"
                className={item.value === value ? "active" : ""}
                onClick={() => {
                  onChange(item.value)
                  setOpen(false)
                }}
                initial={{ opacity: 0, x: 12, y: 12, rotate: -10 }}
                animate={{
                  opacity: 1,
                  x: Math.cos((-115 + index * 38) * (Math.PI / 180)) * 48,
                  y: Math.sin((-115 + index * 38) * (Math.PI / 180)) * 48,
                  rotate: 0,
                }}
                exit={{ opacity: 0, x: 8, y: 8, rotate: -8 }}
                transition={{ type: "spring", bounce: 0.18, duration: 0.34, delay: index * 0.025 }}
              >
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" className="fan-menu-trigger" onClick={() => setOpen((current) => !current)}>
        {active?.label ?? value}
      </button>
    </div>
  )
}

type ArcListNavProps = {
  label: string
  children: ReactNode
}

export function ArcListNav({ label, children }: ArcListNavProps) {
  return (
    <nav className="side-nav arc-list-nav" aria-label={label}>
      {children}
    </nav>
  )
}

export function AppleIntelligenceFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`apple-frame ${className}`}>
      <div className="apple-frame-aura" />
      <div className="apple-frame-content">{children}</div>
    </div>
  )
}

export function ExpandableView({ children, preview }: { children: ReactNode; preview: ReactNode }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`expandable-view ${expanded ? "expanded" : ""}`}>
      <button type="button" className="expandable-trigger" onClick={() => setExpanded((current) => !current)}>
        {preview}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="expandable-panel"
            initial={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(5px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.38 }}
          >
            <button type="button" className="expandable-close" onClick={() => setExpanded(false)}>
              close
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type GlobePoint = {
  city: string
  x: number
  y: number
  count: number
}

const defaultPoints: GlobePoint[] = [
  { city: "Dubai", x: 63, y: 47, count: 12 },
  { city: "San Francisco", x: 20, y: 42, count: 9 },
  { city: "London", x: 48, y: 36, count: 7 },
  { city: "Tokyo", x: 78, y: 44, count: 5 },
  { city: "Sydney", x: 82, y: 70, count: 3 },
]

export function LiveUsersGlobe() {
  const [points, setPoints] = useState(defaultPoints)
  const tickRef = useRef(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      tickRef.current += 1
      setPoints((current) =>
        current.map((point, index) => ({
          ...point,
          count: Math.max(1, point.count + ((tickRef.current + index) % 3 === 0 ? 1 : -1)),
        })),
      )
    }, 2400)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="live-globe" aria-label="Live visitors by region">
      <div className="globe-orb">
        <div className="globe-grid" />
        {points.map((point) => (
          <span
            key={point.city}
            className="globe-point"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            title={`${point.city}: ${point.count}`}
          />
        ))}
      </div>
      <div className="globe-list">
        {points.map((point) => (
          <span key={point.city}>
            {point.city}
            <strong>{point.count}</strong>
          </span>
        ))}
      </div>
      <p>PostHog geo stream ready. Connect a server key to swap these live markers from analytics.</p>
    </div>
  )
}
