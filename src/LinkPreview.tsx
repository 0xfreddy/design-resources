import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ArrowUpRight, Check, Expand, Plus, X } from "lucide-react"

const IntelligenceFrame = lazy(async () => {
  const { LoadSkiaWeb } = await import("@shopify/react-native-skia/lib/module/web/LoadSkiaWeb")
  await LoadSkiaWeb({ locateFile: () => new URL("../node_modules/canvaskit-wasm/bin/full/canvaskit.wasm", import.meta.url).href })
  return import("./IntelligenceFrame")
})

class PreviewEffectBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

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
const getLogo = (url: string) => `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`

export function LinkPreview({ href, name, description, category, children, selected, onToggleStack }: LinkPreviewProps) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const anchor = useRef<HTMLAnchorElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const reduceMotion = useReducedMotion()
  const domain = new URL(href).hostname.replace("www.", "")
  const screenshot = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(href)}?w=960`

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
      {!loaded && <div className="preview-fallback"><img src={getLogo(href)} alt="" /><span>{failed ? "Screenshot unavailable" : name}</span></div>}
      <img className={loaded ? "loaded" : ""} src={screenshot} alt={`${name} website preview`} decoding="async"
        onLoad={() => { loadedScreenshots.add(screenshot); setLoaded(true) }} onError={() => setFailed(true)} />
    </div>
  )
  const content = (
    <div className="preview-modal-content">
      <button className="icon-button preview-modal-close" title="Close preview" aria-label="Close preview" onClick={() => setExpanded(false)}><X size={20} /></button>
      <div className="preview-modal-frame">{previewImage}</div>
      <div className="preview-modal-footer">
        <img className="preview-resource-logo" src={getLogo(href)} alt="" />
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <div className="preview-frame">{previewImage}</div>
      <div className="preview-actions"><span>{name}</span><button title="Expand preview" aria-label={`Expand ${name} preview`} onClick={open}><Expand size={16} /></button></div>
    </motion.aside>}</AnimatePresence>, document.body)}
    {expanded && createPortal(<dialog ref={dialog} className="preview-dialog" aria-label={`${name} preview`} onCancel={event => { event.preventDefault(); setExpanded(false) }} onClick={event => { if (event.target === event.currentTarget) setExpanded(false) }}>
      <div className="preview-modal">
        {reduceMotion ? content : <PreviewEffectBoundary fallback={content}><Suspense fallback={content}><IntelligenceFrame>{content}</IntelligenceFrame></Suspense></PreviewEffectBoundary>}
      </div>
    </dialog>, document.body)}
  </>
}
