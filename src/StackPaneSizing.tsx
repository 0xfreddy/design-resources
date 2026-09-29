import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { withSpring } from "react-native-reanimated"
import { useSplitView } from "./reaticx/split-view/context"

export function StackPaneSizing({ selected, height }: { selected: boolean; height: number }) {
  const { topHeight, minTop, maxTop, gap } = useSplitView("SplitView.Bottom")
  const previous = useRef({ selected, height, maxTop })
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (previous.current.selected === selected && previous.current.height === height && previous.current.maxTop === maxTop) return
    previous.current = { selected, height, maxTop }
    const target = Math.max(minTop, Math.min(maxTop, height - gap - (selected ? 244 : 94)))
    topHeight.value = reducedMotion ? target : withSpring(target, { damping: 28, stiffness: 240, overshootClamping: true })
  }, [selected, height, gap, minTop, maxTop, reducedMotion, topHeight])
  return null
}
