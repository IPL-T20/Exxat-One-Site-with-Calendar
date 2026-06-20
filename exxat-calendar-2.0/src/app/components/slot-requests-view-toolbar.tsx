import type { ReactNode } from "react"
import { CalendarModeSwitch } from "./calendar/calendar-shell"
import { CalendarScopeControl } from "./calendar/scope/scope-control"
import type { CalendarModel } from "./calendar/useCalendarModel"
import { ToolbarSegmentButton, ToolbarSegmentTrack } from "./toolbar-segment"
import { cn } from "./ui/utils"

export type SlotListView = "grid" | "kanban" | "calendar"

const VIEW_OPTIONS = [
  { view: "grid" as const, icon: "tableCells", label: "Grid" },
  { view: "calendar" as const, icon: "calendar", label: "Calendar" },
  { view: "kanban" as const, icon: "gripHorizontal", label: "Kanban" },
]

function ToolbarGroupLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium uppercase tracking-wide text-gray-400 font-['Roboto'] whitespace-nowrap flex-shrink-0",
        className,
      )}
    >
      {children}
    </span>
  )
}

function ToolbarDivider() {
  return <div className="hidden sm:block w-px h-6 bg-gray-200 flex-shrink-0" aria-hidden />
}

interface SlotRequestsViewToolbarProps {
  activeView: SlotListView
  onViewChange: (view: SlotListView) => void
  calendarModel: CalendarModel
}

export function SlotRequestsViewToolbar({
  activeView,
  onViewChange,
  calendarModel,
}: SlotRequestsViewToolbarProps) {
  const isCalendar = activeView === "calendar"

  return (
    <div className="bg-white border-b border-gray-200 px-4 flex-shrink-0 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-h-9">
        <div className="flex items-center gap-2">
          <ToolbarGroupLabel>View as</ToolbarGroupLabel>
          <ToolbarSegmentTrack aria-label="List view type">
            {VIEW_OPTIONS.map(({ view, icon, label }) => (
              <ToolbarSegmentButton
                key={view}
                active={activeView === view}
                onClick={() => onViewChange(view)}
                icon={icon}
                label={label}
              />
            ))}
          </ToolbarSegmentTrack>
        </div>

        {isCalendar && (
          <>
            <ToolbarDivider />
            <div className="flex items-center gap-2">
              <ToolbarGroupLabel>Workflow</ToolbarGroupLabel>
              <CalendarModeSwitch model={calendarModel} />
            </div>
            <div className="flex items-center gap-2 sm:ml-auto relative z-20">
              <ToolbarGroupLabel>Scope</ToolbarGroupLabel>
              <CalendarScopeControl model={calendarModel} variant="toolbar" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
