import type { ReactNode } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import type { SharedValue, WithSpringConfig } from "react-native-reanimated"

export type IExpandableRoot = {
  children: ReactNode
  collapsedWidth?: number
  expandedWidth?: number
  collapsedHeight?: number
  expandedHeight?: number
  collapsedRadius?: number
  expandedRadius?: number
  pressSpring?: WithSpringConfig
  expandSpring?: WithSpringConfig
  onExpandedChange?: (expanded: boolean) => void
  style?: StyleProp<ViewStyle>
}

export type IExpandableSlot = {
  children?: ReactNode
}

export type IExpandableClose = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export type IExpandableContext = {
  progress: SharedValue<number>
  expanded: boolean
  expand: () => void
  collapse: () => void
}
