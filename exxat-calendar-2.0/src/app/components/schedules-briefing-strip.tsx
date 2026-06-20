import { FontAwesomeIcon } from "./font-awesome-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import type {
  BriefingCardId,
  SchedulesBriefingMetrics,
  SchedulesCalendarQuickLens,
} from "../lib/schedules/schedules-calendar-lens"

const BRIEFING_CARDS: {
  id: BriefingCardId
  label: string
  info: string
  metricKey: keyof SchedulesBriefingMetrics
  lens: SchedulesCalendarQuickLens
  accentWhenPositive?: boolean
}[] = [
  {
    id: "today_total",
    label: "Today",
    info: "Confirmed schedules that intersect today — starting, active, or ending.",
    metricKey: "todayTotal",
    lens: "today",
  },
  {
    id: "starting_today",
    label: "Starting today",
    info: "Schedules whose start date is today.",
    metricKey: "startingToday",
    lens: "today",
  },
  {
    id: "active_today",
    label: "Active today",
    info: "Schedules in progress today (started before today, still running).",
    metricKey: "activeToday",
    lens: "today",
  },
  {
    id: "at_risk",
    label: "At risk",
    info: "Rare but critical: compliance gaps, missing assignments, unconfirmed near start, or recently cancelled.",
    metricKey: "atRisk",
    lens: "at_risk",
    accentWhenPositive: true,
  },
  {
    id: "starting_in_7",
    label: "Starting in 7 days",
    info: "Schedules starting within the next week — proactive prep window.",
    metricKey: "startingIn7Days",
    lens: "starting_soon",
  },
]

function metricCaption(id: BriefingCardId, value: number): string {
  switch (id) {
    case "today_total":
      return value === 1 ? "1 schedule today" : `${value} schedules today`
    case "starting_today":
      return value === 0 ? "None starting" : value === 1 ? "1 new start" : `${value} new starts`
    case "active_today":
      return value === 0 ? "None in progress" : value === 1 ? "1 in progress" : `${value} in progress`
    case "at_risk":
      return value === 0 ? "None flagged" : value === 1 ? "1 needs review" : `${value} need review`
    case "starting_in_7":
      return value === 0 ? "None upcoming" : value === 1 ? "1 upcoming start" : `${value} upcoming starts`
  }
}

function valueColor(id: BriefingCardId, value: number): string {
  if (id === "at_risk" && value > 0) return "#DC2626"
  if (value === 0) return "#94a3b8"
  return "#3F51B5"
}

interface SchedulesBriefingStripProps {
  metrics: SchedulesBriefingMetrics
  activeLens: SchedulesCalendarQuickLens
  onSelectLens: (lens: SchedulesCalendarQuickLens) => void
}

export function SchedulesBriefingStrip({
  metrics,
  activeLens,
  onSelectLens,
}: SchedulesBriefingStripProps) {
  return (
    <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
      <div
        className="bg-white rounded border border-gray-200 flex flex-wrap sm:flex-nowrap divide-y sm:divide-y-0 sm:divide-x divide-gray-200 shadow-sm"
        role="list"
        aria-label="Schedules briefing"
      >
        {BRIEFING_CARDS.map(({ id, label, info, metricKey, lens }) => {
          const value = metrics[metricKey]
          const caption = metricCaption(id, value)
          const color = valueColor(id, value)
          const isActive = activeLens === lens && (id !== "today_total" || activeLens === "today")

          return (
            <div key={id} role="listitem" className="flex-1 px-4 py-3 min-w-[9rem] bg-white">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[11px] text-gray-500 font-['Roboto'] leading-none">{label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-5 min-h-5 min-w-5 items-center justify-center rounded-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F51B5]/40"
                      aria-label={`About ${label}`}
                    >
                      <FontAwesomeIcon name="circleInfo" className="size-3" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-left leading-snug">
                    {info}
                  </TooltipContent>
                </Tooltip>
              </div>
              <button
                type="button"
                className={`w-full text-left rounded-md -mx-1 px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F51B5]/40 ${
                  isActive ? "bg-indigo-50 ring-1 ring-[#3F51B5]/20" : "hover:bg-gray-50"
                }`}
                onClick={() => onSelectLens(lens)}
                aria-label={`${label}: ${value}. Open ${lens} view.`}
                aria-pressed={isActive}
              >
                <p
                  className="text-[22px] font-bold font-['Roboto'] leading-none tabular-nums"
                  style={{ color }}
                >
                  {value}
                </p>
                <p className="text-[11px] font-['Roboto'] mt-1.5 leading-snug text-gray-400">{caption}</p>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
