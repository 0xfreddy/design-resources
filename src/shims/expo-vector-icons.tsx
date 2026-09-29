import { Text } from "react-native"
import { Search, X } from "lucide-react"

type IconProps = {
  name?: string
  size?: number
  color?: string
}

function Feather({ name, size = 20, color = "currentColor" }: IconProps) {
  const glyph = name === "plus" ? "+" : name === "x" ? "×" : name?.slice(0, 1) ?? "+"

  return (
    <Text
      style={{
        color,
        fontSize: size,
        fontWeight: "600",
        lineHeight: size,
      }}
    >
      {glyph}
    </Text>
  )
}

function Ionicons({ name, size = 20, color = "currentColor" }: IconProps) {
  const Icon = name === "search" ? Search : X
  return <Icon size={size} color={color} />
}

export { Feather, Ionicons }
