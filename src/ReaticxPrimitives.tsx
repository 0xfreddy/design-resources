import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import createGlobe from "cobe"

type SpringConfig = {
  stiffness?: number
  damping?: number
  mass?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function lerp(input: number, inputRange: [number, number], outputRange: [number, number]) {
  const t = clamp((input - inputRange[0]) / (inputRange[1] - inputRange[0]), 0, 1)
  return outputRange[0] + (outputRange[1] - outputRange[0]) * t
}

function createCompoundComponent<Name extends string, Component>(displayName: Name, component: Component) {
  if (typeof component === "function") {
    ;(component as { displayName?: string }).displayName = displayName
  }
  return component
}

type FanDirection = "up" | "down" | "left" | "right"
type FanItemDirection = "clockwise" | "counter-clockwise"

type FanContextValue = {
  isOpen: boolean
  order: string[]
  buttonSize: number
  config: {
    baseAngle: number
    sweep: number
    spacing: number
    spread: number
    tilt: number
    stagger: number
  }
  toggle: () => void
  close: () => void
  pressItem: (value?: string, callback?: (value?: string) => void) => void
  registerItem: (id: string) => void
  unregisterItem: (id: string) => void
}

type IFanMenu = {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onOpen?: () => void
  onClose?: () => void
  direction?: FanDirection
  itemDirection?: FanItemDirection
  spacing?: number
  spread?: number
  tilt?: number
  stagger?: number
  springConfig?: SpringConfig
  buttonSize?: number
  closeOnBackdropPress?: boolean
  className?: string
}

type IFanTrigger = {
  children?: ReactNode
  className?: string
}

type IFanItem = {
  children: ReactNode
  value?: string
  onPress?: (value?: string) => void
  className?: string
}

type IFanItemIcon = {
  children: ReactNode
  className?: string
}

type IFanItemLabel = {
  children: ReactNode
  className?: string
}

const FanContext = createContext<FanContextValue | null>(null)

function useFan() {
  const context = useContext(FanContext)
  if (!context) throw new Error("FanMenu parts must be rendered inside <FanMenu.Root>.")
  return context
}

function directionAngle(direction: FanDirection) {
  if (direction === "up") return -90
  if (direction === "down") return 90
  if (direction === "left") return 180
  return 0
}

function resolveSweep(direction: FanDirection, itemDirection: FanItemDirection) {
  const clockwise = itemDirection === "clockwise"
  if (direction === "up") return clockwise ? 1 : -1
  if (direction === "down") return clockwise ? -1 : 1
  if (direction === "left") return clockwise ? 1 : -1
  return clockwise ? -1 : 1
}

function computeItemGeometry(rank: number, config: FanContextValue["config"]) {
  const angle = config.baseAngle + config.sweep * Math.min(config.spread, rank * config.spacing)
  const distance = 44 + rank * 13
  const radians = (angle * Math.PI) / 180

  return {
    x: Math.cos(radians) * distance,
    y: Math.sin(radians) * distance,
    rotate: config.tilt * config.sweep * rank,
  }
}

const FanRoot = memo(function FanRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  onOpen,
  onClose,
  direction = "up",
  itemDirection = "clockwise",
  spacing = 38,
  spread = 92,
  tilt = 8,
  stagger = 0.025,
  buttonSize = 42,
  closeOnBackdropPress = true,
  className = "",
}: IFanMenu) {
  const isControlled = open !== undefined
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isOpen = isControlled ? Boolean(open) : uncontrolled
  const [order, setOrder] = useState<string[]>([])
  const wasOpen = useRef(isOpen)

  useEffect(() => {
    if (wasOpen.current === isOpen) return
    wasOpen.current = isOpen
    if (isOpen) onOpen?.()
    else onClose?.()
  }, [isOpen, onClose, onOpen])

  const setOpenState = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const toggle = useCallback(() => setOpenState(!isOpen), [isOpen, setOpenState])
  const close = useCallback(() => setOpenState(false), [setOpenState])
  const pressItem = useCallback(
    (itemValue?: string, callback?: (value?: string) => void) => {
      callback?.(itemValue)
      setOpenState(false)
    },
    [setOpenState],
  )
  const registerItem = useCallback((id: string) => {
    setOrder((current) => (current.includes(id) ? current : [...current, id]))
  }, [])
  const unregisterItem = useCallback((id: string) => {
    setOrder((current) => current.filter((item) => item !== id))
  }, [])

  const value = useMemo<FanContextValue>(
    () => ({
      isOpen,
      order,
      buttonSize,
      config: {
        baseAngle: directionAngle(direction),
        sweep: resolveSweep(direction, itemDirection),
        spacing,
        spread,
        tilt,
        stagger,
      },
      toggle,
      close,
      pressItem,
      registerItem,
      unregisterItem,
    }),
    [
      buttonSize,
      close,
      direction,
      isOpen,
      itemDirection,
      order,
      pressItem,
      registerItem,
      spacing,
      spread,
      stagger,
      tilt,
      toggle,
      unregisterItem,
    ],
  )

  return (
    <FanContext.Provider value={value}>
      <div className={`fan-menu ${className}`} style={{ width: buttonSize * 2, height: buttonSize }}>
        {closeOnBackdropPress && isOpen && <button className="fan-backdrop" type="button" onClick={value.close} />}
        {children}
      </div>
    </FanContext.Provider>
  )
})

