import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, Copy, Share2, X } from "lucide-react"
import { StackBrowser, type StackTab } from "./StackBrowser"

export function ShareStackDialog({ resources, handle, setHandle, close, publish, publishing = false, error, sharedId }: {
  resources: StackTab[]
  handle: string
  setHandle?: (value: string) => void
  close: () => void
  publish?: () => Promise<{ id: string } | undefined>
  publishing?: boolean
  error?: string
  sharedId?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [url, setUrl] = useState(sharedId ? `${location.origin}/?stack=${encodeURIComponent(sharedId)}` : "")
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState("")
  const validHandle = /^@?[a-zA-Z0-9_]{1,15}$/.test(handle.trim())
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.showModal()
    return () => { document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  const share = async () => {
    setCopyError("")
    let link = url
    if (!link) {
      const stack = await publish?.()
      if (!stack) return
      link = `${location.origin}/?stack=${encodeURIComponent(stack.id)}`
      setUrl(link)
    }
    try { await navigator.clipboard.writeText(link); setCopied(true) }
    catch { setCopyError("Your link is ready below. Clipboard access is unavailable.") }
  }
  return createPortal(<dialog ref={dialog} className="share-stack-dialog" aria-labelledby="share-stack-title" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <header><h2 id="share-stack-title">{sharedId ? (handle ? `@${handle.replace(/^@/, "")}'s stack` : "Shared stack") : "Share your stack"}</h2><button type="button" className="dialog-close" aria-label="Close share dialog" title="Close" onClick={close}><X size={18} /></button></header>
    <StackBrowser resources={resources} />
    <form className="share-stack-form" onSubmit={event => { event.preventDefault(); void share() }}>
      {setHandle && !url ? <label>Twitter handle<input value={handle} onChange={event => setHandle(event.target.value)} placeholder="@twitter" aria-label="Twitter handle" required pattern="@?[a-zA-Z0-9_]{1,15}" maxLength={16} /></label> : <span className="share-stack-handle">{handle && <a href={`https://x.com/${encodeURIComponent(handle.replace(/^@/, ""))}`} target="_blank" rel="noreferrer">@{handle.replace(/^@/, "")}</a>}</span>}
      <button className="share-stack-submit" disabled={publishing || (!url && (!validHandle || !resources.length))} type="submit">{copied ? <Check size={15} /> : url ? <Copy size={15} /> : <Share2 size={15} />}{publishing ? "Sharing..." : copied ? "Link copied" : url ? "Copy link" : "Share stack"}</button>
    </form>
    {url && <input className="share-stack-url" aria-label="Stack share link" value={url} readOnly onFocus={event => event.currentTarget.select()} />}
    {error && <p className="stack-status" role="alert">{error}</p>}
    {(copied || copyError) && <p className="stack-status" role="status">{copyError || "Stack link copied."}</p>}
  </dialog>, document.body)
}
