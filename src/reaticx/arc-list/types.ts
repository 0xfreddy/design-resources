import type { ReactNode } from "react"
import type { StyleProp, TextStyle, ViewStyle } from "react-native"
import type { AnimatedRef, SharedValue } from "react-native-reanimated"
import type Animated from "react-native-reanimated"

export type ArcSide = "left" | "right"

export type IArcListContext = {
  scrollRef: AnimatedRef<Animated.ScrollView>
  scrollY: SharedValue<number>
  count: SharedValue<number>
  itemHeight: number
  radius: number
  halfHeight: number
  direction: number
  side: ArcSide
  snap: boolean
  minOpacity: number
  minScale: number
  initialIndex: number
  scrollToIndex: (index: number, animated?: boolean) => void
  setCount: (count: number) => void
}

export type IArcListItemContext = {
  index: number
  proximity: SharedValue<number>
}

export type IArcListRoot = {
  children: ReactNode
  itemHeight?: number
  height?: number
  sweep?: number
  radius?: number
  side?: ArcSide
  snap?: boolean
  index?: number
  defaultIndex?: number
  minOpacity?: number
  minScale?: number
  haptics?: boolean
  onIndexChange?: (index: number) => void
  style?: StyleProp<ViewStyle>
}

export type IArcListViewport = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export type IArcListItem = {
  children: ReactNode
  index?: number
  disabled?: boolean
  onPress?: (index: number) => void
  style?: StyleProp<ViewStyle>
}

export type IArcListLabel = {
  children: ReactNode
  color?: string
  activeColor?: string
  numberOfLines?: number
  style?: StyleProp<TextStyle>
}

export type IArcListIndicator = {
  children?: ReactNode
  size?: number
  color?: string
  activeColor?: string
  borderWidth?: number
  style?: StyleProp<ViewStyle>
}