const FanTrigger = memo(function FanTrigger({ children, className = "" }: IFanTrigger) {
  const { toggle, isOpen, buttonSize } = useFan()

  return (
    <motion.button
      type="button"
      className={`fan-menu-trigger ${className}`}
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-expanded={isOpen}
      style={{ width: buttonSize + 34, height: buttonSize }}
    >
      <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ type: "spring", bounce: 0.16 }}>
        {children ?? "+"}
      </motion.span>
    </motion.button>
  )
})

const FanItem = memo(function FanItem({ children, value, onPress, className = "" }: IFanItem) {
  const id = useId()
  const { order, registerItem, unregisterItem, isOpen, config, buttonSize, pressItem } = useFan()
  const index = order.indexOf(id)
  const count = order.length
  const rank = Math.max(count - index, 1)
  const geometry = useMemo(() => computeItemGeometry(rank, config), [rank, config])

  useEffect(() => {
    registerItem(id)
    return () => unregisterItem(id)
  }, [id, registerItem, unregisterItem])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.button
          type="button"
          className={`fan-menu-item ${className}`}
          onClick={() => pressItem(value, onPress)}
          initial={{ opacity: 0, x: 0, y: 0, rotate: -8, scale: 0.92, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: geometry.x, y: geometry.y, rotate: geometry.rotate, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 0, y: 0, rotate: -8, scale: 0.96, filter: "blur(4px)" }}
          transition={{ type: "spring", bounce: 0.18, duration: 0.34, delay: Math.max(index, 0) * config.stagger }}
          whileTap={{ scale: 1.1 }}
          style={{ left: buttonSize / 2, top: buttonSize / 2 }}
        >
          {children}
        </motion.button>
      )}
    </AnimatePresence>
  )
})

const FanItemIcon = memo(function FanItemIcon({ children, className = "" }: IFanItemIcon) {
  return <span className={`fan-item-icon ${className}`}>{children}</span>
})

const FanItemLabel = memo(function FanItemLabel({ children, className = "" }: IFanItemLabel) {
  return <span className={`fan-item-label ${className}`}>{children}</span>
})

const FanMenu = Object.assign(FanRoot, {
  Root: FanRoot,
  Trigger: FanTrigger,
  Item: FanItem,
  Icon: FanItemIcon,
  Label: FanItemLabel,
})

type SplitViewContextValue = {
  topHeight: number
  minTopHeight: number
  maxTopHeight: number
  gap: number
  handleScale: number
  setDragging: (dragging: boolean) => void
  setTopHeight: (height: number) => void
}

