import { View, type ViewProps } from "react-native"

export type BlurViewProps = ViewProps & {
  intensity?: number
  tint?: "light" | "dark" | "default" | "prominent" | "systemUltraThinMaterial" | string
}

export function BlurView({ intensity: _intensity, tint: _tint, style, ...props }: BlurViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.34)",
          backdropFilter: "blur(18px)",
        } as any,
        style,
      ]}
    />
  )
}
