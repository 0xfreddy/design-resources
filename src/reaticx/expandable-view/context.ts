import { createContext, useContext } from "react"
import type { IExpandableContext } from "./types"

export const ExpandableContext = createContext<IExpandableContext | null>(null)

export function useExpandable(part: string): IExpandableContext {
  const context = useContext(ExpandableContext)
  if (!context) throw new Error(`ExpandableMapView.${part} must be rendered inside <ExpandableView.Root>.`)
  return context
}
