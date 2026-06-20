import type { Placement } from "./types"
import type { MedStarRequest, MedStarScenario } from "../medstar-data/types"
import { requestIdFromPlacement } from "./approval-object-cluster"
import { medStarRecordToRow } from "../medstar-real/adapter"
import { medStarRequestToRow } from "../medstar-data/request-adapter"
import type { MedStarDataStore } from "../medstar-data/MedStarDataStore"

export interface AvailabilityDetailRequest {
  id: string
  school: string
  status: string
  start: Date | null
  end: Date | null
  dateLabel: string | null
  slotsRequested: number | null
  slotsApproved: number | null
  shiftKey: string
  shiftLabel: string | null
  shiftTime: string | null
}

export interface AvailabilityShiftGroup {
  shiftKey: string
  shiftLabel: string | null
  shiftTime: string | null
  /** Underlying request rows — used for totals only. */
  requests: AvailabilityDetailRequest[]
  /** Aggregated competition entries for timeline display. */
  entries: AvailabilityCompetitionEntry[]
}

/** Coordinator-facing timeline unit — merges identical school + shift + date range. */
export interface AvailabilityCompetitionEntry {
  id: string
  school: string
  shiftKey: string
  start: Date | null
  end: Date | null
  dateLabel: string | null
  requestIds: string[]
  requestCount: number
  slotsRequested: number
  slotsApproved: number | null
}

function competitionAggregateKey(req: AvailabilityDetailRequest): string {
  const start = req.start?.getTime() ?? req.dateLabel ?? ""
  const end = req.end?.getTime() ?? ""
  return `${req.school.trim().toLowerCase()}|${req.shiftKey}|${start}|${end}`
}

export function aggregateCompetitionEntries(
  requests: AvailabilityDetailRequest[],
): AvailabilityCompetitionEntry[] {
  const map = new Map<string, AvailabilityCompetitionEntry>()

  for (const req of requests) {
    const key = competitionAggregateKey(req)
    const slots = req.slotsRequested ?? 0
    const existing = map.get(key)
    if (existing) {
      existing.requestIds.push(req.id)
      existing.requestCount += 1
      existing.slotsRequested += slots
      if (req.slotsApproved != null) {
        existing.slotsApproved = (existing.slotsApproved ?? 0) + req.slotsApproved
      }
      continue
    }
    map.set(key, {
      id: key,
      school: req.school.trim(),
      shiftKey: req.shiftKey,
      start: req.start,
      end: req.end,
      dateLabel: req.dateLabel,
      requestIds: [req.id],
      requestCount: 1,
      slotsRequested: slots,
      slotsApproved: req.slotsApproved,
    })
  }

  return [...map.values()].sort((a, b) => {
    const aStart = a.start?.getTime() ?? Number.MAX_SAFE_INTEGER
    const bStart = b.start?.getTime() ?? Number.MAX_SAFE_INTEGER
    if (aStart !== bStart) return aStart - bStart
    return a.school.localeCompare(b.school)
  })
}

const NO_SHIFT_KEY = "__no_shift__"

function parseShiftFields(
  shiftName: string | null | undefined,
  shiftDuration: string | null | undefined,
  requestedShifts?: string | null,
): { shiftKey: string; shiftLabel: string | null; shiftTime: string | null } {
  const raw = requestedShifts?.trim()
  if (raw && raw !== "—") {
    const match = raw.match(/^(.+?)\(([^)]+)\)$/)
    if (match) {
      return {
        shiftKey: raw,
        shiftLabel: match[1].trim(),
        shiftTime: match[2].trim(),
      }
    }
    return { shiftKey: raw, shiftLabel: raw, shiftTime: null }
  }
  if (shiftName?.trim()) {
    const key = shiftDuration?.trim()
      ? `${shiftName}(${shiftDuration})`
      : shiftName
    return {
      shiftKey: key,
      shiftLabel: shiftName,
      shiftTime: shiftDuration?.trim() ?? null,
    }
  }
  return { shiftKey: NO_SHIFT_KEY, shiftLabel: null, shiftTime: null }
}

function parseShiftFromPlacement(placement: Placement) {
  return parseShiftFields(null, null, placement.requestedShifts)
}

function parseShiftFromMedStarRequest(req: MedStarRequest) {
  return parseShiftFields(req.shiftName, req.shiftDuration, null)
}

function parseIsoDate(iso: string | null): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function usableDateLabel(label: string | null | undefined): string | null {
  if (!label || label === "—") return null
  return label
}

function buildFromPlacement(placement: Placement, id: string): AvailabilityDetailRequest {
  return {
    id,
    school: placement.school,
    status: placement.status,
    start: placement.start,
    end: placement.end,
    dateLabel: usableDateLabel(placement.requestedDuration),
    slotsRequested: placement.requestedSlots,
    slotsApproved: null,
    ...parseShiftFromPlacement(placement),
  }
}

