import { Path as WebPath } from "react-native-svg/lib/module/elements.web"

export { G, Svg } from "react-native-svg/lib/module/elements.web"
export type { PathProps, GProps } from "react-native-svg"

// SVG's web Path omits the native measurement API used by Reaticx's StrokePath.
export class Path extends WebPath {
  private layoutFrame = 0

  getTotalLength() {
    return (this.elementRef.current as SVGPathElement | null)?.getTotalLength() ?? 0
  }

  componentDidMount() {
    this.layoutFrame = requestAnimationFrame(() => {
      const bounds = this.elementRef.current?.getBoundingClientRect()
      if (bounds) this.props.onLayout?.({ nativeEvent: { layout: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } } })
    })
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.layoutFrame)
  }
}
