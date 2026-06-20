import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { STATUS_LABEL } from "../../../lib/slot-requests-calendar/constants"
import { useMedStarReal } from "../../../lib/medstar-real/medstar-real-context"
import { recommendedReviewRank, sortMedStarPrimaryRows } from "../../../lib/medstar-real/review-order"
import type { CalendarModel } from "../useCalendarModel"

const SHELL =
  "flex flex-col p-0 gap-0 overflow-hidden max-w-[min(78vw,76rem)] w-[min(78vw,76rem)] h-[min(80vh,920px)] max-h-[min(80vh,920px)] sm:max-w-[min(78vw,76rem)]"

export function MedStarDecideModal({ model }: { model: CalendarModel }) {
  const medstar = useMedStarReal()
  const [picker, setPicker] = useState<"hold" | "decline" | null>(null)

  const requestId = model.approvalDetailRequestId
  const row = requestId
    ? medstar.effectiveRows.find((r) => r.id === requestId)
    : undefined

  if (!medstar.enabled || !row) return null

  const rec = medstar.getRecommendedAction(row)
  const ordered = sortMedStarPrimaryRows(medstar.effectiveRows)
  const rank = recommendedReviewRank(row.id, ordered)

  const closeAll = () => model.exitApprovalWorkflow()

  const handleApprove = () => {
    medstar.applyApprove(row.id, row.school)
    model.backFromApprovalDetail()
  }

  const handleHold = () => {
    medstar.applyHold(row.id, row.school)
    model.backFromApprovalDetail()
  }

  const handleDecline = () => {
    medstar.applyDecline(row.id, row.school)
    model.backFromApprovalDetail()
  }

  return (
    <Dialog open={Boolean(requestId)} onOpenChange={(v) => !v && closeAll()}>
      <DialogContent className={SHELL}>
        <div className="px-8 py-4 border-b border-border bg-violet-50 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
            Recommended action · recommendation-supported (not rule-enforced)
          </p>
          <p className="text-lg font-semibold text-foreground mt-1">
            {rec.action}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{rec.why}</p>
        </div>

        <DialogHeader className="px-8 pt-4 pb-4 border-b border-border text-left shrink-0">
          {model.approvalDetailFromCluster && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => model.backFromApprovalDetail()}
            >
              ← Back to Compare
            </Button>
          )}
          <DialogTitle className="text-xl">{row.school}</DialogTitle>
          <DialogDescription>
            {medstar.scenario.location} · {STATUS_LABEL[row.status]} · {row.pendingDuration} days pending
            {rank ? ` · Recommended order ${rank} of ${medstar.activeCount}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-8 py-5 space-y-5">
          <section>
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

          <section className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900 mb-2">
              Potential impact
            </h3>
            <p className="text-sm text-amber-950">{rec.potentialImpact}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Other requests affected
            </h3>
            <p className="text-sm">{rec.otherAffected}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              What remains unresolved
            </h3>
            <p className="text-sm">{rec.remains}</p>
          </section>
        </div>

        <div className="px-8 py-4 border-t border-border shrink-0 flex flex-wrap gap-2">
          <Button type="button" onClick={handleApprove}>
            Approve
          </Button>
          <Button type="button" variant="outline" onClick={() => setPicker("hold")}>
            Hold
          </Button>
          <Button type="button" variant="outline" onClick={() => setPicker("decline")}>
            Decline
          </Button>
        </div>

        {picker === "hold" && (
          <div className="px-8 pb-4">
            <p className="text-sm text-muted-foreground mb-2">Confirm hold?</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleHold}>Confirm Hold</Button>
              <Button size="sm" variant="ghost" onClick={() => setPicker(null)}>Cancel</Button>
            </div>
          </div>
        )}
        {picker === "decline" && (
          <div className="px-8 pb-4">
            <p className="text-sm text-muted-foreground mb-2">Confirm decline?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleDecline}>Confirm Decline</Button>
              <Button size="sm" variant="ghost" onClick={() => setPicker(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
