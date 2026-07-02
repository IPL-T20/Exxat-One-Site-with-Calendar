import { useEffect, useMemo, useState } from "react"
import { FontAwesomeIcon } from "./font-awesome-icon"
import { cn } from "./ui/utils"
import type { ScheduleRecord } from "../lib/schedules/types"
import {
  computeSchedulesDaySnapshot,
  type DayActionCategory,
  type DayActionGroup,
  type DayActionItem,
} from "../lib/schedules/schedules-month-grid-lens"
import { DayLoadMeter, DayMetricChip } from "./schedules-month-grid-metrics"

type ActionBucket = "all" | DayActionCategory

type BucketTone = {
  tabActive: string
  tabIdle: string
  tabSelected: string
  rowWash: string
  rowTitle: string
  header: string
}

const BUCKET_TONE: Record<ActionBucket, BucketTone> = {
  all: {
    tabActive: "text-blue-800",
    tabIdle: "text-blue-700 hover:bg-blue-50/50 hover:text-blue-900",
    tabSelected: "bg-blue-50 shadow-[inset_0_-2px_0_0_theme(colors.blue.600)]",
    rowWash: "bg-blue-50/35 hover:bg-blue-50/65",
    rowTitle: "text-blue-950",
    header: "text-blue-900",
  },
  act_now: {
    tabActive: "text-amber-800",
    tabIdle: "text-amber-700 hover:bg-amber-50/50 hover:text-amber-900",
    tabSelected: "bg-amber-50 shadow-[inset_0_-2px_0_0_theme(colors.amber.500)]",
    rowWash: "bg-amber-50/45 hover:bg-amber-50/75",
    rowTitle: "text-amber-950",
    header: "text-amber-950",
  },
  confirm: {
    tabActive: "text-violet-800",
    tabIdle: "text-violet-700 hover:bg-violet-50/50 hover:text-violet-900",
    tabSelected: "bg-violet-50 shadow-[inset_0_-2px_0_0_theme(colors.violet.600)]",
    rowWash: "bg-violet-50/40 hover:bg-violet-50/70",
    rowTitle: "text-violet-950",
    header: "text-violet-950",
  },
  starting: {
    tabActive: "text-emerald-800",
    tabIdle: "text-emerald-700 hover:bg-emerald-50/50 hover:text-emerald-900",
    tabSelected: "bg-emerald-50 shadow-[inset_0_-2px_0_0_theme(colors.emerald.600)]",
    rowWash: "bg-emerald-50/40 hover:bg-emerald-50/70",
    rowTitle: "text-emerald-950",
    header: "text-emerald-950",
  },
  ending: {
    tabActive: "text-slate-700",
    tabIdle: "text-slate-600 hover:bg-slate-100/70 hover:text-slate-800",
    tabSelected: "bg-slate-100 shadow-[inset_0_-2px_0_0_theme(colors.slate.500)]",
    rowWash: "bg-slate-50/70 hover:bg-slate-100/80",
    rowTitle: "text-slate-900",
    header: "text-slate-900",
  },
  running: {
    tabActive: "text-teal-800",
    tabIdle: "text-teal-700 hover:bg-teal-50/50 hover:text-teal-900",
    tabSelected: "bg-teal-50 shadow-[inset_0_-2px_0_0_theme(colors.teal.600)]",
    rowWash: "bg-teal-50/40 hover:bg-teal-50/70",
    rowTitle: "text-teal-950",
    header: "text-teal-950",
  },
}

function bucketTone(id: ActionBucket): BucketTone {
  return BUCKET_TONE[id]
}

/** Short tab labels — names only in the strip; counts live below. */
const BUCKET_TAB_LABEL: Record<ActionBucket, string> = {
  all: "All",
  act_now: "Act now",
  confirm: "Confirm",
  starting: "Start",
  ending: "End",
  running: "On track",
}

function bucketTabLabel(id: ActionBucket, fallback: string): string {
  return BUCKET_TAB_LABEL[id] ?? fallback
}

function ActionRow({
  item,
  listBucket,
  onOpen,
}: {
  item: DayActionItem
  listBucket: ActionBucket
  onOpen: () => void
}) {
  const toneId = listBucket === "all" ? item.category : listBucket
  const tone = bucketTone(toneId)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
        tone.rowWash,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", tone.rowTitle)}>{item.actionLabel}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {item.subject}
          {item.context !== "—" ? ` · ${item.context}` : ""}
        </p>
      </div>
      <FontAwesomeIcon name="chevronRight" className="size-3 shrink-0 text-muted-foreground/50" />
    </button>
  )
}

