/**
 * Dev-only audit: every placement timeline position must derive from
 * `requestedDuration` → `parseDurationRange` → `placement.start` / `placement.end`.
 * Never submissionDate, approvalDate, or cluster union bounds for singles.
 */
import { parseDurationRange } from "./parse"
import type { Placement, SlotRequestRow } from "./types"
import { cardRect } from "./approval-object-cluster"
import type { CalendarZoom } from "./types"

export interface PositionAuditEntry {
  requestId: string
  requestedDuration: string
  start: string
  end: string
  renderedLeft: number
  renderedWidth: number
  ok: boolean
  issue?: string
}

export function auditPlacementPositions(
  rows: SlotRequestRow[],
  rowToPlacement: (row: SlotRequestRow) => Placement,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): PositionAuditEntry[] {
  return rows.map((row) => {
    const p = rowToPlacement(row)
    const parsed = parseDurationRange(row.requestedDuration)
    const rect = cardRect(p, zoom, ppd, monthPxW)

    let ok = true
    let issue: string | undefined

    if (!parsed) {
      ok = false
      issue = "requestedDuration failed to parse"
    } else if (!p.start || !p.end) {
      ok = false
      issue = "placement missing start/end"
    } else if (
      p.start.getTime() !== parsed.start.getTime() ||
      p.end.getTime() !== parsed.end.getTime()
    ) {
      ok = false
      issue = "placement dates do not match requestedDuration parse"
    } else if (!rect) {
      ok = false
      issue = "cardRect returned null"
    }

    return {
      requestId: row.id,
      requestedDuration: row.requestedDuration,
      start: p.start?.toISOString().slice(0, 10) ?? "—",
      end: p.end?.toISOString().slice(0, 10) ?? "—",
      renderedLeft: rect?.left ?? -1,
      renderedWidth: rect?.width ?? -1,
      ok,
      issue,
    }
  })
}

export function logPositionAudit(entries: PositionAuditEntry[]): void {
  const bad = entries.filter((e) => !e.ok)
  if (bad.length === 0) {
    console.info(`[approval-position-audit] ${entries.length} requests — all OK`)
    return
  }
  console.warn(`[approval-position-audit] ${bad.length} issues`, bad)
}