type ISplitViewRoot = {
  children: ReactNode
  initialTopHeight?: number
  minTopHeight?: number
  minBottomHeight?: number
  maxTopHeight?: number
  gap?: number
  snapPoints?: number[]
  velocityThreshold?: number
  onHeightChange?: (height: number) => void
  className?: string
}

type ISplitViewPane = {
  children: ReactNode
  className?: string
}

type ISplitViewHandle = {
  className?: string
  barClassName?: string
}

type ISplitViewTitle = {
  children: ReactNode
  className?: string
}

const SplitViewContext = createContext<SplitViewContextValue | null>(null)

function useSplitView(part: string) {
  const context = useContext(SplitViewContext)
  if (!context) throw new Error(`SplitView.${part} must be rendered inside <SplitView.Root>.`)
  return context
}

function resolveSnapTarget(value: number, velocity: number, snapPoints: number[], velocityThreshold: number) {
  if (Math.abs(velocity) > velocityThreshold) {
    const sorted = [...snapPoints].sort((a, b) => a - b)
    if (velocity > 0) return sorted.find((point) => point > value) ?? sorted[sorted.length - 1]
    return [...sorted].reverse().find((point) => point < value) ?? sorted[0]
  }

  return snapPoints.reduce((best, point) => (Math.abs(point - value) < Math.abs(best - value) ? point : best), snapPoints[0])
}

const SplitViewRoot = memo(function SplitViewRoot({
  children,
  initialTopHeight = 540,
  minTopHeight = 320,
  minBottomHeight = 240,
  maxTopHeight,
  gap = 18,
  snapPoints,
  velocityThreshold = 900,
  onHeightChange,
  className = "",
}: ISplitViewRoot) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [topHeight, setTopHeightState] = useState(initialTopHeight)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ pointerY: 0, height: initialTopHeight, time: 0 })

  const minTop = minTopHeight
  const maxTop = maxTopHeight ?? (containerHeight > 0 ? Math.max(minTop + 1, containerHeight - gap - minBottomHeight) : Math.max(initialTopHeight, minTop + 1))
  const boundedTopHeight = clamp(topHeight, minTop, maxTop)
  const resolvedSnapPoints = useMemo(() => {
    if (snapPoints?.length) return [...snapPoints].sort((a, b) => a - b)
    return [minTop, (minTop + maxTop) / 2, maxTop]
  }, [maxTop, minTop, snapPoints])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (containerHeight <= 0) return
    setTopHeightState((current) => clamp(current, minTop, maxTop))
  }, [containerHeight, maxTop, minTop])

  const setTopHeight = useCallback(
    (height: number) => {
      setTopHeightState(clamp(height, minTop, maxTop))
    },
    [maxTop, minTop],
  )

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = { pointerY: event.clientY, height: boundedTopHeight, time: performance.now() }
    setDragging(true)
  }

  const updateDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setTopHeight(dragStart.current.height + event.clientY - dragStart.current.pointerY)
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    const elapsed = Math.max(performance.now() - dragStart.current.time, 1)
    const velocity = ((event.clientY - dragStart.current.pointerY) / elapsed) * 1000
    const target = resolveSnapTarget(boundedTopHeight, velocity, resolvedSnapPoints, velocityThreshold)
    setDragging(false)
    setTopHeightState(target)
    onHeightChange?.(target)
  }

  const value = useMemo(
    () => ({
      topHeight: boundedTopHeight,
      minTopHeight: minTop,
      maxTopHeight: maxTop,
      gap,
      handleScale: dragging ? 1.18 : 1,
      setDragging,
      setTopHeight,
    }),
    [boundedTopHeight, dragging, gap, maxTop, minTop, setTopHeight],
  )

  return (
    <SplitViewContext.Provider value={value}>
      <div
        ref={rootRef}
        className={`split-view-root ${dragging ? "is-dragging" : ""} ${className}`}
        style={{ ["--split-top-height" as string]: `${boundedTopHeight}px`, ["--split-gap" as string]: `${gap}px` }}
        onPointerMove={updateDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {Children.map(children, (child) =>
          isValidElement(child) && child.type === SplitViewHandle
            ? cloneElement(child, { onPointerDown: beginDrag } as { onPointerDown: typeof beginDrag })
            : child,
        )}
      </div>
    </SplitViewContext.Provider>
  )
})

