import { createContext, useContext } from "react"
import type { IFanContext } from "./types"

export const FanContext = createContext<IFanContext | null>(null)

export function useFan(): IFanContext {
  const context = useContext(FanContext)
  if (!context) throw new Error("FanMenu parts must be rendered inside <FanMenu>.")
  return context
}
