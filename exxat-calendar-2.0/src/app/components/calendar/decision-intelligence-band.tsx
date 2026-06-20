import type { SlotRequestRow } from "../../lib/slot-requests-calendar/types"

export interface RecommendedAction {
  action: "Approve" | "Hold" | "Decline"
  why: string
  potentialImpact: string
  otherAffected: string
  remains: string
}

export function DecisionIntelligenceBand({ recommendation }: { recommendation: RecommendedAction }) {
  return (
    <div className="px-8 py-4 border-b border-border bg-violet-50 shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
        Recommended action · recommendation-supported (not rule-enforced)
      </p>
      <p className="text-lg font-semibold text-foreground mt-1">{recommendation.action}</p>
      <p className="text-sm text-muted-foreground mt-1">{recommendation.why}</p>
    </div>
  )
}

export function DecisionIntelligenceSections({
  row,
  recommendation,
}: {
  row: SlotRequestRow
  recommendation: RecommendedAction
}) {
  return (
    <>
      <section className="px-8 py-5 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Hard facts (export)
        </h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Requested slots</dt>
            <dd className="font-medium tabular-nums">{row.requestedSlots}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Approved slots</dt>
            <dd className="font-medium tabular-nums">{row.approvedInfo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Date range</dt>
            <dd>{row.requestedDuration}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Shift</dt>
            <dd>{row.requestedShifts}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground text-xs">Posting context</dt>
            <dd>{row.availabilityName}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground text-xs">Request ID</dt>
            <dd className="font-mono tabular-nums">{row.id}</dd>
          </div>
        </dl>
      </section>

      <section className="mx-8 my-5 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900 mb-2">
          Potential impact
        </h3>
        <p className="text-sm text-amber-950">{recommendation.potentialImpact}</p>
      </section>

      <section className="px-8 py-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Other requests affected
        </h3>
        <p className="text-sm">{recommendation.otherAffected}</p>
      </section>

      <section className="px-8 py-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          What remains unresolved
        </h3>
        <p className="text-sm">{recommendation.remains}</p>
      </section>
    </>
  )
}
