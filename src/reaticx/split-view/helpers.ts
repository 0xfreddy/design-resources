export function clamp(value: number, min: number, max: number) {
  "worklet"
  return Math.min(Math.max(value, min), max)
}

export function resolveSnapTarget(
  value: number,
  velocity: number,
  snapPoints: number[],
  velocityThreshold: number,
) {
  "worklet"
  if (Math.abs(velocity) > velocityThreshold) {
    const sorted = [...snapPoints].sort((a, b) => a - b)
    if (velocity > 0) {
      for (let index = 0; index < sorted.length; index += 1) {
        if (sorted[index] > value) return sorted[index]
      }
      return sorted[sorted.length - 1]
    }

    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      if (sorted[index] < value) return sorted[index]
    }
    return sorted[0]
  }

  return snapPoints.reduce((best, point) =>
    Math.abs(point - value) < Math.abs(best - value) ? point : best,
  )
}
