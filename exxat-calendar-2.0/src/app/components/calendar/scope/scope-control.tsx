import type { CalendarModel } from "../useCalendarModel"
import { ScopeCompactControl } from "./scope-compact"

interface ScopeControlProps {
  model: CalendarModel
  variant?: "default" | "toolbar"
}

export function CalendarScopeControl({ model, variant = "default" }: ScopeControlProps) {
  return (
    <ScopeCompactControl
      rows={model.allRows}
      scope={model.scope}
      onScopeChange={model.setScope}
      variant={variant}
      schedulesContext={model.schedulesContext}
    />
  )
}
