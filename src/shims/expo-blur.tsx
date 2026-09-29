import { View, type ViewProps } from "react-native"

export type BlurViewProps = ViewProps & {
  intensity?: number
  tint?: "light" | "dark" | "default" | "prominent" | "systemUltraThinMaterial" | string
}

export function BlurView({ intensity = 0, tint: _tint, style, ...props }: BlurViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: "transparent",
          backdropFilter: `blur(${Math.max(0, intensity) * 0.2}px)`,
        } as any,
        style,
      ]}
    />
  )
}
