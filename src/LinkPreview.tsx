import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useState, type MouseEvent, type ReactNode } from "react"

type LinkPreviewProps = {
  href: string
  children: ReactNode
}

export function LinkPreview({ href, children }: LinkPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const previewX = useSpring(pointerX, { stiffness: 260, damping: 28, mass: 0.45 })
  const previewY = useSpring(pointerY, { stiffness: 260, damping: 28, mass: 0.45 })

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches)
  }, [])

  const movePreview = (event: MouseEvent<HTMLAnchorElement>) => {
    const width = Math.min(420, window.innerWidth - 32)
    const height = width * 0.625
    const gutter = 16
    let x = event.clientX + 24
    let y = event.clientY - height / 2

    if (x + width > window.innerWidth - gutter) x = event.clientX - width - 24
    y = Math.max(gutter, Math.min(y, window.innerHeight - height - gutter))

    pointerX.set(x)
    pointerY.set(y)
  }

  return (
    <>
      <a
        className="resource-link"
        href={href}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={(event) => {
          movePreview(event)
          if (!isTouch) setIsHovered(true)
        }}
        onMouseMove={movePreview}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(false)}
      >
        {children}
      </a>

      <AnimatePresence>
        {isHovered && (
          <motion.aside
            className="site-preview"
            style={{ x: previewX, y: previewY }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            aria-hidden="true"
          >
            <div className="preview-bar">
              <span>{new URL(href).hostname.replace("www.", "")}</span>
            </div>
            <iframe src={href} title="" tabIndex={-1} loading="eager" />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
