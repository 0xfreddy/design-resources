import { useEffect, type ReactNode } from "react"
import { SiriProvider } from "./reaticx/apple-intelligence"
import { useSiri } from "./reaticx/apple-intelligence/context"

function Activate() {
  const siri = useSiri()
  useEffect(() => {
    if (siri.isActive) return
    // Wait for the native View's layout callback before requesting its snapshot.
    const timer = window.setTimeout(() => { void siri.toggle() }, 120)
    return () => clearTimeout(timer)
  }, [siri])
  return null
}

export default function IntelligenceFrame({ children }: { children: ReactNode }) {
  return <SiriProvider border={{ radius: 16, spread: 12, margin: 2 }} wave={{ strength: 0 }} noise={{ strength: 0 }} glow={{ speed: 0.06, colors: ["#c99c74", "#e4bd7d", "#d6a46d", "#bf7d63", "#c99c74"] }} shimmer={{ amount: 0.18, speed: 0.5 }}>
    {children}<Activate />
  </SiriProvider>
}
