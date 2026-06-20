import { useMemo, useState } from "react"
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
import { REVIEW_ORDER_SUBTITLE, sortMedStarPrimaryRows } from "../../../lib/medstar-real/review-order"
import { formatScenarioDateSpan, pressureBandLabel } from "../../../lib/medstar-real/adapter"
import type { CalendarModel } from "../useCalendarModel"
import type { SlotRequestRow } from "../../../lib/slot-requests-calendar/types"

const SHELL =
  "flex flex-col p-0 gap-0 overflow-hidden max-w-[min(78vw,76rem)] w-[min(78vw,76rem)] h-[min(80vh,920px)] max-h-[min(80vh,920px)] sm:max-w-[min(78vw,76rem)]"

function statusClass(status: SlotRequestRow["status"]): string {
  const map: Record<SlotRequestRow["status"], string> = {
    Review: "bg-blue-100 text-blue-900",
    "Request Pending": "bg-amber-100 text-amber-900",
    Approved: "bg-green-100 text-green-900",
    Declined: "bg-red-100 text-red-900",
    Canceled: "bg-gray-100 text-gray-600",
  }
  return map[status]
}

function CompareRow({
  row,
  rank,
  onSelect,
}: {
  row: SlotRequestRow
  rank: number
  onSelect: () => void
}) {
  return (
    <tr className="border-b border-border hover:bg-muted/30">
      <td className="px-4 py-2.5 text-sm">
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-800">
          Recommended {rank}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm font-medium">{row.school}</td>
      <td className="px-4 py-2.5">
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}>
          {STATUS_LABEL[row.status]}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm tabular-nums">{row.requestedSlots}</td>
      <td className="px-4 py-2.5 text-sm tabular-nums">{row.approvedInfo}</td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.requestedDuration}</td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.requestedShifts}</td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground max-w-[12rem] truncate" title={row.availabilityName}>
        {row.availabilityName}
      </td>
      <td className="px-4 py-2.5 text-sm tabular-nums">{row.pendingDuration}d</td>
      <td className="px-4 py-2.5">
        <Button type="button" size="sm" variant="outline" onClick={onSelect}>
          Decide
        </Button>
      </td>
    </tr>
  )
}

export function MedStarCompareModal({ model }: { model: CalendarModel }) {
  const medstar = useMedStarReal()
  const [showContext, setShowContext] = useState(false)
  const open = Boolean(model.approvalCluster)

  const ordered = useMemo(
    () => sortMedStarPrimaryRows(medstar.effectiveRows),
    [medstar.effectiveRows],
  )

  if (!medstar.enabled) return null

  const { scenario } = medstar

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) model.exitApprovalWorkflow()
      }}
    >
      <DialogContent className={SHELL}>
        <DialogHeader className="px-8 pt-6 pb-4 border-b border-border text-left shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            Compare requests · MedStar Health
          </p>
          <DialogTitle className="text-xl font-semibold">
            {scenario.location} · {scenario.shiftName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {formatScenarioDateSpan(scenario)} · {scenario.recordCount} requests · {scenario.schoolCount} schools ·{" "}
            {medstar.activeCount} in progress · {scenario.requestedSlotsTotal} requested / {scenario.approvedSlotsTotal} approved
          </DialogDescription>
          <p className="text-sm font-medium text-red-700 mt-2">
            Inferred from current request pattern: {pressureBandLabel(scenario.pressureBand)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{REVIEW_ORDER_SUBTITLE}</p>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0 px-8 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Primary rows — In-Progress ({ordered.length})
          </h3>
          <table className="w-full text-left border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">School</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Req slots</th>
                <th className="px-4 py-2">Appr slots</th>
                <th className="px-4 py-2">Dates</th>
                <th className="px-4 py-2">Shift</th>
                <th className="px-4 py-2">Posting context</th>
                <th className="px-4 py-2">Pending</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {ordered.map((row, i) => (
                <CompareRow
                  key={row.id}
                  row={row}
                  rank={i + 1}
                  onSelect={() =>
                    model.openApprovalDetail(row.id, ordered.map((r) => r.id), {
                      fromCluster: true,
                    })
                  }
                />
              ))}
            </tbody>
          </table>

          <div className="mt-6">
            <button
              type="button"
              className="text-sm font-medium text-[#3F51B5] hover:underline"
              onClick={() => setShowContext((v) => !v)}
            >
              {showContext ? "Hide" : "Show"} context rows — Approved / Rejected / Revoked ({medstar.contextRows.length})
            </button>
            {showContext && (
              <table className="w-full text-left border border-border rounded-lg overflow-hidden mt-3 opacity-80">
                <tbody>
                  {medstar.contextRows.map((row) => (
                    <tr key={row.id} className="border-b border-border text-sm text-muted-foreground">
                      <td className="px-4 py-2">{row.school}</td>
                      <td className="px-4 py-2">{STATUS_LABEL[row.status]}</td>
                      <td className="px-4 py-2 tabular-nums">{row.requestedSlots}</td>
                      <td className="px-4 py-2">{row.requestedDuration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="px-8 py-4 border-t border-border shrink-0 flex justify-end">
          <Button type="button" variant="outline" onClick={() => model.exitApprovalWorkflow()}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
