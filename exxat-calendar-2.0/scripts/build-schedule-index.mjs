#!/usr/bin/env node
/**
 * Build runtime schedule indexes from Mapple_Health_Schedule_Dummy_Data.xlsx.
 * Output: public/mapple/schedules.json, schedules-by-{month,week,day}.json, manifest.json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createInflateRaw } from "node:zlib"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const IN_APP_XLSX = join(ROOT, "data/Mapple_Health_Schedule_Dummy_Data.xlsx")
const MONOREPO_XLSX = join(ROOT, "../data/Mapple_Health_Schedule_Dummy_Data.xlsx")
const XLSX_PATH =
  process.env.MAPPLE_SCHEDULE_XLSX ??
  (existsSync(IN_APP_XLSX)
    ? IN_APP_XLSX
    : existsSync(MONOREPO_XLSX)
      ? MONOREPO_XLSX
      : null)
const OUT = join(ROOT, "public/mapple")
const REFERENCE_DATE = process.env.SCHEDULE_REFERENCE_DATE ?? "2026-06-18"

/** Match src/app/lib/schedules/schedules-operational-horizon.ts */
const OPERATIONAL_HORIZON_DAYS = 14
const NEAR_TERM_GREEN_TARGET = 0.98
const NEAR_TERM_EXCEPTION_RATE = 1 - NEAR_TERM_GREEN_TARGET

const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

