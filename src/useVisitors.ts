import { useEffect, useState } from "react"

export type VisitorLocation = { id: string; location: [number, number]; region: string; visits: number }
export type VisitorData = { configured: boolean; total: number; locations: VisitorLocation[] }
const unavailable: VisitorData = { configured: false, total: 0, locations: [] }

export function useVisitors() {
  const [data, setData] = useState<VisitorData>(unavailable)
  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    const heartbeat = async () => {
      try {
        const response = await fetch("/api/live-users", { method: "POST", credentials: "same-origin", signal: controller.signal })
        if (!response.ok) throw new Error("Unavailable")
        const next = await response.json()
        if (!disposed) setData(next)
      } catch { if (!disposed) setData(unavailable) }
      if (!disposed) timer = setTimeout(heartbeat, 30000)
    }
    // Serialize initial requests between tabs so they share the daily cookie.
    const start = () => navigator.locks
      ? navigator.locks.request("resource-visitor-init", async () => { if (!disposed) await heartbeat() })
      : heartbeat()
    void start()
    return () => { disposed = true; controller.abort(); clearTimeout(timer) }
  }, [])
  return data
}
