import { useCallback, useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, X } from "lucide-react"
import { LinkPreview } from "./LinkPreview"
import { ResourceItem } from "./ResourceItem"

export type StackTab = { id: string; name: string; url: string; groupTitle: string; note?: string }
const logo = (url: string) => `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`

export function StackBrowser({ resources, remove, flyingIds = [], showResourceList = false }: { resources: StackTab[]; remove?: (id: string) => void; flyingIds?: string[]; showResourceList?: boolean }) {
  const [activeId, setActiveId] = useState(resources.at(-1)?.id)
  const previous = useRef(resources.map(resource => resource.id))
  const strip = useRef<HTMLDivElement>(null)
  const id = useId()
  const reducedMotion = useReducedMotion()
  const active = resources.find(resource => resource.id === activeId) ?? resources.at(-1)
  useEffect(() => {
    const added = resources.find(resource => !previous.current.includes(resource.id))
    if (added) setActiveId(added.id)
    previous.current = resources.map(resource => resource.id)
  }, [resources])
  const revealActiveTab = useCallback(() => {
    const tab = strip.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (tab && strip.current) {
      const bounds = tab.getBoundingClientRect()
      const viewport = strip.current.getBoundingClientRect()
      if (bounds.width && viewport.width) strip.current.scrollTo({ left: strip.current.scrollLeft + bounds.left - viewport.left - 8, behavior: reducedMotion ? "instant" : "smooth" })
    }
  }, [reducedMotion])
  useEffect(() => {
    // A dialog is measured at zero width until showModal makes it visible.
    const observer = new ResizeObserver(revealActiveTab)
    if (strip.current) observer.observe(strip.current)
    revealActiveTab()
    return () => observer.disconnect()
  }, [active?.id, revealActiveTab])
  if (!active) return <div className="stack-board stack-empty"><p>Your stack is empty.</p></div>
  return <div className="stack-board stack-browser">
    <div className="browser-topbar">
      <div className="window-lights" aria-hidden="true"><i /><i /><i /></div>
      <div className="stack-list browser-tabs" ref={strip} role="tablist" aria-label="Your selected resources">
        <AnimatePresence initial={false}>
          {resources.map((resource, index) => <motion.div className="browser-tab" data-active={resource.id === active.id} key={resource.id}
            onAnimationComplete={() => { if (resource.id === active.id) revealActiveTab() }}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 12, width: 0 }} animate={{ opacity: 1, y: 0, width: 172 }} exit={{ opacity: 0, width: 0 }} transition={{ type: "spring", bounce: 0, duration: reducedMotion ? 0 : 0.3 }}>
            <button className="browser-tab-select" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel`} aria-selected={resource.id === active.id} tabIndex={resource.id === active.id ? 0 : -1}
              onClick={() => setActiveId(resource.id)} onKeyDown={event => {
                const next = event.key === "ArrowRight" ? (index + 1) % resources.length : event.key === "ArrowLeft" ? (index - 1 + resources.length) % resources.length : event.key === "Home" ? 0 : event.key === "End" ? resources.length - 1 : null
                if (next !== null) { event.preventDefault(); setActiveId(resources[next].id); document.getElementById(`${id}-tab-${next}`)?.focus() }
              }}>
              <img data-stack-icon={resource.id} style={{ visibility: flyingIds.includes(resource.id) ? "hidden" : "visible" }} src={logo(resource.url)} alt="" /><span>{resource.name}</span>
            </button>
            {remove && <button className="browser-tab-close" title={`Remove ${resource.name}`} aria-label={`Remove ${resource.name} from your stack`} onClick={() => remove(resource.id)}><X size={13} /></button>}
          </motion.div>)}
        </AnimatePresence>
      </div>
    </div>
    <div className="browser-address"><span>{new URL(active.url).hostname}{new URL(active.url).pathname.replace(/\/$/, "")}</span><a href={active.url} target="_blank" rel="noreferrer" title={`Visit ${active.name}`} aria-label={`Visit ${active.name}`}><ArrowUpRight size={15} /></a></div>
    <div className="browser-page" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${resources.indexOf(active)}`}>
      {showResourceList ? <ol className="resource-list list stack-resource-list" aria-label="Stack resources">
        {resources.map(resource => <ResourceItem key={resource.id} resource={resource} groupTitle={resource.groupTitle} selected={resource.id === active.id} />)}
      </ol> : <LinkPreview href={active.url} name={active.name} category={active.groupTitle} description={active.note ?? active.groupTitle} selected onToggleStack={remove ? () => remove(active.id) : undefined}>
        <span><strong>{active.name}</strong><small>{active.note ?? active.groupTitle}</small></span><span className="stack-preview-label">Preview <ArrowUpRight size={14} /></span>
      </LinkPreview>}
    </div>
  </div>
}
