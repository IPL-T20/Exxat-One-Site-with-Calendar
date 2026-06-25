import type { CalendarModel } from "../useCalendarModel"
import { ScopeCompactControl } from "./scope-compact"

interface ScopeControlProps {
  model: CalendarModel
  variant?: "default" | "toolbar"
  popoverAlign?: "start" | "center" | "end"
}

export function CalendarScopeControl({
  model,
  variant = "default",
  popoverAlign,
}: ScopeControlProps) {
  return (
    <ScopeCompactControl
      rows={model.allRows}
      scope={model.scope}
      onScopeChange={model.setScope}
      variant={variant}
      schedulesContext={model.schedulesContext}
      popoverAlign={popoverAlign}
    />
  )
}