const SplitViewTop = memo(function SplitViewTop({ children, className = "" }: ISplitViewPane) {
  const { topHeight, minTopHeight } = useSplitView("Top")
  const opacity = lerp(topHeight, [minTopHeight, minTopHeight + 60], [0.2, 1])

  return (
    <motion.div className={`split-view-pane split-view-top ${className}`} animate={{ height: topHeight, opacity }} transition={{ type: "spring", bounce: 0, duration: 0.34 }}>
      {children}
    </motion.div>
  )
})

const SplitViewHandle = memo(function SplitViewHandle({ className = "", barClassName = "", ...props }: ISplitViewHandle & { onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void }) {
  const { gap, handleScale } = useSplitView("Handle")

  return (
    <div className={`split-view-handle ${className}`} style={{ height: gap }} onPointerDown={props.onPointerDown}>
      <motion.span className={barClassName} animate={{ scale: handleScale }} transition={{ type: "spring", bounce: 0.18 }} />
    </div>
  )
})

const SplitViewBottom = memo(function SplitViewBottom({ children, className = "" }: ISplitViewPane) {
  const { topHeight, maxTopHeight } = useSplitView("Bottom")
  const opacity = lerp(topHeight, [maxTopHeight - 60, maxTopHeight], [1, 0.2])

  return (
    <motion.div className={`split-view-pane split-view-bottom ${className}`} animate={{ opacity }} transition={{ type: "spring", bounce: 0, duration: 0.34 }}>
      {children}
    </motion.div>
  )
})

const SplitViewTitle = memo(function SplitViewTitle({ children, className = "" }: ISplitViewTitle) {
  return <div className={`split-view-title ${className}`}>{children}</div>
})

const SplitView = Object.assign(SplitViewRoot, {
  Root: SplitViewRoot,
  Top: SplitViewTop,
  Handle: SplitViewHandle,
  Bottom: SplitViewBottom,
  Title: SplitViewTitle,
})

type ArcSide = "left" | "right"

type ArcListContextValue = {
  itemHeight: number
  height: number
  sweep: number
  side: ArcSide
  minOpacity: number
  minScale: number
  activeIndex: number
  scrollToIndex: (index: number) => void
}

type ArcListItemContextValue = {
  index: number
  proximity: number
}

type IArcListRoot = {
  children: ReactNode
  itemHeight?: number
  height?: number
  sweep?: number
  side?: ArcSide
  defaultIndex?: number
  minOpacity?: number
  minScale?: number
  onIndexChange?: (index: number) => void
  className?: string
}

type IArcListViewport = {
  children: ReactNode
  className?: string
}

type IArcListItem = {
  children: ReactNode
  index?: number
  disabled?: boolean
  onPress?: (index: number) => void
  className?: string
}

type IArcListLabel = {
  children: ReactNode
  className?: string
}

type IArcListIndicator = {
  children?: ReactNode
  className?: string
}

const ArcListContext = createContext<ArcListContextValue | null>(null)
const ArcListItemContext = createContext<ArcListItemContextValue | null>(null)
const ArcListIndexContext = createContext<number | null>(null)

function useArcList(part: string) {
  const context = useContext(ArcListContext)
  if (!context) throw new Error(`ArcList.${part} must be rendered inside <ArcList.Root>.`)
  return context
}

function useArcListItem(part: string) {
  const context = useContext(ArcListItemContext)
  if (!context) throw new Error(`ArcList.${part} must be rendered inside <ArcList.Item>.`)
  return context
}

function radiusForSweep(halfHeight: number, sweep: number) {
  const radians = (Math.abs(sweep) * Math.PI) / 180
  return halfHeight / Math.sin(Math.max(radians / 2, 0.1))
}

