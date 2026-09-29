import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useReducedMotion } from "framer-motion"
import { ArrowUpLeft, Clock3, X } from "lucide-react"
import { ScrollableSearch, useScrollableSearch } from "./reaticx/scrollable-search"
import { RadiantAction } from "./RadiantAction"

type Props = { query: string; onChange: (value: string) => void; onPick: () => void; loading: boolean; close: () => void }
const historyKey = "vibecooder-recent-searches"
function readRecent(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(historyKey) ?? "[]")
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 5) : []
  } catch { return [] }
}

function SearchContent({ query, onChange, onPick, loading, close }: Props) {
  const { setIsFocused } = useScrollableSearch()
  const [recent] = useState(readRecent)
  const reducedMotion = useReducedMotion()
  const input = useRef<HTMLInputElement>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    setIsFocused(true)
    input.current?.focus()
    return () => clearTimeout(dismissTimer.current)
  }, [])
  const dismiss = () => {
    setIsFocused(false)
    input.current?.blur()
    if (reducedMotion) close()
    else { clearTimeout(dismissTimer.current); dismissTimer.current = setTimeout(close, 400) }
  }
  const submit = () => {
    const value = query.trim()
    if (!value || loading) return
    try { localStorage.setItem(historyKey, JSON.stringify([value, ...recent.filter(item => item !== value)].slice(0, 5))) } catch { /* Search remains usable without storage. */ }
    onPick()
    dismiss()
  }
  return <div className="mobile-search-content" onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); dismiss() } }}>
    <ScrollableSearch.Overlay onPress={dismiss}>
      <ScrollableSearch.FocusedScreen>
        {recent.length > 0 && <section className="mobile-search-recents" aria-labelledby="recent-searches-heading">
          <h3 id="recent-searches-heading"><Clock3 size={16} />Recent searches</h3>
          <ul>{recent.map(value => <li key={value}><button type="button" onClick={() => { onChange(value); input.current?.focus() }}><span>{value}</span><ArrowUpLeft size={18} /></button></li>)}</ul>
        </section>}
      </ScrollableSearch.FocusedScreen>
    </ScrollableSearch.Overlay>
    <ScrollableSearch.AnimatedComponent focusedOffset={-70} unfocusedOffset={-30} enablePullEffect={false}>
      <form className="mobile-search-form" onSubmit={event => { event.preventDefault(); submit() }}>
        <header><h2 id="mobile-search-title">Describe your next project</h2><button className="icon-button" type="button" title="Close search" aria-label="Close search" onClick={dismiss}><X size={20} /></button></header>
        <div className="mobile-search-input-row">
          <input ref={input} value={query} onChange={event => onChange(event.target.value)} aria-label="what are you building?" placeholder="Describe your next project..." autoComplete="off" spellCheck={false} enterKeyHint="search" />
          {query && <button type="button" className="icon-button" title="Clear search" aria-label="Clear search" onClick={() => { onChange(""); input.current?.focus() }}><X size={16} /></button>}
        </div>
        <RadiantAction label={loading ? "Picking..." : "Pick resources"} onPress={submit} disabled={!query.trim() || loading} compact borderless />
      </form>
    </ScrollableSearch.AnimatedComponent>
  </div>
}

export function MobileSearch(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    // The native dialog must be open before focusing the input on iOS.
    dialog.current?.querySelector("input")?.focus()
    return () => previous?.focus({ preventScroll: true })
  }, [])
  return createPortal(<dialog ref={dialog} className="mobile-search-dialog" aria-labelledby="mobile-search-title" onCancel={event => { event.preventDefault(); props.close() }}>
    <ScrollableSearch><SearchContent {...props} /></ScrollableSearch>
  </dialog>, document.body)
}
