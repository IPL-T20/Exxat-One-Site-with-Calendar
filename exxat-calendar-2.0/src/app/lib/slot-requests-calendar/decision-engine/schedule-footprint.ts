import {
  locationId,
  parseDiscipline,
  parseLocationParts,
  schoolShortName,
} from "../parse"
import type { SlotRequestRow } from "../types"
import { parseDurationRangeExtended } from "../parse-duration"
import type { SchedulingFootprint, ShiftBucket, WeekdayCode } from "./decision-types"

const WEEKDAY_PARSE: Record<string, WeekdayCode> = {
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat",
  sun: "sun",
}

const WEEKDAY_LABEL: Record<WeekdayCode, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
}

const ALL_WEEKDAYS: WeekdayCode[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

export function normalizeShiftBucket(shiftRaw: string): ShiftBucket {
  const s = shiftRaw.trim().toLowerCase()
  if (!s) return "unknown"
  if (s.includes("night") && s.includes("12")) return "night12"
  if (s.includes("night")) return "night12"
  if (s.includes("evening")) return "evening8"
  if (s.includes("day") && s.includes("12")) return "day12"
  if (s.includes("day") && s.includes("8")) return "day8"
  if (s.includes("custom")) return "custom"
  if (s.includes("day")) return "day12"
  return "unknown"
}

export function shiftLabel(bucket: ShiftBucket): string {
  switch (bucket) {
    case "day12":
      return "Day 12h"
    case "day8":
      return "Day 8h"
    case "night12":
      return "Night 12h"
    case "evening8":
      return "Eve 8h"
    case "custom":
      return "Custom"
    default:
      return "Shift"
  }
}

export function parseWeekdays(daysRaw: string): WeekdayCode[] {
  const trimmed = daysRaw.trim()
  if (!trimmed) return [...ALL_WEEKDAYS]
  const parts = trimmed.split("+").map((p) => p.trim().slice(0, 3).toLowerCase())
  const out: WeekdayCode[] = []
  for (const p of parts) {
    const code = WEEKDAY_PARSE[p]
    if (code && !out.includes(code)) out.push(code)
  }
  return out.length > 0 ? out : [...ALL_WEEKDAYS]
}

export function weekdaysLabel(codes: WeekdayCode[]): string {
  if (codes.length === 7) return "Daily"
  if (codes.length === 5 && !codes.includes("sat") && !codes.includes("sun")) return "M–F"
  if (
    codes.length === 3 &&
    codes.includes("mon") &&
    codes.includes("wed") &&
    codes.includes("fri")
  ) {
    return "MWF"
  }
  if (codes.length === 2 && codes.includes("tue") && codes.includes("thu")) return "TTh"
  if (codes.length === 1) return WEEKDAY_LABEL[codes[0]!]
  return codes.map((c) => WEEKDAY_LABEL[c]).join("+")
}

export function buildFootprintKey(
  locationIdVal: string,
  discipline: string,
  shiftBucket: ShiftBucket,
  weekdays: WeekdayCode[],
): string {
  const dayKey = weekdays.length === 7 ? "daily" : weekdays.join("-")
  return `${locationIdVal}::${discipline.toLowerCase()}::${shiftBucket}::${dayKey}`
}

export function buildFootprintLabel(weekdays: WeekdayCode[], shiftBucket: ShiftBucket): string {
  return `${weekdaysLabel(weekdays)} · ${shiftLabel(shiftBucket)}`
}

/** Parenthetical time range from raw shift string, e.g. `(07:00–19:00)`. */
export function extractShiftTimeWindow(shiftRaw: string): string | null {
  const match = shiftRaw.match(/\((\d{1,2}:\d{2})-(\d{1,2}:\d{2})\)/)
  if (!match) return null
  return `(${match[1]}–${match[2]})`
}

export function disciplineNodeId(locationIdVal: string, discipline: string): string {
  return `${locationIdVal}::${discipline.toLowerCase().replace(/\s+/g, "-")}`
}

/** Calendar day index: Mon=0 … Sun=6 (ISO-ish for sweep). */
export function weekdayIndex(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

export function weekdayCodeFromDate(date: Date): WeekdayCode {
  return ALL_WEEKDAYS[weekdayIndex(date)]!
}

export function footprintCoversDate(footprint: Pick<SchedulingFootprint, "weekdays">, date: Date): boolean {
  return footprint.weekdays.includes(weekdayCodeFromDate(date))
}

export function weekdaysIntersect(a: WeekdayCode[], b: WeekdayCode[]): boolean {
  if (a.length === 7 || b.length === 7) return true
  return a.some((d) => b.includes(d))
}

export function dateRangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime()
}

/** Footprint key + label from a timeline placement (same rules as row footprint). */
export function buildPlacementFootprintMeta(placement: {
  locationId: string
  discipline: string
  requestedShifts: string
  requestedDaysOfWeek: string
}): { footprintKey: string; footprintLabel: string } {
  const shiftBucket = normalizeShiftBucket(placement.requestedShifts)
  const weekdays = parseWeekdays(placement.requestedDaysOfWeek)
  return {
    footprintKey: buildFootprintKey(
      placement.locationId,
      placement.discipline,
      shiftBucket,
      weekdays,
    ),
    footprintLabel: buildFootprintLabel(weekdays, shiftBucket),
  }
}

export function buildSchedulingFootprint(row: SlotRequestRow): SchedulingFootprint | null {
  const range = parseDurationRangeExtended(row.requestedDuration)
  if (!range) return null

  const { unit, facility, locationGroup } = parseLocationParts(row.requestedLocation)
  const locId = locationId(unit)
  const discipline = parseDiscipline(row.programType)
  const shiftBucket = normalizeShiftBucket(row.requestedShifts)
  const weekdays = parseWeekdays(row.requestedDaysOfWeek)
  const footprintKey = buildFootprintKey(locId, discipline, shiftBucket, weekdays)

  return {
    requestId: row.id,
    locationId: locId,
    locationName: unit,
    locationGroup,
    facility,
    discipline,
    disciplineId: disciplineNodeId(locId, discipline),
    programType: row.programType,
    school: row.school,
    schoolShort: schoolShortName(row.school),
    dateStart: range.start,
    dateEnd: range.end,
    requestedDuration: row.requestedDuration,
    shiftRaw: row.requestedShifts,
    shiftBucket,
    shiftLabel: shiftLabel(shiftBucket),
    daysRaw: row.requestedDaysOfWeek,
    weekdays,
    footprintLabel: buildFootprintLabel(weekdays, shiftBucket),
    footprintKey,
    requestedSlots: row.requestedSlots,
    experienceType: row.experienceType,
    status: row.status,
    partnerCategory: row.partnerCategory,
    pendingDuration: row.pendingDuration,
    requestedDate: row.requestedDate,
  }
}

/** Enumerate calendar dates (UTC midnight local) active for this footprint within its span. */
export function* footprintActiveDates(footprint: SchedulingFootprint): Generator<Date> {
  const cur = new Date(footprint.dateStart)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(footprint.dateEnd)
  end.setHours(0, 0, 0, 0)
  while (cur.getTime() <= end.getTime()) {
    if (footprintCoversDate(footprint, cur)) yield new Date(cur)
    cur.setDate(cur.getDate() + 1)
  }
}