function offsetForIndex(index: number, itemHeight: number) {
  return index * itemHeight
}

function itemOffset(index: number, itemHeight: number, scrollY: number) {
  return index * itemHeight - scrollY
}

function projectOnArc(offset: number, radius: number, direction: number) {
  const angle = offset / radius
  const translateX = direction * radius * (1 - Math.cos(angle))
  const rotate = direction * angle * (180 / Math.PI)
  const visible = Math.abs(angle) < Math.PI * 0.92

  return { translateX, translateY: 0, rotate, visible }
}

const ArcListRoot = memo(function ArcListRoot({
  children,
  itemHeight = 36,
  height = 248,
  sweep = 52,
  side = "left",
  defaultIndex = 0,
  minOpacity = 0.36,
  minScale = 0.92,
  onIndexChange,
  className = "",
}: IArcListRoot) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(offsetForIndex(defaultIndex, itemHeight))
  const [activeIndex, setActiveIndex] = useState(defaultIndex)

  const scrollToIndex = useCallback(
    (index: number) => {
      viewportRef.current?.scrollTo({ top: offsetForIndex(index, itemHeight), behavior: "smooth" })
    },
    [itemHeight],
  )

  const value = useMemo<ArcListContextValue>(
    () => ({
      itemHeight,
      height,
      sweep,
      side,
      minOpacity,
      minScale,
      activeIndex,
      scrollToIndex,
    }),
    [activeIndex, height, itemHeight, minOpacity, minScale, scrollToIndex, side, sweep],
  )

  return (
    <ArcListContext.Provider value={value}>
      <div
        className={`arc-list-root ${className}`}
        style={{ height, ["--arc-item-height" as string]: `${itemHeight}px` }}
        onScroll={(event) => {
          const nextScrollY = event.currentTarget.scrollTop
          const nextIndex = Math.round(nextScrollY / itemHeight)
          setScrollY(nextScrollY)
          if (nextIndex !== activeIndex) {
            setActiveIndex(nextIndex)
            onIndexChange?.(nextIndex)
          }
        }}
        ref={viewportRef}
      >
        <ArcListScrollContext.Provider value={scrollY}>{children}</ArcListScrollContext.Provider>
      </div>
    </ArcListContext.Provider>
  )
})

const ArcListScrollContext = createContext(0)

const ArcListViewport = memo(function ArcListViewport({ children, className = "" }: IArcListViewport) {
  const { height, itemHeight } = useArcList("Viewport")
  const contentPadding = Math.max(height / 2 - itemHeight / 2, 0)

  const rows = Children.map(children, (child, index) => (
    <ArcListIndexContext.Provider value={index}>{child}</ArcListIndexContext.Provider>
  ))

  return (
    <div className={`arc-list-viewport ${className}`} style={{ paddingBlock: contentPadding }}>
      {rows}
    </div>
  )
})

