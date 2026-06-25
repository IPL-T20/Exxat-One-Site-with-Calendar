import { readFileSync } from "node:fs"
import { createInflateRaw } from "node:zlib"

const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

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
        const texts = [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((x) =>
          decodeXmlEntities(x[1]),
        )
        out.push({ textContent: texts.join("") })
      }
      return out
    }
    return []
  }
}

export function decodeXmlEntities(value) {
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

/** Minimal xlsx reader (no external deps) — reads shared strings + sheet XML. */
export async function readXlsx(path) {
  const zip = await readZip(path)
  const sharedStrings = parseSharedStrings(zip["xl/sharedStrings.xml"])
  const workbook = new SimpleDoc(zip["xl/workbook.xml"])
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

export function tableToObjects(table) {
  const [headers, ...data] = table
  return data.map((row) => {
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? ""
    })
    return obj
  })
}

export function nullIfEmpty(value) {
  if (value === "" || value === undefined || value === null) return null
  return value
}
