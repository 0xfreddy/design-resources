import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState, type MouseEvent, type ReactNode } from "react"

type LinkPreviewProps = {
  href: string
  children: ReactNode
}

function getDomain(href: string) {
  return new URL(href).hostname.replace("www.", "")
}

function getScreenshotUrl(href: string) {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(href)}?w=720`
}

export function LinkPreview({ href, children }: LinkPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const previewUrl = getScreenshotUrl(href)

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches)
  }, [])

  const placePreview = (event: MouseEvent<HTMLAnchorElement>) => {
    const gutter = 18
    const shadow = 8
    const width = Math.min(320, window.innerWidth - gutter * 2 - shadow)
    const height = width * 0.625 + 28 + shadow
    const rect = event.currentTarget.getBoundingClientRect()
    const preferredX = rect.right + 16
    let x = preferredX
    let y = rect.top + rect.height / 2 - height / 2

    x = Math.max(gutter, Math.min(x, window.innerWidth - width - shadow - gutter))
    y = Math.max(gutter, Math.min(y, window.innerHeight - height - gutter))

    setPreviewPosition({ x, y })
  }

  return (
    <>
      <a
        className="resource-link"
        href={href}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={(event) => {
          placePreview(event)
          if (!isTouch) setIsHovered(true)
        }}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(false)}
      >
        {children}
      </a>

      <AnimatePresence>
        {isHovered && (
          <motion.aside
            className="site-preview"
            style={{ x: previewPosition.x, y: previewPosition.y }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            aria-hidden="true"
          >
            <div className="preview-bar">
              <span>{getDomain(href)}</span>
            </div>
            <img src={previewUrl} alt="" loading="eager" decoding="async" />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
