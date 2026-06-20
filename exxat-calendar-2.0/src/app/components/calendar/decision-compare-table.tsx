import { useState } from "react"
import { Button } from "../ui/button"
import { STATUS_LABEL } from "../../lib/slot-requests-calendar/constants"
import type { SlotRequestRow } from "../../lib/slot-requests-calendar/types"

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
  readOnly,
}: {
  row: SlotRequestRow
  rank: number
  onSelect: () => void
  readOnly?: boolean
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
        {readOnly ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={onSelect}>
            Decide
          </Button>
        )}
      </td>
    </tr>
  )
}

export function DecisionCompareTable({
  primaryRows,
  contextRows,
  onSelectRow,
  readOnly = false,
}: {
  primaryRows: SlotRequestRow[]
  contextRows: SlotRequestRow[]
  onSelectRow: (rowId: string, orderedIds: string[]) => void
  readOnly?: boolean
}) {
  const [showContext, setShowContext] = useState(false)
  const orderedIds = primaryRows.map((r) => r.id)

  return (
    <div className="flex-1 overflow-auto min-h-0 px-8 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Primary rows — In-Progress ({primaryRows.length})
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
          {primaryRows.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-sm text-muted-foreground text-center">
                No active requests in this scenario — review context rows below.
              </td>
            </tr>
          ) : (
            primaryRows.map((row, i) => (
              <CompareRow
                key={row.id}
                row={row}
                rank={i + 1}
                readOnly={readOnly}
                onSelect={() => onSelectRow(row.id, orderedIds)}
              />
            ))
          )}
        </tbody>
      </table>

      {contextRows.length > 0 ? (
        <div className="mt-6">
          <button
            type="button"
            className="text-sm font-medium text-[#3F51B5] hover:underline"
            onClick={() => setShowContext((v) => !v)}
          >
            {showContext ? "Hide" : "Show"} context rows — Approved / Rejected / Revoked ({contextRows.length})
          </button>
          {showContext ? (
            <table className="w-full text-left border border-border rounded-lg overflow-hidden mt-3 opacity-80">
              <tbody>
                {contextRows.map((row) => (
                  <tr key={row.id} className="border-b border-border text-sm text-muted-foreground">
                    <td className="px-4 py-2">{row.school}</td>
                    <td className="px-4 py-2">{STATUS_LABEL[row.status]}</td>
                    <td className="px-4 py-2 tabular-nums">{row.requestedSlots}</td>
                    <td className="px-4 py-2">{row.requestedDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
