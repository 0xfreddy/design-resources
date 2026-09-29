import type { ReactNode } from "react"
import type { StyleProp, TextStyle, ViewStyle } from "react-native"
import type { GestureType } from "react-native-gesture-handler"
import type { SharedValue, WithSpringConfig } from "react-native-reanimated"

export type ISplitViewRoot = {
  children: ReactNode
  initialTopHeight?: number
  minTopHeight?: number
  minBottomHeight?: number
  maxTopHeight?: number
  gap?: number
  snapPoints?: number[]
  velocityThreshold?: number
  springConfig?: WithSpringConfig
  onHeightChange?: (height: number) => void
  style?: StyleProp<ViewStyle>
}

export type ISplitViewPane = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export type ISplitViewHandle = {
  color?: string
  style?: StyleProp<ViewStyle>
  barStyle?: StyleProp<ViewStyle>
}

export type ISplitViewTitle = {
  children: ReactNode
  style?: StyleProp<TextStyle>
}

export type ISplitViewContext = {
  topHeight: SharedValue<number>
  handleScale: SharedValue<number>
  gap: number
  minTop: number
  maxTop: number
  gesture: GestureType
}
