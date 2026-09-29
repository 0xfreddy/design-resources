import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState, type MouseEvent, type ReactNode } from "react"
import { AppleIntelligenceFrame } from "./ReaticxPrimitives"

type LinkPreviewProps = {
  href: string
  children: ReactNode
}

const loadedScreenshots = new Set<string>()

function getDomain(href: string) {
  return new URL(href).hostname.replace("www.", "")
}

function getScreenshotUrl(href: string) {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(href)}?w=480`
}

function getLogoUrl(href: string) {
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(href)}&sz=64`
}

function warmPreview(src: string) {
  if (loadedScreenshots.has(src)) return
  const image = new Image()
  image.onload = () => loadedScreenshots.add(src)
  image.src = src
}

export function LinkPreview({ href, children }: LinkPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPreviewHovered, setIsPreviewHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const previewUrl = getScreenshotUrl(href)
  const domain = getDomain(href)

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches)
  }, [])

  useEffect(() => {
    setImageLoaded(loadedScreenshots.has(previewUrl))
  }, [previewUrl])

  const placePreview = (event: MouseEvent<HTMLAnchorElement>) => {
    const gutter = 14
    const shadow = 10
    const width = Math.min(292, window.innerWidth - gutter * 2 - shadow)
    const height = width * 0.625 + 30 + shadow
    const rect = event.currentTarget.getBoundingClientRect()
    const preferredX = rect.right + 14
    const fallbackX = rect.left - width - 14
    let x = preferredX + width + gutter <= window.innerWidth ? preferredX : fallbackX
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
          warmPreview(previewUrl)
          setImageLoaded(loadedScreenshots.has(previewUrl))
          placePreview(event)
          if (!isTouch) setIsHovered(true)
        }}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(false)}
      >
        {children}
      </a>

      <AnimatePresence>
        {(isHovered || isPreviewHovered) && (
          <motion.aside
            className="site-preview"
            style={{ x: previewPosition.x, y: previewPosition.y }}
            onMouseEnter={() => setIsPreviewHovered(true)}
            onMouseLeave={() => setIsPreviewHovered(false)}
            initial={{ opacity: 0, scale: 0.985, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.985, filter: "blur(3px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.24 }}
          >
            <div className="preview-bar">
              <img src={getLogoUrl(href)} alt="" />
              <span>{domain}</span>
            </div>
            <div className="preview-frame">
              {!imageLoaded && (
                <div className="preview-fallback">
                  <img src={getLogoUrl(href)} alt="" />
                  <span>loading preview</span>
                </div>
              )}
              <img
                className={imageLoaded ? "loaded" : ""}
                src={previewUrl}
                alt=""
                loading="eager"
                decoding="async"
                onLoad={() => {
                  loadedScreenshots.add(previewUrl)
                  setImageLoaded(true)
                }}
              />
            </div>
            <div className="preview-actions">
              <span>
                <img src={getLogoUrl(href)} alt="" />
                {domain}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  setIsExpanded(true)
                  setIsHovered(false)
                  setIsPreviewHovered(false)
                }}
              >
                expand
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="preview-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <AppleIntelligenceFrame className="preview-modal">
              <button type="button" className="preview-modal-close" onClick={() => setIsExpanded(false)}>
                close
              </button>
              <div className="preview-modal-frame">
                <img src={previewUrl} alt="" />
              </div>
              <div className="preview-modal-footer">
                <span>
                  <img src={getLogoUrl(href)} alt="" />
                  <strong>{domain}</strong>
                  <small>preview opened inside vibecooder.dev</small>
                </span>
                <a href={href} target="_blank" rel="noreferrer">
                  Visit site ↗
                </a>
              </div>
            </AppleIntelligenceFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
