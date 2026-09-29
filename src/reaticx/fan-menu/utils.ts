import { FanDirection, FanItemDirection, FanPosition, type IResolvedConfig } from "./types"

export function directionAngle(direction: FanDirection): number {
  switch (direction) {
    case FanDirection.Down:
      return 90
    case FanDirection.Left:
      return 180
    case FanDirection.Right:
      return 0
    case FanDirection.Up:
    default:
      return -90
  }
}

export function resolveSweep(direction: FanDirection, itemDirection: FanItemDirection): number {
  const clockwise = itemDirection === FanItemDirection.Clockwise
  if (direction === FanDirection.Up) return clockwise ? 1 : -1
  if (direction === FanDirection.Down) return clockwise ? -1 : 1
  if (direction === FanDirection.Left) return clockwise ? 1 : -1
  return clockwise ? -1 : 1
}

export function computeItemGeometry(rank: number, config: IResolvedConfig) {
  const angle = config.baseAngle + config.sweep * Math.min(config.spread, rank * config.spacing)
  const distance = 44 + rank * 13
  const radians = (angle * Math.PI) / 180

  return {
    x: Math.cos(radians) * distance,
    y: Math.sin(radians) * distance,
    rotate: config.tilt * config.sweep * rank,
  }
}

export function resolveAnchor(position: FanPosition, offset: number, buttonSize: number, screenWidth: number) {
  const sideOffset = offset
  const bottomOffset = offset
  const topOffset = offset

  switch (position) {
    case FanPosition.BottomLeft:
      return { left: sideOffset, bottom: bottomOffset }
    case FanPosition.TopRight:
      return { left: screenWidth - buttonSize - sideOffset, top: topOffset }
    case FanPosition.TopLeft:
      return { left: sideOffset, top: topOffset }
    case FanPosition.BottomRight:
    default:
      return { left: screenWidth - buttonSize - sideOffset, bottom: bottomOffset }
  }
}
