import { FontAwesomeIcon, type FontAwesomeIconName } from "../../font-awesome-icon"
import { cn } from "../../ui/utils"
import { SCOPE_DIMENSION_KEY } from "../../../lib/slot-requests-calendar/scope-data"
import type { CalendarScope, ScopeDimension } from "../../../lib/slot-requests-calendar/types"

type ScopeDimensionChrome = {
  id: ScopeDimension
  count: number
  icon: FontAwesomeIconName
  iconClass: string
  label: string
}

const DIMENSION_ORDER: ScopeDimension[] = [
  "location",
  "discipline",
  "locationGroup",
  "program",
  "school",
  "status",
]

const DIMENSION_LABELS: Record<ScopeDimension, string> = {
  location: "Location",
  discipline: "Discipline",
  locationGroup: "Location group",
  program: "Program",
  school: "School",
  status: "Status",
}

/** Distinct hues at 600 weight — no shared pastels, no icon backgrounds. */
const DIMENSION_CHROME: Record<ScopeDimension, Pick<ScopeDimensionChrome, "icon" | "iconClass">> = {
  location: {
    icon: "location",
    iconClass: "text-blue-600",
  },
  locationGroup: {
    icon: "mapPin",
    iconClass: "text-teal-600",
  },
  discipline: {
    icon: "tag",
    iconClass: "text-orange-600",
  },
  program: {
    icon: "clipboard",
    iconClass: "text-purple-600",
  },
  school: {
    icon: "graduationCap",
    iconClass: "text-[#3F51B5]",
  },
  status: {
    icon: "circleCheck",
    iconClass: "text-amber-600",
  },
}

const ENTIRE_SITE_CHROME = {
  icon: "building" as const,
  iconClass: "text-[#3F51B5]",
  label: "Entire site — no filters applied",
}

function statusScopeChrome(
  statuses: Set<string>,
): Pick<ScopeDimensionChrome, "icon" | "iconClass"> {
  if (statuses.size !== 1) return DIMENSION_CHROME.status

  const status = [...statuses][0]
  switch (status) {
    case "Confirmed":
    case "Approved":
      return { icon: "circleCheck", iconClass: "text-green-600" }
    case "Not Confirmed":
    case "Review":
    case "Review In Progress":
      return { icon: "clock", iconClass: "text-amber-600" }
    case "To be Scheduled":
    case "Request Pending":
      return { icon: "circle", iconClass: "text-gray-500" }
    case "Cancelled":
    case "Canceled":
    case "Declined":
      return { icon: "x", iconClass: "text-red-600" }
    default:
      return DIMENSION_CHROME.status
  }
}

export function getActiveScopeDimensions(scope: CalendarScope): ScopeDimensionChrome[] {
  return DIMENSION_ORDER.flatMap((id) => {
    const count = scope[SCOPE_DIMENSION_KEY[id]].size
    if (count === 0) return []

    const chrome =
      id === "status" ? statusScopeChrome(scope.statuses) : DIMENSION_CHROME[id]

    return [
      {
        id,
        count,
        ...chrome,
        label: DIMENSION_LABELS[id],
      },
    ]
  })
}

export function scopeFilterCount(scope: CalendarScope): number {
  return getActiveScopeDimensions(scope).reduce((sum, dim) => sum + dim.count, 0)
}

export function scopeTabChrome(id: ScopeDimension) {
  return DIMENSION_CHROME[id]
}

function ScopeIconMark({
  icon,
  iconClass,
  count,
  label,
  size = "md",
}: {
  icon: FontAwesomeIconName
  iconClass: string
  count?: number
  label: string
  size?: "md" | "sm"
}) {
  const iconDim = size === "sm" ? "size-3" : "size-3.5"

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" title={label}>
      <FontAwesomeIcon name={icon} className={cn(iconDim, iconClass)} aria-hidden />
      {count != null && count > 1 ? (
        <span
          className="absolute -right-1.5 -top-1.5 inline-flex min-w-[0.875rem] items-center justify-center rounded-full bg-foreground px-0.5 text-[8px] font-semibold tabular-nums leading-none text-background"
          aria-hidden
        >
          {count}
        </span>
      ) : null}
    </span>
  )
}

/** Master scope trigger — colored semantic icons for active dimensions. */
export function ScopeTriggerSemantics({
  scope,
  size = "md",
  maxIcons = 4,
}: {
  scope: CalendarScope
  size?: "md" | "sm"
  maxIcons?: number
}) {
  const active = getActiveScopeDimensions(scope)

  if (active.length === 0) {
    return (
      <ScopeIconMark
        icon={ENTIRE_SITE_CHROME.icon}
        iconClass={ENTIRE_SITE_CHROME.iconClass}
        label={ENTIRE_SITE_CHROME.label}
        size={size}
      />
    )
  }

  const visible = active.slice(0, maxIcons)
  const overflow = active.length - visible.length

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5" aria-hidden>
      {visible.map((dim) => (
        <ScopeIconMark
          key={dim.id}
          icon={dim.icon}
          iconClass={dim.iconClass}
          count={dim.count}
          label={`${dim.label}${dim.count > 1 ? ` (${dim.count})` : ""}`}
          size={size}
        />
      ))}
      {overflow > 0 ? (
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          +{overflow}
        </span>
      ) : null}
    </span>
  )
}
