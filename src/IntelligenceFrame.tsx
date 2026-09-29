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
  return <SiriProvider border={{ radius: 16, spread: 12, margin: 2 }} wave={{ strength: 0 }} noise={{ strength: 0 }} glow={{ speed: 0.24, colors: ["#FF6B9D", "#C44AFF", "#5856D6", "#00C9FF", "#FF6B9D"] }}>
    {children}<Activate />
  </SiriProvider>
}
