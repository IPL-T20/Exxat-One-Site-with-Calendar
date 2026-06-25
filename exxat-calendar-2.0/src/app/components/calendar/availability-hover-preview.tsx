import type { ReactNode, RefObject } from "react"
import { Layers, User } from "lucide-react"
import {
  buildAvailabilityHoverCopy,
  estimateAvailabilityHoverHeight,
} from "../../lib/slot-requests-calendar/availability-hover-copy"
import type { ApprovalObjectCluster } from "../../lib/slot-requests-calendar/approval-object-cluster"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import type { WeekdayCode } from "../../lib/slot-requests-calendar/decision-engine/decision-types"
import type { MedStarScenario } from "../../lib/medstar-data/types"
import { buildScheduleHoverCopy } from "../../lib/schedules/schedule-stripe-copy"
import type { ScheduleRecord } from "../../lib/schedules/types"
import { GoldPartnerStar } from "./gold-partner-star"
import { FontAwesomeIcon, type FontAwesomeIconName } from "../font-awesome-icon"
import { ScheduleBarRhythmInfographic } from "./schedule-bar-infographics"
import {
  scheduleRhythmContextHint,
  scheduleRhythmSectionLabel,
} from "../../lib/schedules/schedule-bar-rhythm"
import {
  DETAIL_FIELD_LABEL,
  DETAIL_FIELD_META,
  DETAIL_FIELD_VALUE,
  DETAIL_PILL,
  DETAIL_SECTION_LABEL,
} from "./detail-modal-typography"
import { cn } from "../ui/utils"
import { CalendarHoverPortal } from "./calendar-hover-portal"

export type AvailabilityHoverTarget = {
  cluster: ApprovalObjectCluster
  rect: DOMRect
  anchorEl?: HTMLElement
  scenario?: MedStarScenario
  schedulesContext?: boolean
  scheduleById?: Map<string, ScheduleRecord>
  scheduleReferenceDate?: string
  overlapGroupSize?: number
  sidebarContext?: {
    rowLabel?: string
    parentLabel?: string
    groupBy?: CalendarGroupByMode
  }
}

const CARD_W = 328

const CARD_SHELL =
  "relative overflow-hidden rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22),0_6px_16px_-8px_rgba(15,23,42,0.1)]"

type HoverBadgeTone = "group" | "individual"

const HOVER_BADGE_TONE_CLASS: Record<HoverBadgeTone, string> = {
  group: "border-primary/30 bg-primary/10 text-primary",
  individual: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200",
}

function HoverStat({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-semibold tabular-nums leading-tight text-foreground",
          emphasize ? "text-xl tracking-tight" : "text-lg",
        )}
      >
        {value}
      </p>
    </div>
  )
}

