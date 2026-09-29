// Web adaptation of the ScrollableSearch source supplied by the user.
import { createContext, useContext, useRef, useState, useMemo, memo, useEffect, type ReactNode } from "react"
import { Keyboard, StyleSheet, View, type ViewStyle } from "react-native"
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { useReducedMotion } from "framer-motion"

type Children = { children: ReactNode }
type SearchContext = {
  isFocused: boolean
  setIsFocused: (focused: boolean) => void
  scrollY: SharedValue<number>
  pullDistance: SharedValue<number>
  shouldAutoFocus: SharedValue<boolean>
  onPullToFocusCallback: { current: (() => void) | null }
}
const ScrollableSearchContext = createContext<SearchContext | null>(null)
export const useScrollableSearch = () => {
  const context = useContext(ScrollableSearchContext)
  if (!context) throw new Error("ScrollableSearch compound components must be rendered within <ScrollableSearch>")
  return context
}

const ScrollableSearchRoot = memo(({ children }: Children) => {
  const [isFocused, setIsFocused] = useState(false)
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollY = useSharedValue(0)
  const pullDistance = useSharedValue(0)
  const shouldAutoFocus = useSharedValue(false)
  const onPullToFocusCallback = useRef<(() => void) | null>(null)
  const setIsFocusedWithDelay = (focused: boolean) => {
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current)
    if (!focused) dismissTimeoutRef.current = setTimeout(() => Keyboard.dismiss(), 450)
    setIsFocused(focused)
  }
  useEffect(() => () => { if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current) }, [])
  const value = useMemo(() => ({ isFocused, setIsFocused: setIsFocusedWithDelay, scrollY, pullDistance, shouldAutoFocus, onPullToFocusCallback }), [isFocused, scrollY, pullDistance, shouldAutoFocus])
  return <ScrollableSearchContext.Provider value={value}><View style={styles.wrapper}>{children}</View></ScrollableSearchContext.Provider>
})

const ScrollContent = memo(({ children, pullThreshold = 80 }: Children & { pullThreshold?: number }) => {
  const { isFocused, scrollY, pullDistance, shouldAutoFocus, onPullToFocusCallback } = useScrollableSearch()
  const triggerFocus = () => onPullToFocusCallback.current?.()
  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const offsetY = event.contentOffset.y
      scrollY.value = offsetY
      if (offsetY < 0) {
        pullDistance.value = Math.abs(offsetY)
        if (pullDistance.value > pullThreshold && !shouldAutoFocus.value) {
          shouldAutoFocus.value = true
          scheduleOnRN(triggerFocus)
        }
      } else pullDistance.value = 0
    },
    onEndDrag: () => { "worklet"; shouldAutoFocus.value = false },
  })
  return <Animated.View style={StyleSheet.absoluteFill} pointerEvents={isFocused ? "none" : "auto"}>
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={8} bounces>{children}</Animated.ScrollView>
  </Animated.View>
})

const AnimatedComponent = memo(({ children, focusedOffset = -90, unfocusedOffset = 30, enablePullEffect = true, onPullToFocus, springConfig = { damping: 18, stiffness: 120, mass: 0.6 } }: Children & {
  focusedOffset?: number; unfocusedOffset?: number; enablePullEffect?: boolean; onPullToFocus?: () => void
  springConfig?: { damping: number; stiffness: number; mass: number }
}) => {
  const { isFocused, scrollY, pullDistance, onPullToFocusCallback } = useScrollableSearch()
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (onPullToFocus) onPullToFocusCallback.current = onPullToFocus
    return () => { onPullToFocusCallback.current = null }
  }, [onPullToFocus, onPullToFocusCallback])
  const searchStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: enablePullEffect && !reducedMotion ? interpolate(pullDistance.value, [0, 60, 120], [1, 1.02, 1.05], Extrapolation.CLAMP) : 1 },
      { translateY: -scrollY.value },
    ],
    shadowOpacity: enablePullEffect ? interpolate(pullDistance.value, [0, 60], [0.05, 0.2], Extrapolation.CLAMP) : 0.05,
  }))
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reducedMotion ? focusedOffset : withSpring(isFocused ? focusedOffset : unfocusedOffset, springConfig) }],
    opacity: interpolate(scrollY.value, [0, 100], [1, 0], Extrapolation.CLAMP),
  }), [isFocused, reducedMotion])
  return <Animated.View style={[styles.animatedContainer, containerStyle]}>
    <View style={{ paddingTop: "env(safe-area-inset-top, 0px)" } as unknown as ViewStyle}><Animated.View style={searchStyle}>{children}</Animated.View></View>
  </Animated.View>
})

const Overlay = memo(({ children, onPress, enableBlur = true, maxBlurIntensity = 80 }: Children & { onPress?: () => void; enableBlur?: boolean; maxBlurIntensity?: number }) => {
  const { isFocused, pullDistance, setIsFocused } = useScrollableSearch()
  const reducedMotion = useReducedMotion()
  const animatedStyle = useAnimatedStyle(() => {
    const duration = reducedMotion ? 0 : isFocused ? 350 : 400
    const intensity = isFocused ? withTiming(maxBlurIntensity, { duration }) : pullDistance.value > 0
      ? interpolate(pullDistance.value, [0, 20, 80], [0, 30, maxBlurIntensity], Extrapolation.CLAMP) : withTiming(0, { duration })
    return {
      opacity: isFocused ? withTiming(1, { duration }) : pullDistance.value > 0 ? interpolate(pullDistance.value, [0, 10], [0, 1], Extrapolation.CLAMP) : withTiming(0, { duration }),
      backdropFilter: enableBlur ? `blur(${intensity * 0.2}px)` : "none",
    } as unknown as ViewStyle
  }, [isFocused, maxBlurIntensity, reducedMotion, enableBlur])
  // Keep the backdrop separate from the content so input clicks cannot dismiss it.
  return <Animated.View nativeID="mobile-search-overlay" style={[styles.overlay, animatedStyle]} pointerEvents={isFocused ? "auto" : "none"}>
    <button className="mobile-search-backdrop" tabIndex={-1} aria-label="Dismiss search" onClick={() => { setIsFocused(false); onPress?.() }} />
    {children}
  </Animated.View>
})

const FocusedScreen = memo(({ children }: Children) => {
  const { isFocused } = useScrollableSearch()
  const reducedMotion = useReducedMotion()
  const animatedStyle = useAnimatedStyle(() => ({ opacity: withTiming(isFocused ? 1 : 0, { duration: reducedMotion ? 0 : isFocused ? 350 : 400 }) }), [isFocused, reducedMotion])
  return <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents={isFocused ? "box-none" : "none"}>{children}</Animated.View>
})

export const ScrollableSearch = Object.assign(ScrollableSearchRoot, { ScrollContent, AnimatedComponent, Overlay, FocusedScreen })
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { paddingTop: 100, paddingBottom: 20 },
  animatedContainer: { position: "absolute", top: 90, left: 0, right: 0, zIndex: 100, backgroundColor: "transparent" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
})