function ActionQueuePanel({
  groups,
  onOpenSchedule,
  dayIso,
}: {
  groups: DayActionGroup[]
  onOpenSchedule: (id: string) => void
  dayIso: string
}) {
  const [bucket, setBucket] = useState<ActionBucket>("all")

  useEffect(() => {
    setBucket("all")
  }, [dayIso])

  const buckets = useMemo(() => {
    const rows = groups
      .filter((group) => group.count > 0)
      .map((group) => ({
        id: group.category as ActionBucket,
        label: group.category === "running" ? "On track" : group.label,
        count: group.count,
      }))
    const allCount = groups.reduce((sum, group) => sum + group.count, 0)
    return [{ id: "all" as const, label: "All", count: allCount }, ...rows]
  }, [groups])

  const activeBucket = useMemo(
    () => buckets.find((row) => row.id === bucket) ?? buckets[0],
    [bucket, buckets],
  )

  const visibleItems = useMemo(() => {
    if (bucket === "all") {
      return groups
        .flatMap((group) => group.items)
        .sort((a, b) => b.priority - a.priority)
    }
    return groups.find((group) => group.category === bucket)?.items ?? []
  }, [bucket, groups])

  if (buckets.length <= 1) return null

  const activeTone = bucketTone(activeBucket.id)

  return (
    <section
      aria-label="Action queue"
      className="rounded-lg border border-border/70 bg-card"
    >
      <div className="border-b border-border/60 px-1.5 pt-2">
        <div
          role="tablist"
          aria-label="Action buckets"
          className="grid w-full gap-0.5"
          style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
        >
          {buckets.map((row) => {
            const selected = bucket === row.id
            const tone = bucketTone(row.id)
            const label = bucketTabLabel(row.id, row.label)
            return (
              <button
                key={row.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`${label}, ${row.count} items`}
                onClick={() => setBucket(row.id)}
                className={cn(
                  "h-7 min-w-0 truncate rounded-t-md px-1 text-xs transition-colors",
                  selected
                    ? cn(tone.tabActive, tone.tabSelected, "relative z-[1] -mb-px font-semibold")
                    : cn(tone.tabIdle, "font-medium"),
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-2 py-2">
        <p
          className={cn("mb-1.5 px-1 text-sm font-semibold tabular-nums", activeTone.header)}
          aria-live="polite"
        >
          {activeBucket.count}
        </p>

        <div key={bucket} className="space-y-1">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <ActionRow
                key={`${item.scheduleId}-${item.category}`}
                item={item}
                listBucket={bucket}
                onOpen={() => onOpenSchedule(item.scheduleId)}
              />
            ))
          ) : (
            <p className="px-1 py-3 text-sm text-muted-foreground">Nothing in this bucket.</p>
          )}
        </div>
      </div>
    </section>
  )
}

/** Day insights — chips for counts, load mix for proportion, then drill-down. */
export function SchedulesMonthGridInsights({
  day,
  scheduleRows,
  referenceDate,
  onOpenSchedule,
}: {
  day: Date | null
  scheduleRows: ScheduleRecord[]
  referenceDate: string
  onOpenSchedule: (id: string) => void
}) {
  const snapshot = useMemo(
    () => (day ? computeSchedulesDaySnapshot(scheduleRows, day, referenceDate) : null),
    [day, scheduleRows, referenceDate],
  )

  const queueGroups = useMemo(() => {
    if (!snapshot) return []
    return snapshot.actionGroups.filter((group) => group.count > 0)
  }, [snapshot])

  const showHotSpots = snapshot && snapshot.topLocations.length > 0 && snapshot.atRisk > 0

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-8">
        <FontAwesomeIcon name="calendar" className="size-5 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-5 py-5">
        <h2 className="font-['Roboto'] text-xl font-semibold leading-tight text-foreground">
          {snapshot.dayLabel}
        </h2>

        <div className="mt-4 flex gap-1.5">
          <DayMetricChip metricId="total" value={snapshot.total} />
          <DayMetricChip metricId="starting" value={snapshot.starting} />
          <DayMetricChip metricId="atRisk" value={snapshot.atRisk} />
        </div>

        <div className="mt-3">
          <DayLoadMeter total={snapshot.total} atRisk={snapshot.atRisk} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {snapshot.total === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <div className="space-y-5">
            {showHotSpots ? (
              <section aria-label="At-risk locations">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Where risk sits
                </p>
                <div className="space-y-1.5">
                  {snapshot.topLocations.map(({ location, count }) => (
                    <div
                      key={location}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{location}</span>
                      <span className="shrink-0 font-bold tabular-nums text-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <ActionQueuePanel
              groups={queueGroups}
              onOpenSchedule={onOpenSchedule}
              dayIso={snapshot.iso}
            />
          </div>
        )}
      </div>
    </div>
  )
}