const HOVER_WEEK_ORDER: WeekdayCode[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

const HOVER_WEEK_LABEL: Record<WeekdayCode, string> = {
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "T",
  fri: "F",
  sat: "S",
  sun: "S",
}

function HoverWeekScale({ weekdays }: { weekdays: WeekdayCode[] }) {
  const active = new Set(weekdays.length === 7 ? HOVER_WEEK_ORDER : weekdays)
  const ariaDays =
    weekdays.length === 7 ? "Daily" : weekdays.map((d) => HOVER_WEEK_LABEL[d]).join(", ")

  return (
    <div
      className="flex w-full overflow-hidden rounded-md border border-border bg-background shadow-sm"
      role="img"
      aria-label={`Active days: ${ariaDays}`}
    >
      {HOVER_WEEK_ORDER.map((code) => {
        const on = active.has(code)
        return (
          <span
            key={code}
            className={cn(
              "flex h-7 flex-1 items-center justify-center border-r border-border text-[11px] font-bold leading-none last:border-r-0",
              on ? "bg-chart-1 text-white" : "bg-background text-foreground",
            )}
          >
            {HOVER_WEEK_LABEL[code]}
          </span>
        )
      })}
    </div>
  )
}

function HoverBadge({
  tone,
  children,
}: {
  tone: HoverBadgeTone
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
        HOVER_BADGE_TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  )
}

type ScheduleSignalTone = "success" | "warning" | "info" | "muted"

function scheduleSignalTone(label: string): ScheduleSignalTone {
  if (label === "On track" || label === "Confirmed") return "success"
  if (label === "At risk") return "warning"
  if (label === "Not confirmed") return "info"
  return "muted"
}

const SIGNAL_ACCENT: Record<ScheduleSignalTone, string> = {
  success: "border-emerald-600 bg-emerald-50/80 dark:border-emerald-500 dark:bg-emerald-950/35",
  warning: "border-amber-600 bg-amber-50/85 dark:border-amber-500 dark:bg-amber-950/35",
  info: "border-sky-600 bg-sky-50/80 dark:border-sky-500 dark:bg-sky-950/35",
  muted: "border-border bg-muted/30",
}

const SIGNAL_TEXT: Record<ScheduleSignalTone, string> = {
  success: "text-emerald-950 dark:text-emerald-100",
  warning: "text-amber-950 dark:text-amber-100",
  info: "text-sky-950 dark:text-sky-100",
  muted: "text-foreground",
}

/** Primary attention signal — left accent rail, not a chip among chips. */
function ScheduleHoverCurrentStatus({
  icon,
  label,
  iconClass,
  tone,
  reasons = [],
}: {
  icon: FontAwesomeIconName
  label: string
  iconClass?: string
  tone: ScheduleSignalTone
  reasons?: string[]
}) {
  return (
    <div
      className={cn(
        "mt-3 rounded-r-md border-l-[3px] py-2 pl-3 pr-2",
        SIGNAL_ACCENT[tone],
      )}
      role="status"
    >
      <p className={DETAIL_SECTION_LABEL}>Current status</p>
      <p
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 text-sm font-semibold leading-snug",
          SIGNAL_TEXT[tone],
        )}
      >
        <FontAwesomeIcon name={icon} className={cn("size-3.5 shrink-0", iconClass)} aria-hidden />
        {label}
      </p>
      {reasons.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-current/10 pt-2">
          {reasons.map((reason) => (
            <li
              key={reason}
              className={cn(
                "flex items-start gap-1.5 text-xs font-medium leading-snug",
                SIGNAL_TEXT[tone],
              )}
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current opacity-70" aria-hidden />
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ScheduleHoverMetaPill({
  icon,
  label,
  variant = "neutral",
}: {
  icon?: FontAwesomeIconName
  label: string
  variant?: "neutral" | "confirmed" | "compliant" | "risk" | "type"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        DETAIL_PILL,
        variant === "neutral" && "border-border bg-muted/30 text-foreground",
        variant === "type" && "border-border bg-background text-foreground",
        variant === "confirmed" && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100",
        variant === "compliant" && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100",
        variant === "risk" && "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100",
      )}
    >
      {icon ? <FontAwesomeIcon name={icon} className="size-3 shrink-0" aria-hidden /> : null}
      {label}
    </span>
  )
}

function metaPillVariant(
  label: string,
): "neutral" | "confirmed" | "compliant" | "risk" | "type" {
  if (label === "Confirmed") return "confirmed"
  if (label === "Compliant") return "compliant"
  if (label === "Not Compliant" || label === "Not confirmed") return "risk"
  if (label === "Group" || label === "Individual") return "type"
  return "neutral"
}

function ScheduleHoverFact({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-0.5 py-2">
      <dt className={cn(DETAIL_FIELD_LABEL, "pt-0.5")}>{label}</dt>
      <dd className={cn(DETAIL_FIELD_VALUE, "min-w-0 font-medium")}>{children}</dd>
    </div>
  )
}

function ScheduleHoverBody({ copy }: { copy: ReturnType<typeof buildScheduleHoverCopy> }) {
  const hasFacts = Boolean(copy.school || copy.shiftTimings.length > 0 || copy.programLabel)
  const signalTone = copy.signalLabel ? scheduleSignalTone(copy.signalLabel) : null

  return (
    <div className={CARD_SHELL} aria-live="polite">
      <div className="px-4 pt-4 pb-3.5 border-b border-border/50">
        {copy.contextLabel ? (
          <p className={cn(DETAIL_SECTION_LABEL, "truncate")}>{copy.contextLabel}</p>
        ) : null}
        {copy.title ? (
          <p
            className={cn(
              "font-semibold leading-tight tracking-tight text-foreground truncate text-[15px]",
              copy.contextLabel ? "mt-1" : undefined,
            )}
          >
            {copy.title}
          </p>
        ) : null}
        {copy.dateRange ? (
          <p className={cn("mt-1.5 tabular-nums", DETAIL_FIELD_VALUE)}>{copy.dateRange}</p>
        ) : null}

        {copy.signalLabel && copy.signalIcon && signalTone ? (
          <ScheduleHoverCurrentStatus
            icon={copy.signalIcon}
            label={copy.signalLabel}
            iconClass={copy.signalIconClass ?? undefined}
            tone={signalTone}
            reasons={copy.atRiskReasons}
          />
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <ScheduleHoverMetaPill
            icon="circleCheck"
            label={copy.scheduleStatus}
            variant={metaPillVariant(copy.scheduleStatus)}
          />
          {copy.onboardingStatus && copy.onboardingStatus !== "Not Applicable" ? (
            <ScheduleHoverMetaPill
              icon={copy.onboardingStatus === "Compliant" ? "thumbsUp" : "triangleExclamation"}
              label={copy.onboardingStatus}
              variant={metaPillVariant(copy.onboardingStatus)}
            />
          ) : null}
          {copy.experienceType ? (
            <ScheduleHoverMetaPill
              icon={copy.experienceType === "Group" ? "users" : "user"}
              label={copy.experienceType}
              variant="type"
            />
          ) : null}
        </div>

        {copy.rhythm ? (
          <div className="mt-3.5" aria-label={copy.rhythmSummary ?? undefined}>
            <p className={DETAIL_SECTION_LABEL}>
              {copy.rhythmSectionLabel ?? scheduleRhythmSectionLabel(copy.rhythm)}
            </p>
            <p className={cn("mt-0.5", DETAIL_FIELD_META)}>
              {scheduleRhythmContextHint(copy.rhythm)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <ScheduleBarRhythmInfographic rhythm={copy.rhythm} variant="default" />
            </div>
          </div>
        ) : null}

        {hasFacts ? (
          <dl className="mt-3 divide-y divide-border/50 border-t border-border/50">
            {copy.school ? (
              <ScheduleHoverFact label="Partner school">{copy.school}</ScheduleHoverFact>
            ) : null}
            {copy.shiftTimings.length > 0 ? (
              <ScheduleHoverFact
                label={copy.shiftTimings.length > 1 ? "Shift timings" : "Shift timing"}
              >
                {copy.shiftTimings.join(" · ")}
              </ScheduleHoverFact>
            ) : null}
            {copy.programLabel ? (
              <ScheduleHoverFact label="Clinical program">{copy.programLabel}</ScheduleHoverFact>
            ) : null}
          </dl>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 bg-primary/[0.06] px-4 py-2.5">
        <span className="text-xs font-semibold text-primary">View full schedule details</span>
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold leading-none"
          aria-hidden
        >
          →
        </span>
      </div>
    </div>
  )
}

function SlotRequestHoverBody({
  copy,
}: {
  copy: ReturnType<typeof buildAvailabilityHoverCopy>
}) {
  const showSchoolList = copy.schoolCount > 1 && copy.schools.length > 0
  const isSingle = copy.requestCount === 1

  return (
    <div className={CARD_SHELL} aria-live="polite">
      <div className="grid grid-cols-2 gap-3 border-b border-border/60 bg-muted/20 px-4 py-3.5">
        <HoverStat label="Slot requests" value={String(copy.requestCount)} emphasize />
        <HoverStat label="Schools" value={String(copy.schoolCount)} emphasize />
        <div className="col-span-2 flex flex-wrap items-center gap-1.5">
          {copy.showGroupedBadge ? (
            <HoverBadge tone="group">
              <Layers className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
              {copy.groupRequestCount} grouped
            </HoverBadge>
          ) : null}
          {copy.showIndividualBadge ? (
            <HoverBadge tone="individual">
              <User className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
              {copy.individualRequestCount} individual
            </HoverBadge>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-3.5 border-b border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Location
        </p>
        <p className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {copy.locationName}
        </p>
        {copy.singleFootprint ? (
          <div className="mt-2.5 space-y-2">
            <HoverWeekScale weekdays={copy.singleFootprint.weekdays} />
            <p className="text-xs font-semibold text-foreground leading-snug">
              {copy.singleFootprint.shiftTitle}
            </p>
            {copy.singleFootprint.shiftTiming ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {copy.singleFootprint.shiftTiming}
              </p>
            ) : null}
          </div>
        ) : copy.footprintLine ? (
          <p className="mt-1 text-xs font-medium text-muted-foreground">{copy.footprintLine}</p>
        ) : null}
        {copy.dateRange ? (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">{copy.dateRange}</p>
        ) : null}
        {isSingle && copy.schools[0] ? (
          <div className="mt-2.5 flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
            {copy.schools[0].gold ? <GoldPartnerStar size="sm" className="shrink-0" /> : null}
            <span className="truncate">{copy.schools[0].name}</span>
          </div>
        ) : null}
      </div>

      {showSchoolList ? (
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Schools
          </p>
          <ul className="space-y-1">
            {copy.schools.map((school) => (
              <li
                key={school.name}
                className={cn(
                  "flex items-center justify-between gap-3 py-0.5 text-xs",
                  school.gold &&
                    "rounded-md bg-amber-50/90 px-1 py-1 text-foreground ring-1 ring-amber-200/80 dark:bg-amber-950/30 dark:ring-amber-800/40",
                )}
              >
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  {school.gold ? <GoldPartnerStar size="sm" className="shrink-0" aria-hidden /> : null}
                  <span className={cn("truncate", school.gold ? "font-semibold" : "font-medium")}>
                    {school.name}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  ({school.requestCount})
                </span>
              </li>
            ))}
            {copy.moreSchools > 0 ? (
              <li className="pt-0.5 text-xs font-medium text-primary">
                +{copy.moreSchools} more school{copy.moreSchools === 1 ? "" : "s"}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 bg-primary/[0.06] px-4 py-3">
        <span className="text-xs font-semibold text-primary">
          Click to {copy.actionLabel.toLowerCase()}
        </span>
        <span
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary text-sm font-semibold leading-none"
          aria-hidden
        >
          →
        </span>
      </div>
    </div>
  )
}

export function AvailabilityHoverPreview({
  target,
  schedulesContext = false,
  scrollRootRef,
}: {
  target: AvailabilityHoverTarget | null
  schedulesContext?: boolean
  scrollRootRef?: RefObject<HTMLElement | null>
}) {
  if (!target) return null

  const isScheduleHover = schedulesContext || target.schedulesContext

  if (isScheduleHover) {
    const copy = buildScheduleHoverCopy(target.cluster, {
      sidebarContext: target.sidebarContext,
      scheduleById: target.scheduleById,
      referenceDate: target.scheduleReferenceDate,
    })
    const estimatedCardH =
      200 +
      (copy.rhythm ? 56 : 0) +
      (copy.shiftTimings.length > 0 ? 28 : 0) +
      (copy.school || copy.programLabel ? 36 : 0) +
      copy.atRiskReasons.length * 18

    return (
      <CalendarHoverPortal
        anchorEl={target.anchorEl}
        fallbackRect={target.rect}
        scrollRootRef={scrollRootRef}
        cardW={CARD_W}
        estimatedCardH={estimatedCardH}
        className="animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none motion-reduce:transition-none"
      >
        <ScheduleHoverBody copy={copy} />
      </CalendarHoverPortal>
    )
  }

  const copy = buildAvailabilityHoverCopy(target.cluster, {
    scenario: target.scenario,
    sidebarContext: target.sidebarContext,
    overlapGroupSize: target.overlapGroupSize,
  })
  const estimatedCardH = estimateAvailabilityHoverHeight(copy)

  return (
    <CalendarHoverPortal
      anchorEl={target.anchorEl}
      fallbackRect={target.rect}
      scrollRootRef={scrollRootRef}
      cardW={CARD_W}
      estimatedCardH={estimatedCardH}
      className="animate-in fade-in-0 zoom-in-95 duration-150"
    >
      <SlotRequestHoverBody copy={copy} />
    </CalendarHoverPortal>
  )
}
