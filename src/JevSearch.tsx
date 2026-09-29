import { useLayoutEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { SearchBar } from "./reaticx/search-bar/SearchBar"
import { RadiantAction } from "./RadiantAction"

export function JevSearch({ query, onChange, onPick, loading, dark }: { query: string; onChange: (text: string) => void; onPick: () => void; loading: boolean; dark: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const update = () => setWidth(host.current?.clientWidth ?? 0)
    const observer = new ResizeObserver(update)
    if (host.current) observer.observe(host.current)
    update()
    return () => observer.disconnect()
  }, [])
  const actionWidth = width < 520 ? 142 : 262
  const disabled = !query.trim() || loading
  const label = loading ? "Picking..." : "Pick resources"
  return <div className="jev-search-row">
    <label htmlFor="resource-prompt" id="recommender-title">what are you building?</label>
    <div className="jev-search" ref={host}>
      {width > 0 && <SearchBar containerWidth={width} focusedWidth={Math.max(100, width - actionWidth)} cancelButtonWidth={actionWidth}
        centerWhenUnfocused={false} nativeID="resource-prompt" accessibilityLabel="what are you building?"
        inputStyle={{ color: dark ? "#e4e0d5" : "#181713", fontSize: 12, minHeight: 32, outlineWidth: 0 } as any}
        placeholder="Describe your next project..." tint={dark ? "#e4e0d5" : "#181713"}
        autoComplete="off" importantForAutofill="no" textContentType="none" spellCheck={false}
        iconStyle={{ display: "none" }}
        onSearch={onChange} onClear={() => onChange("")} onSubmitEditing={onPick}
        renderLeadingIcons={() => null}
        renderTrailingIcons={() => <X size={14} color="var(--muted)" />}
        renderAction={focused => focused ? <div className="jev-pick-action" style={{ width: actionWidth - 12 }}>
          <RadiantAction label={label} onPress={onPick} disabled={disabled} compact={width < 520} />
        </div> : null} />}
    </div>
  </div>
}
