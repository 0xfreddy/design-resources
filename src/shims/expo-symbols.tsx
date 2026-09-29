import { Text, type TextStyle } from "react-native"

type SymbolViewProps = {
  name?: string
  size?: number
  tintColor?: string
  weight?: TextStyle["fontWeight"]
}

export function SymbolView({ name, size = 18, tintColor = "black", weight = "600" }: SymbolViewProps) {
  const glyph = name === "xmark" ? "×" : name?.slice(0, 1) ?? "×"

  return (
    <Text style={{ color: tintColor, fontSize: size, fontWeight: weight, lineHeight: size }}>
      {glyph}
    </Text>
  )
}
