import { createContext, useContext } from "react"
import type { ISplitViewContext } from "./types"

export const SplitViewContext = createContext<ISplitViewContext | null>(null)

export function useSplitView(part: string): ISplitViewContext {
  const context = useContext(SplitViewContext)
  if (!context) throw new Error(`SplitView.${part} must be rendered inside <SplitView.Root>.`)
  return context
}
