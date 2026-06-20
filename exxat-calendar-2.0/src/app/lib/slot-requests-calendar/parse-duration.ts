const MONTH_MAP: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0)
}

/**
 * Extended duration parser for enterprise fixtures:
 * - Sep 15–Nov 30, 2026 (standard)
 * - Nov 10, 2026–Nov 10, 2026 (single day)
 * - Jul 2026–Jun 2027 (month span)
 */
export function parseDurationRangeExtended(
  value: string,
): { start: Date; end: Date } | null {
  const normalized = value.replace(/[–—]/g, "-").trim()

  const monthSpan = normalized.match(/^([A-Za-z]+)\s+(\d{4})-([A-Za-z]+)\s+(\d{4})$/)
  if (monthSpan) {
    const sm = MONTH_MAP[monthSpan[1]!]
    const em = MONTH_MAP[monthSpan[3]!]
    if (sm === undefined || em === undefined) return null
    const sy = parseInt(monthSpan[2]!, 10)
    const ey = parseInt(monthSpan[4]!, 10)
    return {
      start: new Date(sy, sm, 1),
      end: endOfMonth(ey, em),
    }
  }

  const singleDay = normalized.match(
    /^([A-Za-z]+)\s+(\d+),\s*(\d{4})-([A-Za-z]+)\s+(\d+),\s*(\d{4})$/,
  )
  if (singleDay) {
    const m1 = MONTH_MAP[singleDay[1]!]
    const m2 = MONTH_MAP[singleDay[4]!]
    if (m1 === undefined || m2 === undefined) return null
    const y1 = parseInt(singleDay[3]!, 10)
    const y2 = parseInt(singleDay[6]!, 10)
    const d1 = parseInt(singleDay[2]!, 10)
    const d2 = parseInt(singleDay[5]!, 10)
    return {
      start: new Date(y1, m1, d1),
      end: new Date(y2, m2, d2),
    }
  }

  const standard = normalized.match(
    /^([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+),\s*(\d{4})$/,
  )
  if (standard) {
    const year = parseInt(standard[5]!, 10)
    const startMonth = MONTH_MAP[standard[1]!]
    const endMonth = MONTH_MAP[standard[3]!]
    if (startMonth === undefined || endMonth === undefined) return null
    const startYear = startMonth > endMonth ? year - 1 : year
    return {
      start: new Date(startYear, startMonth, parseInt(standard[2]!, 10)),
      end: new Date(year, endMonth, parseInt(standard[4]!, 10)),
    }
  }

  return null
}
