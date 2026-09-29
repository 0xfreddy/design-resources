import { Text } from "react-native"

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

export { Feather }
