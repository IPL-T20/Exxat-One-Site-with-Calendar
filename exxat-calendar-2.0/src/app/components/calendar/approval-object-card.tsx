import {
  buildCardDisplay,
  cardRect,
  dominantStatus,
  requestIdFromPlacement,
  type ApprovalObjectCluster,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import {
  clipStripeToFocusPeriod,
  type FocusPeriodRange,
} from "../../lib/slot-requests-calendar/calendar-period-focus"
import { STATUS_BAR_STYLE } from "../../lib/slot-requests-calendar/constants"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { MedStarClusterSurface } from "../../lib/medstar-real/cluster-surface"
import { POSTURE_RAIL_COLOR, type UsabilitySurfaceSnapshot } from "../../lib/mock/usability-fixture-alignment"
import { CompetitionSeverityBadge } from "./decision-intelligence"
import { GoldPartnerStarsInline } from "./gold-partner-star"

const CARD_MIN_W = 28

function statusStyle(status: ReturnType<typeof dominantStatus>, isAggregate: boolean) {
  const base = STATUS_BAR_STYLE[status]
  if (isAggregate) {
    return {
      backgroundColor: "color-mix(in oklch, var(--card) 92%, var(--muted))",
      borderColor: "var(--border)",
      color: "var(--foreground)",
      borderStyle: "solid" as const,
    }
  }
  return {
    backgroundColor: base.fill,
    borderColor: base.border,
    color: base.text,
    borderStyle: base.dashed ? ("dashed" as const) : ("solid" as const),
  }
}

export function ApprovalObjectCard({
  cluster,
  zoom,
  ppd,
  monthPxW,
  focusPeriodClip = null,
  selectedRequestId,
  surfaceOverride,
  medstarSurface,
  clusterPulse,
  onOpenSingle,
  onOpenCluster,
  onHover,
  onLeave,
}: {
  cluster: ApprovalObjectCluster
  zoom: CalendarZoom
  ppd: number
  monthPxW: number
  focusPeriodClip?: FocusPeriodRange | null
  selectedRequestId: string | null
  surfaceOverride?: UsabilitySurfaceSnapshot | null
  medstarSurface?: MedStarClusterSurface | null
  clusterPulse?: boolean
  onOpenSingle: (requestId: string) => void
  onOpenCluster: (requestIds: string[], scenarioId?: string) => void
  onHover: (cluster: ApprovalObjectCluster, el: HTMLElement) => void
  onLeave: () => void
}) {
  const isMulti = cluster.stats.requestCount > 1 || cluster.level === "aggregate"
  const placement = cluster.placements[0]
  const status = dominantStatus(cluster.placements)

  const layoutSource = isMulti
    ? { start: cluster.start, end: cluster.end }
    : { start: placement.start!, end: placement.end! }

  const rect = cardRect(
    { ...placement, start: layoutSource.start, end: layoutSource.end },
    zoom,
    ppd,
    monthPxW,
  )
  if (!rect) return null

  let left = rect.left
  let cardW = Math.max(CARD_MIN_W, rect.width)
  if (focusPeriodClip) {
    const clipped = clipStripeToFocusPeriod(left, cardW, focusPeriodClip, CARD_MIN_W)
    if (!clipped) return null
    left = clipped.left
    cardW = clipped.width
  }
  const display = surfaceOverride
    ? null
    : buildCardDisplay(cluster, zoom, cardW)
  const styles = statusStyle(status, isMulti || display?.layout === "dashboard")

  const selected = cluster.placements.some(
    (p) => requestIdFromPlacement(p) === selectedRequestId,
  )

  const handleClick = () => {
    if (isMulti) {
      onOpenCluster(
        cluster.placements.map(requestIdFromPlacement),
        medstarSurface?.scenarioId,
      )
      return
    }
    onOpenSingle(requestIdFromPlacement(placement))
  }

  const lineToneClass = (tone: "primary" | "secondary" | "meta") => {
    if (tone === "primary") return "text-[11px] font-semibold leading-tight tabular-nums"
    if (tone === "secondary") return "text-[10px] font-medium leading-tight text-muted-foreground"
    return "text-[9px] leading-tight text-muted-foreground"
  }

  const cardHeight = surfaceOverride || medstarSurface ? 52 : display!.height
  const postureColor = medstarSurface
    ? medstarSurface.postureColor
    : surfaceOverride
      ? POSTURE_RAIL_COLOR[surfaceOverride.posture]
      : undefined

  return (
    <button
      type="button"
      className={`absolute top-1/2 -translate-y-1/2 flex text-left overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-[box-shadow,transform] hover:shadow-md hover:z-[5] rounded-md ${
        clusterPulse ? "ring-2 ring-violet-400/60 shadow-lg" : ""
      } ${surfaceOverride ? "items-stretch" : display!.layout === "dashboard" ? "flex-col justify-center gap-1 px-1.5 py-0.5" : "items-center gap-1 px-1.5"}`}
      style={{
        left,
        width: cardW,
        height: cardHeight,
        minHeight: 26,
        backgroundColor: styles.backgroundColor,
        border: `1px ${styles.borderStyle} ${styles.borderColor}`,
        color: styles.color,
        boxShadow: selected
          ? "0 0 0 2px var(--ring)"
          : "0 1px 2px color-mix(in oklch, var(--foreground) 8%, transparent)",
        zIndex: selected ? 4 : isMulti ? 3 : 2,
      }}
      aria-pressed={selected}
      aria-label={medstarSurface?.ariaLabel ?? surfaceOverride?.ariaLabel ?? display!.ariaLabel}
      onClick={handleClick}
      onMouseEnter={(e) => onHover(cluster, e.currentTarget)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(cluster, e.currentTarget)}
      onBlur={onLeave}
    >
      {medstarSurface ? (
        <>
          <span
            className="w-[3px] shrink-0 rounded-l-md"
            style={{ backgroundColor: postureColor }}
            aria-hidden
          />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1 px-1.5 py-0.5 justify-center">
            <span className={lineToneClass("primary")}>{medstarSurface.cardPrimary}</span>
            <span className={`truncate pointer-events-none ${lineToneClass("secondary")}`}>
              {medstarSurface.cardSecondary}
            </span>
            <span className={`truncate pointer-events-none ${lineToneClass("meta")}`}>
              {medstarSurface.cardMeta}
            </span>
            <span className="text-[9px] font-semibold text-[#3F51B5] pointer-events-none">
              Compare requests
            </span>
          </div>
        </>
      ) : surfaceOverride ? (
        <>
          <span
            className="w-[3px] shrink-0 rounded-l-md"
            style={{ backgroundColor: postureColor }}
            aria-hidden
          />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1 px-1.5 py-0.5 justify-center">
            <div className="inline-flex items-center gap-1 min-w-0 flex-wrap">
              <span className={lineToneClass("primary")}>{surfaceOverride.busiestDayPrimary}</span>
              <CompetitionSeverityBadge
                competitionClass={surfaceOverride.competitionClass}
                size="xs"
              />
              {surfaceOverride.goldPartnerCount > 0 ? (
                <GoldPartnerStarsInline count={surfaceOverride.goldPartnerCount} size="md" />
              ) : null}
              {surfaceOverride.sequenceCount > 0 ? (
                <span className="text-[10px] font-medium text-violet-700" aria-hidden>
                  ↪{surfaceOverride.sequenceCount}
                </span>
              ) : null}
            </div>
            <span className={`truncate pointer-events-none ${lineToneClass("secondary")}`}>
              {surfaceOverride.footprintSecondary}
            </span>
            <span className={`truncate pointer-events-none ${lineToneClass("meta")}`}>
              {surfaceOverride.metaLine}
              {surfaceOverride.statusMixLine ? (
                <>
                  <span className="block">{surfaceOverride.statusMixLine}</span>
                </>
              ) : null}
            </span>
          </div>
        </>
      ) : display!.layout === "dashboard" ? (
        <div className="flex flex-col gap-0.5 min-w-0 w-full px-0.5">
          {(display!.goldStarCount > 0 || display!.lines.some((l) => l.tone !== "meta")) && (
            <div className="inline-flex items-center gap-[0.2em] min-w-0 text-[11px] font-semibold leading-tight">
              <GoldPartnerStarsInline count={display!.goldStarCount} size="md" />
              {display!.competitionClass ? (
                <CompetitionSeverityBadge competitionClass={display!.competitionClass} size="xs" />
              ) : null}
              {display!.lines
                .filter((line) => line.tone !== "meta")
                .map((line, i) => (
                  <span key={i} className={`truncate pointer-events-none ${lineToneClass(line.tone)}`}>
                    {line.text}
                  </span>
                ))}
            </div>
          )}
          {display!.lines
            .filter((line) => line.tone === "meta")
            .map((line, i) => (
              <span key={i} className={`truncate pointer-events-none ${lineToneClass(line.tone)}`}>
                {line.text}
              </span>
            ))}
        </div>
      ) : (
        <>
          {isMulti && display!.goldStarCount === 0 && (
            <span
              className="flex-shrink-0 inline-flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded text-[9px] font-bold tabular-nums bg-muted text-muted-foreground"
              aria-hidden
            >
              {cluster.stats.requestCount}
            </span>
          )}
          <span className="inline-flex items-center gap-[0.2em] min-w-0 flex-1 text-[11px] font-semibold leading-tight">
            <GoldPartnerStarsInline count={display!.goldStarCount} size="md" />
            {display!.competitionClass && cardW >= 72 ? (
              <CompetitionSeverityBadge competitionClass={display!.competitionClass} size="xs" />
            ) : null}
            <span className={`${lineToneClass("primary")} truncate pointer-events-none`}>
              {display!.lines[0]?.text}
            </span>
          </span>
        </>
      )}
    </button>
  )
}

export { CARD_MIN_W as APPROVAL_CARD_MIN_W }
