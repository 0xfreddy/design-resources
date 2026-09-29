import type { ComponentType } from "react"

export function createCompoundComponent<
  T extends ComponentType<any>,
  TParts extends Record<string, unknown> = Record<string, never>,
>(displayName: string, component: T, parts?: TParts): T & TParts {
  ;(component as ComponentType<any> & { displayName?: string }).displayName = displayName
  return Object.assign(component, parts ?? {}) as T & TParts
}
