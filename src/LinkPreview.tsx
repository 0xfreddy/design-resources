import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ArrowUpRight, Check, Plus, X } from "lucide-react"
import { faviconUrl, handleFaviconError } from "./favicon"

type LinkPreviewProps = {
  href: string
  name: string
  description: string
  category: string
  children: ReactNode
  selected?: boolean
  onToggleStack?: (element?: HTMLElement) => void
}

const loadedScreenshots = new Set<string>()
const pendingScreenshots = new Set<string>()

export function LinkPreview({ href, name, description, category, children, selected, onToggleStack }: LinkPreviewProps) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const anchor = useRef<HTMLAnchorElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const domain = new URL(href).hostname.replace("www.", "")
  const screenshot = `https://image.thum.io/get/width/960/crop/600/noanimate/${href}`

  const warm = () => {
    if (loadedScreenshots.has(screenshot) || pendingScreenshots.has(screenshot)) return
    pendingScreenshots.add(screenshot)
    const image = new Image()
    image.onload = () => { loadedScreenshots.add(screenshot); pendingScreenshots.delete(screenshot) }
    image.onerror = () => pendingScreenshots.delete(screenshot)
    image.src = screenshot
  }
  const keep = () => { clearTimeout(closeTimer.current); setHovered(true) }
  const leave = () => { closeTimer.current = setTimeout(() => setHovered(false), 180) }
  const open = () => { clearTimeout(closeTimer.current); setHovered(false); setExpanded(true); warm() }

  useEffect(() => () => clearTimeout(closeTimer.current), [])
  useEffect(() => {
    if (!hovered) return
    const close = () => setHovered(false)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close) }
  }, [hovered])
  useEffect(() => {
    if (!expanded) return
    dialog.current?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = overflow; anchor.current?.focus({ preventScroll: true }) }
  }, [expanded])

  const previewImage = (
    <div className="preview-image-area">
      {!loaded && <div className="preview-fallback"><img src={faviconUrl(href)} onError={event => handleFaviconError(event.currentTarget, href)} alt="" /><span>{failed ? "Screenshot unavailable" : name}</span></div>}
      <img className={loaded ? "loaded" : ""} src={screenshot} alt={`${name} website preview`} decoding="async"
        onLoad={() => { loadedScreenshots.add(screenshot); setLoaded(true) }} onError={() => setFailed(true)} />
    </div>
  )
  const content = (
    <div className="preview-modal-content">
      <button className="icon-button preview-modal-close" title="Close preview" aria-label="Close preview" onClick={() => setExpanded(false)}><X size={20} /></button>
      <div className="preview-modal-frame">{previewImage}</div>
      <div className="preview-modal-footer">
        <img className="preview-resource-logo" src={faviconUrl(href)} onError={event => handleFaviconError(event.currentTarget, href)} alt="" />
        <div className="preview-resource-copy"><strong>{name}</strong><p>{description}</p><small>{category} · {domain}</small></div>
        {onToggleStack && <button className="icon-button" title={selected ? "Remove from stack" : "Add to stack"} aria-label={selected ? "Remove from stack" : "Add to stack"} aria-pressed={selected} onClick={() => onToggleStack()}>{selected ? <Check size={19} /> : <Plus size={19} />}</button>}
        <a className="visit-site" href={href} target="_blank" rel="noreferrer">Visit site <ArrowUpRight size={16} /></a>
      </div>
    </div>
  )
  return <>
    <a ref={anchor} className="resource-link" href={href} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey) { event.preventDefault(); open() } }}
      onFocus={warm} onMouseEnter={() => {
        warm()
        if (!window.matchMedia("(hover: hover)").matches || expanded) return
        setLoaded(loadedScreenshots.has(screenshot))
        const rect = anchor.current!.getBoundingClientRect()
        const width = Math.min(292, window.innerWidth - 32)
        setPosition({ x: Math.max(16, Math.min(rect.right + 12, window.innerWidth - width - 16)), y: Math.max(16, Math.min(rect.top - 50, window.innerHeight - 260)) })
        keep()
      }} onMouseLeave={leave}>{children}</a>
    {createPortal(<AnimatePresence>{hovered && !expanded && <motion.aside className="site-preview" style={{ left: position.x, top: position.y }} onMouseEnter={keep} onMouseLeave={leave}
      onWheel={event => { anchor.current?.closest(".directory")?.parentElement?.scrollBy({ top: event.deltaY, left: event.deltaX }); setHovered(false) }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <div className="preview-frame">{previewImage}</div>
      <div className="preview-actions"><span>{name}</span></div>
    </motion.aside>}</AnimatePresence>, document.body)}
    {expanded && createPortal(<dialog ref={dialog} className="preview-dialog" aria-label={`${name} preview`} onCancel={event => { event.preventDefault(); setExpanded(false) }} onClick={event => { if (event.target === event.currentTarget) setExpanded(false) }}>
      <div className="preview-modal">
        {content}
      </div>
    </dialog>, document.body)}
  </>
}
