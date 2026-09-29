import { LinkPreview } from "./LinkPreview"
import { ResourceCheckbox } from "./ResourceCheckbox"
import type { Resource } from "./resources"

export function ResourceItem({ resource, groupTitle, description, meta, selected = false, onToggleStack }: {
  resource: Resource
  groupTitle: string
  description?: string
  meta?: string
  selected?: boolean
  onToggleStack?: (element?: HTMLElement) => void
}) {
  return <li className={`resource-row${selected ? " selected" : ""}${onToggleStack ? " stackable" : ""}`}>
    <LinkPreview href={resource.url} name={resource.name} description={description ?? resource.note ?? groupTitle} category={groupTitle} selected={selected} onToggleStack={onToggleStack}>
      <span className="resource-logo" aria-hidden="true">
        <img src={`https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(resource.url)}&sz=64`} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="resource-copy">
        <span className="name">{resource.name}</span>
        {resource.note && <span className="description">{resource.note}</span>}
      </span>
      <span className="domain">{meta ?? new URL(resource.url).hostname.replace("www.", "")}</span>
      <span className="arrow" aria-hidden="true">↗</span>
    </LinkPreview>
    {onToggleStack && <ResourceCheckbox name={resource.name} checked={selected} onChange={onToggleStack} />}
  </li>
}
