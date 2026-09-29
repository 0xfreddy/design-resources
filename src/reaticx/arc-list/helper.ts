export function offsetForIndex(index: number, itemHeight: number) {
  "worklet"
  return index * itemHeight
}

export function indexAt(scrollY: number, itemHeight: number, count: number) {
  "worklet"
  if (count <= 0) return -1
  return Math.max(0, Math.min(count - 1, Math.round(scrollY / itemHeight)))
}

export function itemOffset(index: number, itemHeight: number, scrollY: number) {
  "worklet"
  return index * itemHeight - scrollY
}

export function radiusForSweep(halfHeight: number, sweep: number) {
  "worklet"
  const radians = (Math.abs(sweep) * Math.PI) / 180
  return halfHeight / Math.sin(Math.max(radians / 2, 0.1))
}

export function projectOnArc(offset: number, radius: number, direction: number) {
  "worklet"
  const angle = offset / radius
  const translateX = direction * radius * (1 - Math.cos(angle))
  const rotate = direction * angle * (180 / Math.PI)
  const visible = Math.abs(angle) < Math.PI * 0.92

  return {
    translateX,
    translateY: 0,
    rotate,
    y: offset,
    visible,
  }
}