/** Minimal xlsx reader (no external deps) — reads shared strings + sheet XML. */
async function readXlsx(path) {
  const zip = await readZip(path)
  const sharedStrings = parseSharedStrings(zip["xl/sharedStrings.xml"])
  const workbook = parseXml(zip["xl/workbook.xml"])
  const rels = parseRels(zip["xl/_rels/workbook.xml.rels"])

  const sheets = []
  for (const sheetEl of workbook.querySelectorAll("sheets sheet")) {
    const name = sheetEl.getAttribute("name")
    const rid = sheetEl.getAttributeNS(REL_NS, "id")
    const target = rels[rid]
    const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\/?/, "")}`
    const xml = zip[sheetPath]
    if (!xml) throw new Error(`Missing sheet file: ${sheetPath}`)
    sheets.push({ name, rows: parseSheet(xml, sharedStrings) })
  }
  return sheets
}

function parseXml(xml) {
  return new SimpleDoc(xml)
}

class SimpleXML {
  parseFromString(xml) {
    return new SimpleDoc(xml)
  }
}

class SimpleDoc {
  constructor(xml) {
    this._xml = xml
  }
  querySelectorAll(sel) {
    if (sel === "sheets sheet") {
      const re = /<sheet\b([^>]*)\/?>/g
      const out = []
      let m
      while ((m = re.exec(this._xml))) {
        const attrs = m[1]
        const nameM = attrs.match(/\bname="([^"]*)"/)
        const idM = attrs.match(/\br:id="([^"]*)"/)
        out.push({
          getAttribute: (a) => (a === "name" ? nameM?.[1] ?? null : null),
          getAttributeNS: (_ns, a) => (a === "id" ? idM?.[1] ?? null : null),
        })
      }
      return out
    }
    if (sel === "si") {
      const re = /<si>([\s\S]*?)<\/si>/g
      const out = []
      let m
      while ((m = re.exec(this._xml))) {
        const texts = [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((x) => decodeXmlEntities(x[1]))
        out.push({ textContent: texts.join("") })
      }
      return out
    }
    return []
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] ?? null
  }
}

function decodeXmlEntities(value) {
  if (!value) return ""
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function parseSharedStrings(xml) {
  if (!xml) return []
  const doc = new SimpleDoc(xml)
  return doc.querySelectorAll("si").map((si) => si.textContent ?? "")
}

function parseRels(xml) {
  const map = {}
  const re = /<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"[^>]*\/?>/g
  let m
  while ((m = re.exec(xml))) map[m[1]] = m[2]
  return map
}

function colLetterToIndex(col) {
  let n = 0
  for (const c of col) n = n * 26 + (c.charCodeAt(0) - 64)
  return n - 1
}

function parseSheet(xml, sharedStrings) {
  const rows = {}
  const cellRe = /<c r="([A-Z]+)(\d+)"([^>]*)>(?:<v>([^<]*)<\/v>)?<\/c>/g
  let m
  while ((m = cellRe.exec(xml))) {
    const col = colLetterToIndex(m[1])
    const row = parseInt(m[2], 10)
    const attrs = m[3]
    const raw = m[4] ?? ""
    const isShared = /t="s"/.test(attrs)
    const val = isShared ? (sharedStrings[parseInt(raw, 10)] ?? "") : raw
    if (!rows[row]) rows[row] = {}
    rows[row][col] = decodeXmlEntities(String(val))
  }
  const rowNums = Object.keys(rows).map(Number).sort((a, b) => a - b)
  if (rowNums.length === 0) return []
  const maxCol = Math.max(...rowNums.map((r) => Math.max(...Object.keys(rows[r]).map(Number))))
  return rowNums.map((r) => {
    const out = []
    for (let c = 0; c <= maxCol; c++) out.push(rows[r][c] ?? "")
    return out
  })
}

async function readZip(path) {
  const buf = readFileSync(path)
  const entries = {}
  let offset = 0
  while (offset < buf.length) {
    const sig = buf.readUInt32LE(offset)
    if (sig !== 0x04034b50) break
    const compMethod = buf.readUInt16LE(offset + 8)
    const compSize = buf.readUInt32LE(offset + 18)
    const nameLen = buf.readUInt16LE(offset + 26)
    const extraLen = buf.readUInt16LE(offset + 28)
    const name = buf.toString("utf8", offset + 30, offset + 30 + nameLen)
    const dataStart = offset + 30 + nameLen + extraLen
    const compData = buf.subarray(dataStart, dataStart + compSize)
    if (compMethod === 0) {
      entries[name] = compData.toString("utf8")
    } else if (compMethod === 8) {
      entries[name] = await inflateRaw(compData)
    }
    offset = dataStart + compSize
  }
  return entries
}

function inflateRaw(data) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const inflater = createInflateRaw()
    inflater.on("data", (c) => chunks.push(c))
    inflater.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    inflater.on("error", reject)
    inflater.end(data)
  })
}

function tableToObjects(table) {
  const [headers, ...data] = table
  return data.map((row) => {
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? ""
    })
    return obj
  })
}

function nullIfEmpty(value) {
  if (value === "" || value === undefined || value === null) return null
  return value
}

function startOfDay(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function scheduleIntersectsOperationalHorizon(row, referenceDate) {
  const ref = startOfDay(referenceDate)
  const horizon = new Date(ref)
  horizon.setDate(horizon.getDate() + OPERATIONAL_HORIZON_DAYS)
  const refIso = isoDate(ref)
  const horizonIso = isoDate(horizon)
  return row.startDate <= horizonIso && row.endDate >= refIso
}

function stableHash(value) {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function isNearTermException(row) {
  return stableHash(row.id) % 10_000 < Math.round(NEAR_TERM_EXCEPTION_RATE * 10_000)
}

function nearTermExceptionProfile(row) {
  const variant = stableHash(`${row.id}:exception`) % 4
  switch (variant) {
    case 0:
      return {
        ...row,
        scheduleStatus: "Confirmed",
        onboardingStatus: "Not Compliant",
        requirements: {
          ...row.requirements,
          pending: Math.max(1, row.requirements.pending),
        },
      }
    case 1:
      return {
        ...row,
        scheduleStatus: "Not Confirmed",
        onboardingStatus: "Compliant",
      }
    case 2:
      return {
        ...row,
        scheduleStatus: "Confirmed",
        onboardingStatus: "Compliant",
        studentName:
          row.experienceType === "Individual" ? null : row.studentName,
        preceptorName: row.experienceType === "Group" ? null : row.preceptorName,
      }
    default:
      return {
        ...row,
        scheduleStatus: "To be Scheduled",
        onboardingStatus: "Compliant",
      }
  }
}

function normalizeNearTermOperationalRow(row, referenceDate) {
  if (!scheduleIntersectsOperationalHorizon(row, referenceDate)) return row
  if (isNearTermException(row)) return nearTermExceptionProfile(row)

  const onboardingStatus =
    row.onboardingStatus === "Not Applicable" ? "Not Applicable" : "Compliant"

  return {
    ...row,
    scheduleStatus: "Confirmed",
    onboardingStatus,
    requirements:
      onboardingStatus === "Not Applicable"
        ? row.requirements
        : {
            ...row.requirements,
            pending: 0,
            notApproved: 0,
            approved: Math.max(row.requirements.total, row.requirements.approved),
          },
  }
}

function applyNearTermOperationalReality(schedules, referenceDate) {
  return schedules.map((row) => normalizeNearTermOperationalRow(row, referenceDate))
}

function isNearTermOnTrack(row) {
  return (
    row.scheduleStatus === "Confirmed" &&
    (row.onboardingStatus === "Compliant" || row.onboardingStatus === "Not Applicable")
  )
}

function nearTermGreenStats(schedules, referenceDate) {
  const near = schedules.filter((r) => scheduleIntersectsOperationalHorizon(r, referenceDate))
  const onTrack = near.filter(isNearTermOnTrack)
  return {
    nearTermCount: near.length,
    onTrackCount: onTrack.length,
    onTrackPct: near.length ? onTrack.length / near.length : 1,
  }
}

function normalizeSchedule(row) {
  const preceptorName = row["Preceptor Name.1"] || row["Preceptor Name"] || ""
  const preceptorEmail = row["Preceptor Email.1"] || row["Preceptor Email"] || ""
  const reqNames = row["Requirement Name"]
    ? row["Requirement Name"].split(",").map((s) => s.trim()).filter(Boolean)
    : []

  return {
    id: row["Schedule ID"],
    studentName: nullIfEmpty(row["Student Name"]),
    studentEmail: nullIfEmpty(row["Student Email"]),
    school: row.School,
    discipline: row.Discipline,
    specialization: row.Specialization,
    experienceType: row["Experience Type"],
    location: row.Location,
    department: row.Department,
    unit: nullIfEmpty(row.Unit),
    locationGroup: nullIfEmpty(row["Location Group"]),
    startDate: row["Schedule Start Date"],
    endDate: row["Schedule End Date"],
    shift: nullIfEmpty(row.Shift),
    daysOfWeek: nullIfEmpty(row["Days of week"]),
    hours: row["Number of Hours"] ? Number(row["Number of Hours"]) : null,
    preceptorName: nullIfEmpty(preceptorName),
    preceptorEmail: nullIfEmpty(preceptorEmail),
    scheduleStatus: row["Schedule Status"],
    onboardingStatus: row["Onboarding Status"],
    requirements: {
      total: Number(row["Total No. of Requirements"] || 0),
      pending: Number(row["No. of Requirements Pending"] || 0),
      notApproved: Number(row["No. of Requirements Not Approved"] || 0),
      approved: Number(row["No. of Requirements Approved"] || 0),
      names: reqNames,
    },
    flaggedForHire: row["Flagged For Hire"] === "Yes",
    flaggedForHireCount: Number(row["Flagged For Hire Count"] || 0),
    flaggedBy: nullIfEmpty(row["Flagged By"]),
    hiringRemarks: nullIfEmpty(row["Hiring Remarks"]),
  }
}

function buildTimeBucketIndex(monthRows, bucketKey, scheduleById) {
  const byBucket = {}
  const seen = new Set()
  for (const row of monthRows) {
    const bucket = row[bucketKey]
    const sid = row["Schedule ID"]
    const key = `${bucket}|${sid}`
    if (seen.has(key)) continue
    seen.add(key)
    const schedule = scheduleById.get(sid)
    if (!byBucket[bucket]) byBucket[bucket] = []
    byBucket[bucket].push({
      [bucketKey === "Month" ? "month" : bucketKey === "Week" ? "week" : "day"]: bucket,
      scheduleId: sid,
      scheduleStatus: schedule?.scheduleStatus ?? row["Schedule Status"],
      onboardingStatus: schedule?.onboardingStatus ?? row["Onboarding Status"],
      startDate: schedule?.startDate ?? row["Schedule Start Date"],
    })
  }
  return byBucket
}

function main() {
  if (!XLSX_PATH || !existsSync(XLSX_PATH)) {
    console.error("Schedule workbook not found.")
    console.error("Place Mapple_Health_Schedule_Dummy_Data.xlsx in data/ at repo root or exxat-calendar-2.0/data/, or set MAPple_SCHEDULE_XLSX.")
    process.exit(1)
  }

  readXlsx(XLSX_PATH).then((sheets) => {
    const byName = Object.fromEntries(sheets.map((s) => [s.name, s.rows]))
    const schedulesTable = byName.Schedules
    if (!schedulesTable?.length) throw new Error("Schedules sheet missing or empty")

    const schedules = applyNearTermOperationalReality(
      tableToObjects(schedulesTable).map(normalizeSchedule),
      REFERENCE_DATE,
    )
    const scheduleById = new Map(schedules.map((s) => [s.id, s]))
    const nearTerm = nearTermGreenStats(schedules, REFERENCE_DATE)
    const disciplines = [...new Set(schedules.map((s) => s.discipline))].sort()

    const monthRows = tableToObjects(byName.Month ?? [])
    const weekRows = tableToObjects(byName.Week ?? [])
    const dayRows = tableToObjects(byName.Day ?? [])

    const monthIndex = buildTimeBucketIndex(monthRows, "Month", scheduleById)
    const weekIndex = buildTimeBucketIndex(weekRows, "Week", scheduleById)
    const dayIndex = buildTimeBucketIndex(dayRows, "Day", scheduleById)

    const manifest = {
      version: 1,
      source: "Mapple_Health_Schedule_Dummy_Data.xlsx",
      sourcePath: XLSX_PATH.replace(ROOT + "/", ""),
      generatedAt: new Date().toISOString(),
      scheduleCount: schedules.length,
      disciplines,
      referenceDate: REFERENCE_DATE,
      operationalHorizonDays: OPERATIONAL_HORIZON_DAYS,
      nearTermOnTrackPct: Math.round(nearTerm.onTrackPct * 1000) / 10,
      nearTermScheduleCount: nearTerm.nearTermCount,
      sheets: {
        Schedules: schedules.length,
        Month: monthRows.length,
        Week: weekRows.length,
        Day: dayRows.length,
      },
    }

    mkdirSync(OUT, { recursive: true })
    writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2))
    writeFileSync(join(OUT, "schedules.json"), JSON.stringify(schedules))
    writeFileSync(join(OUT, "schedules-by-month.json"), JSON.stringify(monthIndex))
    writeFileSync(join(OUT, "schedules-by-week.json"), JSON.stringify(weekIndex))
    writeFileSync(join(OUT, "schedules-by-day.json"), JSON.stringify(dayIndex))

    console.log(`Source: ${XLSX_PATH}`)
    console.log(`Wrote ${schedules.length} schedules → ${OUT}`)
    console.log(`Disciplines: ${disciplines.length}`)
    console.log(
      `Near-term on-track (today+${OPERATIONAL_HORIZON_DAYS}d): ${nearTerm.onTrackCount}/${nearTerm.nearTermCount} (${(nearTerm.onTrackPct * 100).toFixed(1)}%)`,
    )
    console.log(`Rollups: month=${monthRows.length} week=${weekRows.length} day=${dayRows.length}`)
  }).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

main()