const ArcListItem = memo(function ArcListItem({ children, index: indexProp, disabled = false, onPress, className = "" }: IArcListItem) {
  const { itemHeight, height, sweep, side, minOpacity, minScale, scrollToIndex } = useArcList("Item")
  const scrollY = useContext(ArcListScrollContext)
  const injected = useContext(ArcListIndexContext)
  const index = indexProp ?? injected ?? 0
  const halfHeight = height / 2
  const radius = radiusForSweep(halfHeight, sweep)
  const direction = side === "right" ? -1 : 1
  const offset = itemOffset(index, itemHeight, scrollY)
  const distance = Math.abs(offset)
  const { translateX, translateY, rotate, visible } = projectOnArc(offset, radius, direction)
  const proximity = lerp(distance, [0, itemHeight * 2.4], [1, 0])
  const opacity = visible ? lerp(distance, [0, halfHeight], [1, minOpacity]) : 0
  const scale = lerp(distance, [0, halfHeight], [1, minScale])

  const handlePress = () => {
    scrollToIndex(index)
    onPress?.(index)
  }

  return (
    <ArcListItemContext.Provider value={{ index, proximity }}>
      <button
        type="button"
        className={`arc-list-item ${side === "right" ? "is-right" : "is-left"} ${className}`}
        disabled={disabled}
        onClick={handlePress}
        style={{
          height: itemHeight,
          opacity,
          zIndex: 100 - Math.min(Math.round(distance / itemHeight), 8),
          transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`,
        }}
      >
        {children}
      </button>
    </ArcListItemContext.Provider>
  )
})

const ArcListLabel = memo(function ArcListLabel({ children, className = "" }: IArcListLabel) {
  const { proximity } = useArcListItem("Label")

  return (
    <span className={`arc-list-label ${className}`} style={{ ["--arc-proximity" as string]: proximity }}>
      {children}
    </span>
  )
})

const ArcListIndicator = memo(function ArcListIndicator({ children, className = "" }: IArcListIndicator) {
  const { proximity } = useArcListItem("Indicator")

  return (
    <span className={`arc-list-indicator ${className}`} style={{ ["--arc-proximity" as string]: proximity }}>
      {children}
    </span>
  )
})

const ArcList = createCompoundComponent(
  "ArcList",
  Object.assign(ArcListRoot, {
    Root: createCompoundComponent("ArcList.Root", ArcListRoot),
    Viewport: createCompoundComponent("ArcList.Viewport", ArcListViewport),
    Item: createCompoundComponent("ArcList.Item", ArcListItem),
    Label: createCompoundComponent("ArcList.Label", ArcListLabel),
    Indicator: createCompoundComponent("ArcList.Indicator", ArcListIndicator),
  }),
)

type ExpandableContextValue = {
  expanded: boolean
  expand: () => void
  collapse: () => void
}

type IExpandableRoot = {
  children: ReactNode
  collapsedWidth?: number
  expandedWidth?: number
  collapsedHeight?: number
  expandedHeight?: number
  collapsedRadius?: number
  expandedRadius?: number
  onExpandedChange?: (expanded: boolean) => void
  className?: string
}

type IExpandableSlot = {
  children: ReactNode
}

type IExpandableClose = {
  children?: ReactNode
  className?: string
}

const ExpandableContext = createContext<ExpandableContextValue | null>(null)

function useExpandable(part: string) {
  const context = useContext(ExpandableContext)
  if (!context) throw new Error(`ExpandableView.${part} must be rendered inside <ExpandableView.Root>.`)
  return context
}

const ExpandableCollapsed = createCompoundComponent("ExpandableView.Collapsed", function ExpandableCollapsed(_: IExpandableSlot) {
  return null
})
const ExpandableExpanded = createCompoundComponent("ExpandableView.Expanded", function ExpandableExpanded(_: IExpandableSlot) {
  return null
})
;(ExpandableCollapsed as { role?: string }).role = "collapsed"
;(ExpandableExpanded as { role?: string }).role = "expanded"

const ExpandableRoot = memo(function ExpandableRoot({
  children,
  collapsedWidth = 220,
  expandedWidth = 380,
  collapsedHeight = 42,
  expandedHeight = 420,
  collapsedRadius = 999,
  expandedRadius = 18,
  onExpandedChange,
  className = "",
}: IExpandableRoot) {
  const [expanded, setExpanded] = useState(false)
  const collapsedNode = useMemo(
    () =>
      Children.toArray(children).find(
        (child) => isValidElement(child) && (child.type as { role?: string })?.role === "collapsed",
      ) as React.ReactElement<IExpandableSlot> | undefined,
    [children],
  )
  const expandedNode = useMemo(
    () =>
      Children.toArray(children).find(
        (child) => isValidElement(child) && (child.type as { role?: string })?.role === "expanded",
      ) as React.ReactElement<IExpandableSlot> | undefined,
    [children],
  )

  const context = useMemo<ExpandableContextValue>(
    () => ({
      expanded,
      expand: () => {
        setExpanded(true)
        onExpandedChange?.(true)
      },
      collapse: () => {
        setExpanded(false)
        onExpandedChange?.(false)
      },
    }),
    [expanded, onExpandedChange],
  )

  return (
    <ExpandableContext.Provider value={context}>
      <motion.div
        className={`expandable-view ${expanded ? "expanded" : ""} ${className}`}
        animate={{
          width: expanded ? expandedWidth : collapsedWidth,
          height: expanded ? expandedHeight : collapsedHeight,
          borderRadius: expanded ? expandedRadius : collapsedRadius,
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.42 }}
      >
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="expanded"
              className="expandable-expanded"
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
            >
              {expandedNode?.props.children}
            </motion.div>
          )}
          {!expanded && (
            <motion.button
              key="collapsed"
              type="button"
              className="expandable-collapsed"
              onClick={context.expand}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              whileTap={{ scale: 1.06 }}
            >
              {collapsedNode?.props.children}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </ExpandableContext.Provider>
  )
})

const ExpandableClose = memo(function ExpandableClose({ children, className = "" }: IExpandableClose) {
  const { collapse } = useExpandable("Close")

  return (
    <button type="button" className={`expandable-close ${className}`} onClick={collapse}>
      {children ?? "×"}
    </button>
  )
})

const ExpandableView = Object.assign(ExpandableRoot, {
  Root: ExpandableRoot,
  Collapsed: ExpandableCollapsed,
  Expanded: ExpandableExpanded,
  Close: ExpandableClose,
})

type SiriContextValue = {
  toggle: () => void
  isActive: boolean
}

const SiriContext = createContext<SiriContextValue | null>(null)

export function SiriProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const value = useMemo(() => ({ isActive, toggle: () => setIsActive((current) => !current) }), [isActive])

  return (
    <SiriContext.Provider value={value}>
      <div className={`siri-provider ${isActive ? "is-active" : ""}`}>{children}</div>
    </SiriContext.Provider>
  )
}

export function AppleIntelligenceFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  const rotate = useMotionValue(0)
  const springRotate = useSpring(rotate, { stiffness: 40, damping: 12 })
  const background = useTransform(
    springRotate,
    (value) => `conic-gradient(from ${value}deg, #4cc9f0, #b14cff, #ff7a59, #65f0a8, #4cc9f0)`,
  )

  useEffect(() => {
    let frame = 0
    let active = true
    const tick = () => {
      rotate.set((rotate.get() + 0.65) % 360)
      if (active) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => {
      active = false
      window.cancelAnimationFrame(frame)
    }
  }, [rotate])

  return (
    <motion.div className={`apple-frame ${className}`}>
      <motion.div className="apple-frame-aura" style={{ background }} />
      <div className="apple-frame-content">{children}</div>
    </motion.div>
  )
}

interface CdnMarker {
  id: string
  location: [number, number]
  region: string
}

interface CdnArc {
  id: string
  from: [number, number]
  to: [number, number]
}

interface GlobeCdnProps {
  markers?: CdnMarker[]
  arcs?: CdnArc[]
  className?: string
  speed?: number
}

const defaultMarkers: CdnMarker[] = [
  { id: "cdn-iad", location: [38.95, -77.45], region: "iad1" },
  { id: "cdn-sfo", location: [37.62, -122.38], region: "sfo1" },
  { id: "cdn-cdg", location: [49.01, 2.55], region: "cdg1" },
  { id: "cdn-hnd", location: [35.55, 139.78], region: "hnd1" },
  { id: "cdn-syd", location: [-33.95, 151.18], region: "syd1" },
  { id: "cdn-gru", location: [-23.43, -46.47], region: "gru1" },
  { id: "cdn-sin", location: [1.36, 103.99], region: "sin1" },
  { id: "cdn-arn", location: [59.65, 17.93], region: "arn1" },
  { id: "cdn-dub", location: [53.43, -6.25], region: "dub1" },
  { id: "cdn-bom", location: [19.09, 72.87], region: "bom1" },
]

const defaultArcs: CdnArc[] = [
  { id: "cdn-arc-1", from: [38.95, -77.45], to: [49.01, 2.55] },
  { id: "cdn-arc-2", from: [37.62, -122.38], to: [35.55, 139.78] },
  { id: "cdn-arc-3", from: [49.01, 2.55], to: [1.36, 103.99] },
  { id: "cdn-arc-4", from: [38.95, -77.45], to: [-23.43, -46.47] },
  { id: "cdn-arc-5", from: [35.55, 139.78], to: [-33.95, 151.18] },
  { id: "cdn-arc-6", from: [49.01, 2.55], to: [19.09, 72.87] },
]

export function GlobeCdn({ markers = defaultMarkers, arcs = defaultArcs, className = "", speed = 0.003 }: GlobeCdnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)
  const [traffic, setTraffic] = useState(() =>
    defaultArcs.map((arc, index) => ({ id: arc.id, value: [420, 380, 290, 185, 156, 134][index] || 100 })),
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTraffic((data) =>
        data.map((item) => ({
          ...item,
          value: Math.max(50, item.value + Math.floor(Math.random() * 21) - 10),
        })),
      )
    }, 250)
    return () => window.clearInterval(interval)
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    pointerInteracting.current = { x: event.clientX, y: event.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (event.clientX - pointerInteracting.current.x) / 300,
          theta: (event.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId = 0
    let phi = 0

    function init() {
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 10,
        baseColor: [1, 1, 1],
        markerColor: [0, 0, 0],
        glowColor: [0.94, 0.93, 0.91],
        markerElevation: 0.02,
        markers: markers.map((marker) => ({ location: marker.location, size: 0.012, id: marker.id })),
        arcs: arcs.map((arc) => ({ from: arc.from, to: arc.to, id: arc.id })),
        arcColor: [0, 0, 0],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.7,
      })

      function animate() {
        if (!isPausedRef.current) phi += speed
        globe?.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        })
        animationId = requestAnimationFrame(animate)
      }
      animate()
      window.setTimeout(() => canvas && (canvas.style.opacity = "1"))
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const observer = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          observer.disconnect()
          init()
        }
      })
      observer.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      globe?.destroy()
    }
  }, [markers, arcs, speed])

  const pyramidFaceStyle = (nth: number): CSSProperties => {
    const transforms = [
      "rotateY(0deg) translateZ(4px) rotateX(19.5deg)",
      "rotateY(120deg) translateZ(4px) rotateX(19.5deg)",
      "rotateY(240deg) translateZ(4px) rotateX(19.5deg)",
      "rotateX(-90deg) rotateZ(60deg) translateY(4px)",
    ]
    const colors = ["#111", "#333", "#555", "#222"]
    return {
      position: "absolute",
      left: -0.5,
      top: 0,
      width: 0,
      height: 0,
      borderLeft: "6.5px solid transparent",
      borderRight: "6.5px solid transparent",
      borderBottom: `13px solid ${colors[nth]}`,
      transformOrigin: "center bottom",
      transform: transforms[nth],
    }
  }

  return (
    <div className={`globe-cdn ${className}`}>
      <canvas ref={canvasRef} onPointerDown={handlePointerDown} />
      {markers.map((marker) => (
        <div key={marker.id} className="globe-marker">
          <div className="globe-pyramid">
            {[0, 1, 2, 3].map((face) => (
              <div key={face} style={pyramidFaceStyle(face)} />
            ))}
          </div>
          <span>{marker.region}</span>
        </div>
      ))}
      {traffic.map((item) => (
        <div key={item.id} className="globe-traffic">
          {item.value}k req/s
        </div>
      ))}
    </div>
  )
}

export {
  ArcList,
  ExpandableView,
  FanMenu,
  SplitView,
  type ArcSide,
  type IArcListRoot,
  type IExpandableRoot,
  type IFanMenu,
  type ISplitViewRoot,
}
