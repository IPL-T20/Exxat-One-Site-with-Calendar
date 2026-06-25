import type { ReactNode } from "react"
import type { ScheduleTimingFilter } from "../lib/schedules/schedules-list"
import type { ExperienceType } from "../lib/schedules/types"
import { FontAwesomeIcon } from "./font-awesome-icon"
import { ToolbarSegmentButton, ToolbarSegmentTrack } from "./toolbar-segment"
import { cn } from "./ui/utils"

const TIMING_OPTIONS: { id: ScheduleTimingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "current", label: "Current" },
  { id: "completed", label: "Completed" },
]

const EXPERIENCE_OPTIONS: ExperienceType[] = ["Group", "Individual"]

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

interface SchedulesViewToolbarProps {
  timingFilter: ScheduleTimingFilter
  onTimingChange: (timing: ScheduleTimingFilter) => void
  experienceType: ExperienceType
  onExperienceTypeChange: (type: ExperienceType) => void
}

export function SchedulesViewToolbar({
  timingFilter,
  onTimingChange,
  experienceType,
  onExperienceTypeChange,
}: SchedulesViewToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 flex-shrink-0 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-h-9 w-full">
        <div className="flex items-center gap-2">
          <ToolbarGroupLabel>Show</ToolbarGroupLabel>
          <ToolbarSegmentTrack aria-label="Schedule timing">
            {TIMING_OPTIONS.map(({ id, label }) => (
              <ToolbarSegmentButton
                key={id}
                active={timingFilter === id}
                onClick={() => onTimingChange(id)}
                label={label}
              />
            ))}
          </ToolbarSegmentTrack>
        </div>

        <ToolbarDivider />

        <div className="flex items-center gap-2">
          <ToolbarGroupLabel>Type</ToolbarGroupLabel>
          <ToolbarSegmentTrack aria-label="Schedule experience type">
            {EXPERIENCE_OPTIONS.map((tab) => (
              <ToolbarSegmentButton
                key={tab}
                active={experienceType === tab}
                onClick={() => onExperienceTypeChange(tab)}
                label={tab}
              />
            ))}
          </ToolbarSegmentTrack>
        </div>

        <div className="flex-1 min-w-[8px]" />

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-['Roboto'] font-medium text-white bg-[#3F51B5] rounded hover:bg-[#354499] transition-colors flex-shrink-0"
        >
          <FontAwesomeIcon name="plus" className="w-3.5 h-3.5" aria-hidden="true" />
          Add Schedule
        </button>
      </div>
    </div>
  )
}
