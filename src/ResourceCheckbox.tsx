import { useCallback, useRef } from "react"
import { Pressable, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { Checkbox } from "./reaticx/check-box"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function ResourceCheckbox({ name, checked, onChange }: { name: string; checked: boolean; onChange: (source?: HTMLElement) => void }) {
  const source = useRef<HTMLDivElement>(null)
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const onPressIn = useCallback(() => { scale.value = withSpring(0.9, { damping: 15, stiffness: 300, mass: 0.5 }) }, [scale])
  const onPressOut = useCallback(() => { scale.value = withSpring(1, { damping: 12, stiffness: 250, mass: 0.5 }) }, [scale])
  return <div className="resource-checkbox" ref={source} title={checked ? "Remove from stack" : "Add to stack"}
    onKeyDownCapture={event => {
      if (event.key !== " " && event.key !== "Enter") return
      event.preventDefault()
      event.stopPropagation()
      if (!event.repeat) onPressIn()
    }}
    onKeyUpCapture={event => {
      if (event.key !== " " && event.key !== "Enter") return
      event.preventDefault()
      event.stopPropagation()
      onPressOut()
      onChange(source.current ?? undefined)
    }} onBlur={onPressOut}>
    <AnimatedPressable accessibilityRole="checkbox" accessibilityLabel={`Select ${name} for your stack`} accessibilityState={{ checked }} aria-checked={checked}
      hitSlop={6} onPress={() => onChange(source.current ?? undefined)} onPressIn={onPressIn} onPressOut={onPressOut} style={animatedStyle}>
      <View style={{ width: 20, height: 20, backgroundColor: checked ? "var(--ink)" : "var(--surface-strong)", borderRadius: 5, borderWidth: 1, borderColor: "var(--line)", justifyContent: "center", alignItems: "center" }}>
        <Checkbox checked={checked} showBorder={false} checkmarkColor={checked ? "var(--paper)" : "var(--ink)"} size={26} stroke={4} />
      </View>
    </AnimatedPressable>
  </div>
}
