import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { animate } from "framer-motion"

export type StackFlightData = { key: number; id: string; url: string; from: { x: number; y: number; width: number; height: number } }

export function StackFlight({ flight, onLand }: { flight: StackFlightData; onLand: (key: number) => void }) {
  const icon = useRef<HTMLImageElement>(null)
  const complete = useRef(onLand)
  complete.current = onLand
  useEffect(() => {
    const paint = (progress: number) => {
      const target = document.querySelector<HTMLElement>(`.split-builder [data-stack-icon="${CSS.escape(flight.id)}"]`)
      if (!icon.current || !target) return
      const rect = target.getBoundingClientRect()
      // Measure the real tab on each frame while the drawer and tab strip settle.
      const x = flight.from.x + (rect.x - flight.from.x) * progress
      const y = flight.from.y + (rect.y - flight.from.y) * progress - Math.sin(progress * Math.PI) * 32
      icon.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      icon.current.style.width = `${flight.from.width + (rect.width - flight.from.width) * progress}px`
      icon.current.style.height = `${flight.from.height + (rect.height - flight.from.height) * progress}px`
    }
    const animation = animate(0, 1, { duration: 1.15, ease: [0.22, 0.8, 0.25, 1], onUpdate: paint, onComplete: () => { paint(1); complete.current(flight.key) } })
    return () => animation.stop()
  }, [flight])
  return createPortal(<img ref={icon} className="stack-flight" data-flight-id={flight.id} src={flight.url} alt="" style={{ opacity: 1, width: flight.from.width, height: flight.from.height, transform: `translate3d(${flight.from.x}px, ${flight.from.y}px, 0)` }} />, document.body)
}
