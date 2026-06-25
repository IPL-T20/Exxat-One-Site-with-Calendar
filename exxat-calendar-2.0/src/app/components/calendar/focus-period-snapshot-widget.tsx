import type { FocusPeriodSnapshot } from "../../lib/slot-requests-calendar/focus-period-snapshot"
import { cn } from "../ui/utils"

export function FocusPeriodSnapshotWidget({
  snapshot,
  schedulesContext = false,
  className,
}: {
  snapshot: FocusPeriodSnapshot
  schedulesContext?: boolean
  className?: string
}) {
  const entityNoun = schedulesContext ? "schedule" : "request"
  const entityNounPlural = schedulesContext ? "schedules" : "requests"

  const requestLine =
    snapshot.requestCount === 0
      ? `No ${entityNounPlural} in this period`
      : snapshot.requestCount === 1
        ? `1 ${entityNoun} in this period`
        : `${snapshot.requestCount} ${entityNounPlural} in this period`

  const schoolLine =
    snapshot.schoolCount > 1 ? `${snapshot.schoolCount} schools` : null

  return (
    <aside
      className={cn(
        "pointer-events-auto w-[min(100%,17.5rem)] rounded-lg border border-border/80 bg-popover/95 px-3 py-2.5 text-popover-foreground shadow-lg backdrop-blur-sm",
        className,
      )}
      aria-label={`Focus period snapshot for ${snapshot.periodLabel}`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Focus snapshot · {snapshot.periodLabel}
      </p>

      {snapshot.toReview > 0 ? (
        <p className="mt-1 text-[15px] font-semibold leading-snug tabular-nums text-foreground">
          {snapshot.toReviewLabel}
        </p>
      ) : (
        <p className="mt-1 text-[13px] font-medium leading-snug text-muted-foreground">
          Nothing to review
        </p>
      )}

      {snapshot.queueSummary ? (
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{snapshot.queueSummary}</p>
      ) : null}

      <p className="mt-1.5 text-[11px] leading-snug text-foreground/85">
        {requestLine}
        {schoolLine ? ` · ${schoolLine}` : null}
      </p>
    </aside>
  )
}
