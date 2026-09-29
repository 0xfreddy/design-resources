import type { ReactNode } from "react"
import type { StyleProp, ViewStyle, TextStyle } from "react-native"
import type { SharedValue, WithSpringConfig } from "react-native-reanimated"

export enum FanDirection {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export enum FanItemDirection {
  Clockwise = "clockwise",
  CounterClockwise = "counter-clockwise",
}

export enum FanPosition {
  BottomRight = "bottom-right",
  BottomLeft = "bottom-left",
  TopRight = "top-right",
  TopLeft = "top-left",
}

export type IResolvedConfig = {
  baseAngle: number
  sweep: number
  spread: number
  spacing: number
  tilt: number
  springConfig: WithSpringConfig
  stagger: number
}

export type IFanMenu = {
  children?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onOpen?: () => void
  onClose?: () => void
  position?: FanPosition
  offset?: number
  direction?: FanDirection
  itemDirection?: FanItemDirection
  spacing?: number
  spread?: number
  tilt?: number
  stagger?: number
  springConfig?: WithSpringConfig
  buttonSize?: number
  closeOnBackdropPress?: boolean
  style?: StyleProp<ViewStyle>
}

export type IFanTrigger = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export type IFanItem = {
  children?: ReactNode
  value?: string
  onPress?: (value?: string) => void
  style?: StyleProp<ViewStyle>
}

export type IFanItemIcon = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export type IFanItemLabel = {
  children?: ReactNode
  style?: StyleProp<TextStyle>
}

export type IFanContext = {
  progress: SharedValue<number>
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  pressItem: (value?: string, cb?: (value?: string) => void) => void
  registerItem: (id: string) => void
  unregisterItem: (id: string) => void
  order: string[]
  config: IResolvedConfig
  buttonSize: number
}