function buildFromScenarioRecord(
  record: NonNullable<MedStarScenario["records"]>[number],
  scenario: MedStarScenario,
  id: string,
  store?: MedStarDataStore | null,
): AvailabilityDetailRequest {
  const row = medStarRecordToRow(record, scenario)
  const storeReq = store?.getRequestById(Number(id))
  const shift = storeReq
    ? parseShiftFromMedStarRequest(storeReq)
    : parseShiftFields(scenario.shiftName, scenario.shiftDuration, null)

  return {
    id,
    school: record.school.trim(),
    status: row.status,
    start: parseIsoDate(record.startDate),
    end: parseIsoDate(record.endDate),
    dateLabel: usableDateLabel(row.requestedDuration),
    slotsRequested: record.requestedSlots,
    slotsApproved: record.approvedSlots,
    ...shift,
  }
}

function buildFromStoreRequest(req: MedStarRequest, id: string): AvailabilityDetailRequest {
  const row = medStarRequestToRow(req)
  return {
    id,
    school: row.school,
    status: row.status,
    start: parseIsoDate(req.startDate),
    end: parseIsoDate(req.endDate),
    dateLabel: usableDateLabel(row.requestedDuration),
    slotsRequested: req.requestedSlots,
    slotsApproved: req.approvedSlots,
    ...parseShiftFromMedStarRequest(req),
  }
}

/** Only returns rows resolvable from placement, scenario record, or Layer A store. */
export function buildAvailabilityDetailRequests(options: {
  requestIds: string[]
  placements: Placement[]
  scenario?: MedStarScenario
  store?: MedStarDataStore | null
}): AvailabilityDetailRequest[] {
  const { requestIds, placements, scenario, store } = options
  const placementById = new Map(placements.map((p) => [requestIdFromPlacement(p), p]))

  const rows: AvailabilityDetailRequest[] = []
  for (const id of requestIds) {
    const placement = placementById.get(id)
    if (placement) {
      rows.push(buildFromPlacement(placement, id))
      continue
    }

    const record = scenario?.records.find((r) => String(r.id) === id)
    if (record && scenario) {
      rows.push(buildFromScenarioRecord(record, scenario, id, store))
      continue
    }

    const storeReq = store?.getRequestById(Number(id))
    if (storeReq) {
      rows.push(buildFromStoreRequest(storeReq, id))
    }
  }
  return rows
}

export function groupRequestsByShift(
  requests: AvailabilityDetailRequest[],
): AvailabilityShiftGroup[] {
  const map = new Map<string, AvailabilityShiftGroup>()
  for (const req of requests) {
    const existing = map.get(req.shiftKey)
    if (existing) {
      existing.requests.push(req)
    } else {
      map.set(req.shiftKey, {
        shiftKey: req.shiftKey,
        shiftLabel: req.shiftLabel,
        shiftTime: req.shiftTime,
        requests: [req],
        entries: [],
      })
    }
  }
  return [...map.values()]
    .map((group) => ({
      ...group,
      entries: aggregateCompetitionEntries(group.requests),
    }))
    .sort((a, b) => {
      const aLabel = a.shiftLabel ?? ""
      const bLabel = b.shiftLabel ?? ""
      return aLabel.localeCompare(bLabel)
    })
}

/** One lane per aggregated competition entry — no overlap. */
export function assignCompetitionLanes(
  entries: AvailabilityCompetitionEntry[],
): Map<string, number> {
  const lanes = new Map<string, number>()
  entries.forEach((entry, index) => lanes.set(entry.id, index))
  return lanes
}

export function competitionRowLaneCount(entryCount: number): number {
  return Math.max(1, entryCount)
}

export function detailTimelineRange(
  requests: AvailabilityDetailRequest[],
  scenario?: MedStarScenario,
): { start: Date; end: Date } | null {
  const starts: number[] = []
  const ends: number[] = []
  for (const r of requests) {
    if (r.start) starts.push(r.start.getTime())
    if (r.end) ends.push(r.end.getTime())
  }
  if (scenario?.earliestStart) starts.push(new Date(scenario.earliestStart).getTime())
  if (scenario?.latestEnd) ends.push(new Date(scenario.latestEnd).getTime())
  if (starts.length === 0 || ends.length === 0) return null
  return {
    start: new Date(Math.min(...starts)),
    end: new Date(Math.max(...ends)),
  }
}

export function positionOnTimeline(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
): { leftPct: number; widthPct: number } {
  const total = rangeEnd.getTime() - rangeStart.getTime()
  if (total <= 0) return { leftPct: 0, widthPct: 100 }
  const leftPct = ((start.getTime() - rangeStart.getTime()) / total) * 100
  const widthPct = Math.max(2, ((end.getTime() - start.getTime()) / total) * 100)
  return {
    leftPct: Math.max(0, Math.min(100, leftPct)),
    widthPct: Math.min(100 - leftPct, widthPct),
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function buildMonthMarkers(rangeStart: Date, rangeEnd: Date): { label: string; leftPct: number }[] {
  const markers: { label: string; leftPct: number }[] = []
  const total = rangeEnd.getTime() - rangeStart.getTime()
  if (total <= 0) return markers

  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cursor.getTime() <= rangeEnd.getTime()) {
    const leftPct = ((cursor.getTime() - rangeStart.getTime()) / total) * 100
    if (leftPct >= 0 && leftPct <= 100) {
      markers.push({
        label: MONTHS[cursor.getMonth()],
        leftPct,
      })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return markers
}
