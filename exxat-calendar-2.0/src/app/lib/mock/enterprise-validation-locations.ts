/**
 * Enterprise validation location registry — 95 MedStar units with realistic
 * multidisciplinary discipline breadth for hierarchy stress tests.
 *
 * Target distribution (95 locations):
 *   12 × 1 discipline (simple clinics)
 *    8 × 2 disciplines (paired specialty)
 *   25 × 3–5 disciplines (med-surg / ambulatory)
 *   28 × 6–10 disciplines (ICU / ED / rehab)
 *   15 × 11–15 disciplines (institute hubs)
 *    7 × 16–20 disciplines (academic mega-hubs)
 */
import { locationId } from "../slot-requests-calendar/parse"
import {
  AMBULATORY_BUNDLE,
  BEHAVIORAL_BUNDLE,
  bundleOf,
  CLINIC_SINGLE,
  EMERGENCY_BUNDLE,
  ICU_BUNDLE,
  IMAGING_BUNDLE,
  MED_SURG_BUNDLE,
  MEGA_HUB_BUNDLE,
  ONCOLOGY_HUB_BUNDLE,
  PERIOP_BUNDLE,
  REHAB_BUNDLE,
  WOMENS_CHILDREN_BUNDLE,
} from "./validation-discipline-bundles"

export const VALIDATION_FACILITIES = {
  union: "MedStar Union Memorial Hospital",
  mwhc: "MedStar Washington Hospital Center",
  franklin: "MedStar Franklin Square Medical Center",
  smmc: "MedStar Southern Maryland Hospital Center",
  rehab: "MedStar National Rehabilitation Hospital",
  goodsam: "MedStar Good Samaritan Hospital",
  georgetown: "MedStar Georgetown University Hospital",
  montgomery: "MedStar Montgomery Medical Center",
} as const

export type ValidationFacilityKey = keyof typeof VALIDATION_FACILITIES

export type CapacityTier =
  | "empty"
  | "under"
  | "balanced"
  | "near"
  | "over"
  | "uneven"
  | "future-risk"

export type DensityTier = "sparse" | "light" | "moderate" | "heavy" | "extreme"

/** Per-discipline demand tier — drives matrix coverage generator. */
export type DisciplineLoadTier = "empty" | "light" | "moderate" | "saturated" | "hotspot"

/** Canonical discipline keys — must match parseDiscipline() output from programType. */
export const VALIDATION_DISCIPLINE_KEYS = [
  "Nursing",
  "Medical Surgical",
  "ICU",
  "PT",
  "OT",
  "SLP",
  "Respiratory Therapy",
  "Radiologic Technology",
  "Sonography",
  "Pharmacy",
  "Social Work",
  "Psychology",
  "Counseling",
  "Dietetics",
  "Behavioral Health",
  "Pediatrics",
  "Imaging",
  "Surgical Technology",
  "Medical Assistant",
  "Allied Health",
] as const

export type ValidationDisciplineKey = (typeof VALIDATION_DISCIPLINE_KEYS)[number]

/** programType strings — parseDiscipline() reads parenthetical suffix. */
export const DISCIPLINE_PROGRAM: Record<ValidationDisciplineKey, string> = {
  Nursing: "Pre-Licensure (Nursing)",
  "Medical Surgical": "Pre-Licensure (Medical Surgical)",
  ICU: "Pre-Licensure (ICU)",
  PT: "Doctor of Physical Therapy (PT)",
  OT: "Master of Occupational Therapy (OT)",
  SLP: "Master of Science (SLP)",
  "Respiratory Therapy": "Bachelor of Science (Respiratory Therapy)",
  "Radiologic Technology": "Bachelor of Science (Radiologic Technology)",
  Sonography: "Bachelor of Science (Sonography)",
  Pharmacy: "Doctor of Pharmacy (Pharmacy)",
  "Social Work": "Master of Social Work (Social Work)",
  Psychology: "Doctor of Psychology (Psychology)",
  Counseling: "Master of Arts (Counseling)",
  Dietetics: "Master of Science (Dietetics)",
  "Behavioral Health": "Pre-Licensure (Behavioral Health)",
  Pediatrics: "Pre-Licensure (Pediatrics)",
  Imaging: "Bachelor of Science (Radiologic Technology)",
  "Surgical Technology": "Associate of Applied Science (Surgical Technology)",
  "Medical Assistant": "Certificate (Medical Assistant)",
  "Allied Health": "Associate of Applied Science (Allied Health)",
}

export interface ValidationLocationDef {
  slug: string
  unit: string
  facility: ValidationFacilityKey
  group: string
  disciplines: ValidationDisciplineKey[]
  densityTier: DensityTier
  capacityTier: CapacityTier
  dominantDiscipline?: ValidationDisciplineKey
  /** Optional explicit per-discipline load; unset → resolveDisciplineLoad(). */
  disciplineLoad?: Partial<Record<ValidationDisciplineKey, DisciplineLoadTier>>
}

const GROUPS = [
  "Medical Surgical",
  "Intensive Care",
  "Intermediate Care",
  "Women's Health",
  "Behavioral Health",
  "Emergency Medicine",
  "MHVI - Cardiac",
  "Ambulatory",
  "Imaging & Radiology",
  "Allied Health Services",
  "Perioperative Services",
  "Pediatrics",
  "Oncology Services",
  "Neuroscience",
  "Academic Medicine",
] as const

function unitName(floor: string, label: string): string {
  return `${floor} - ${label}`
}

function asDisciplines(keys: string[]): ValidationDisciplineKey[] {
  return keys as ValidationDisciplineKey[]
}

function pickFac(i: number): ValidationFacilityKey {
  const facKeys = Object.keys(VALIDATION_FACILITIES) as ValidationFacilityKey[]
  return facKeys[i % facKeys.length]
}

function pickGroup(i: number): string {
  return GROUPS[i % GROUPS.length]
}

/** Deterministic hash for default discipline load tiers. */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Default load profile — ~18% empty, rest spread light → saturated. */
export function resolveDisciplineLoad(
  def: ValidationLocationDef,
  disc: ValidationDisciplineKey,
): DisciplineLoadTier {
  if (def.disciplineLoad?.[disc]) return def.disciplineLoad[disc]!
  if (def.disciplines.length === 1) return "moderate"
  if (disc === def.dominantDiscipline) return "saturated"
  if (disc === "Nursing" && def.disciplines.includes("Nursing")) {
    return def.densityTier === "extreme" ? "saturated" : "moderate"
  }
  const bucket = hashStr(`${def.slug}::${disc}`) % 100
  if (bucket < 18) return "empty"
  if (bucket < 43) return "light"
  if (bucket < 73) return "moderate"
  return "saturated"
}

export function requestCountForLoadTier(tier: DisciplineLoadTier): number {
  switch (tier) {
    case "empty":
      return 0
    case "light":
      return 1
    case "moderate":
      return 2
    case "saturated":
      return 4
    case "hotspot":
      return 8
  }
}

function buildRegistry(): ValidationLocationDef[] {
  const out: ValidationLocationDef[] = []
  let seed = 0

  // ── Tier A: 12 × 1 discipline ───────────────────────────────────────────
  for (const [unit, disc] of Object.entries(CLINIC_SINGLE)) {
    if (out.length >= 12) break
    out.push({
      slug: locationId(unit),
      unit,
      facility: pickFac(seed),
      group: pickGroup(seed),
      disciplines: [disc as ValidationDisciplineKey],
      densityTier: seed < 4 ? "sparse" : "light",
      capacityTier: seed < 2 ? "empty" : seed < 6 ? "under" : "balanced",
    })
    seed += 1
  }

  // ── Tier B: 8 × 2 disciplines (paired units) ──────────────────────────────
  const pairedUnits: Array<[string, ValidationDisciplineKey, ValidationDisciplineKey]> = [
    ["Cardiac Rehab Pair", "Nursing", "Respiratory Therapy"],
    ["Lactation & NICU Follow-up", "Nursing", "Pediatrics"],
    ["PT/OT Combined Suite", "PT", "OT"],
    ["SLP/Audiology Pair", "SLP", "Allied Health"],
    ["Pharmacy & Med Assist", "Pharmacy", "Medical Assistant"],
    ["Radiology Pair", "Radiologic Technology", "Sonography"],
    ["Counseling Pair", "Psychology", "Counseling"],
    ["BH Step-Down Pair", "Behavioral Health", "Social Work"],
  ]

  for (const [label, d1, d2] of pairedUnits) {
    const floor = `${2 + (seed % 4)}${String.fromCharCode(65 + (seed % 3))}`
    out.push({
      slug: locationId(unitName(floor, label)),
      unit: unitName(floor, label),
      facility: pickFac(seed),
      group: pickGroup(seed),
      disciplines: [d1, d2],
      densityTier: "light",
      capacityTier: "balanced",
    })
    seed += 1
  }

  // ── Tier C: 25 × 3–5 disciplines (med-surg / ambulatory) ─────────────────
  const mediumLabels = [
    "Med Surg/Tele",
    "Medical Oncology",
    "Orthopedics",
    "Telemetry",
    "Vascular/Thoracic",
    "Cardiac IMC",
    "Med Surg Neuro/Stroke",
    "High Risk/Postpartum",
    "Burn/Trauma IMC",
    "Psych Medical",
    "Stroke Medical",
    "Pulmonary",
    "GI/Liver",
    "Renal/Dialysis",
    "ENT/Head-Neck",
    "Urology",
    "Gynecology Oncology",
    "Same-Day Surgery",
    "Pre-Op Holding",
    "PACU",
    "Endoscopy",
    "Interventional Radiology",
    "Cardiac Cath Lab",
    "EP Lab",
    "Primary Care",
  ]

  for (let i = 0; i < 25; i++) {
    const discCount = 3 + (i % 3)
    const floor = `${2 + (i % 7)}${String.fromCharCode(65 + (i % 4))}`
    const unit = unitName(floor, mediumLabels[i])
    const bundle =
      i % 4 === 0
        ? AMBULATORY_BUNDLE
        : i % 4 === 1
          ? MED_SURG_BUNDLE
          : i % 4 === 2
            ? IMAGING_BUNDLE
            : PERIOP_BUNDLE
    out.push({
      slug: locationId(unit),
      unit,
      facility: pickFac(seed),
      group: pickGroup(seed),
      disciplines: asDisciplines(bundleOf(bundle, discCount)),
      densityTier: i % 5 === 0 ? "sparse" : "moderate",
      capacityTier: (["under", "balanced", "near", "balanced", "under"] as CapacityTier[])[i % 5],
    })
    seed += 1
  }

  // ── Tier D: 28 × 6–10 disciplines (ICU / ED / rehab / L&D) ───────────────
  const largeLabels = [
    "Medical ICU",
    "Surgical ICU",
    "Burn/Trauma ICU",
    "Cardiac ICU",
    "Neuro ICU",
    "IMCU",
    "Med Surg/Intermediate Care",
    "Acute Stroke & Dialysis",
    "Cardiac & Long Term Vents",
    "Medical Cardiology",
    "Neurosurgery/Stroke/ENT",
    "Trauma Bay",
    "Emergency Department",
    "Labor & Delivery",
    "NICU",
    "Mother-Baby",
    "Pediatric Unit",
    "Adolescent BH",
    "Inpatient Psychiatry",
    "Detox Unit",
    "Rehab Med/Surg",
    "Rehab Neuro",
    "Rehab Ortho",
    "Sports Medicine",
    "Heart & Vascular",
    "Transplant Stepdown",
    "Oncology Inpatient",
    "Bone Marrow Transplant",
  ]

  for (let i = 0; i < 28; i++) {
    const discCount = 6 + (i % 5)
    const floor = `${3 + (i % 6)}${String.fromCharCode(69 + (i % 3))}`
    const unit = unitName(floor, largeLabels[i])
    const bundle =
      i % 5 === 0
        ? ICU_BUNDLE
        : i % 5 === 1
          ? EMERGENCY_BUNDLE
          : i % 5 === 2
            ? WOMENS_CHILDREN_BUNDLE
            : i % 5 === 3
              ? REHAB_BUNDLE
              : BEHAVIORAL_BUNDLE
    const capTier: CapacityTier =
      i % 7 === 0 ? "over" : i % 5 === 0 ? "near" : i % 3 === 0 ? "uneven" : "balanced"
    out.push({
      slug: locationId(unit),
      unit,
      facility: pickFac(seed),
      group: pickGroup(seed),
      disciplines: asDisciplines(bundleOf(bundle, discCount)),
      densityTier: i % 4 === 0 ? "heavy" : "moderate",
      capacityTier: capTier,
      dominantDiscipline: capTier === "uneven" ? "Nursing" : undefined,
    })
    seed += 1
  }

  // ── Tier E: 15 × 11–15 disciplines (institute hubs) ───────────────────────
  const instituteLabels = [
    "Regional Trauma Center",
    "Comprehensive Cancer Center",
    "Women's & Children's Pavilion",
    "Heart Institute Inpatient",
    "Neuroscience Institute",
    "Behavioral Health Pavilion",
    "Ambulatory Surgery Center",
    "Outpatient Specialty Hub",
    "Integrated Care Pavilion",
    "Teaching Hospital Core",
    "Critical Care Tower",
    "Perioperative Complex",
    "Diagnostic & Treatment Center",
    "Population Health Hub",
    "Multidisciplinary Clinic",
  ]

  for (let i = 0; i < 15; i++) {
    const discCount = 11 + (i % 5)
    const unit = instituteLabels[i]
    const bundle =
      i % 3 === 0
        ? ONCOLOGY_HUB_BUNDLE
        : i % 3 === 1
          ? BEHAVIORAL_BUNDLE
          : MEGA_HUB_BUNDLE
    out.push({
      slug: locationId(unit),
      unit,
      facility: pickFac(seed),
      group: pickGroup(seed),
      disciplines: asDisciplines(bundleOf(bundle, discCount)),
      densityTier: "heavy",
      capacityTier: (["near", "future-risk", "over", "near"] as CapacityTier[])[i % 4],
      dominantDiscipline: i % 3 === 0 ? "Nursing" : undefined,
    })
    seed += 1
  }

  // ── Tier F: 7 × 16–20 disciplines (academic mega-hubs) + named hot rows ───
  const megaUnits: Array<{ unit: string; count: number; density: DensityTier; cap: CapacityTier }> =
    [
      { unit: "7E - IMCU", count: 18, density: "extreme", cap: "over" },
      { unit: "9E - Med Surg/Tele", count: 17, density: "extreme", cap: "over" },
      { unit: "2G - Medical ICU", count: 16, density: "extreme", cap: "over" },
      { unit: "4H - Burn/Trauma ICU", count: 16, density: "heavy", cap: "near" },
      { unit: "Behavioral Health", count: 15, density: "heavy", cap: "near" },
      { unit: "Academic Medical Center Hub", count: 20, density: "heavy", cap: "future-risk" },
      { unit: "Clinical Research Unit", count: 16, density: "moderate", cap: "balanced" },
    ]

  for (const mega of megaUnits) {
    out.push({
      slug: locationId(mega.unit),
      unit: mega.unit,
      facility: pickFac(seed),
      group: pickGroup(seed),
      disciplines: asDisciplines(bundleOf(MEGA_HUB_BUNDLE, mega.count)),
      densityTier: mega.density,
      capacityTier: mega.cap,
      dominantDiscipline: "Nursing",
      disciplineLoad: {
        Nursing: "hotspot",
        ICU: mega.unit.includes("ICU") || mega.unit.includes("IMCU") ? "saturated" : "moderate",
        PT: "light",
        OT: "light",
        Psychology: mega.unit.includes("Behavioral") ? "saturated" : "empty",
        Counseling: mega.unit.includes("Behavioral") ? "saturated" : "empty",
        "Behavioral Health": mega.unit.includes("Behavioral") ? "hotspot" : "light",
      },
    })
    seed += 1
  }

  if (out.length !== 95) {
    throw new Error(`Expected 95 validation locations, got ${out.length}`)
  }

  return out
}

export const VALIDATION_LOCATIONS: ValidationLocationDef[] = buildRegistry()

export const VALIDATION_LOCATION_BY_SLUG = new Map(
  VALIDATION_LOCATIONS.map((l) => [l.slug, l]),
)

export function validationLocString(def: ValidationLocationDef): string {
  const facility = VALIDATION_FACILITIES[def.facility]
  return `${def.unit} (${facility} > ${def.group})`
}

export function programForDiscipline(disc: ValidationDisciplineKey): string {
  return DISCIPLINE_PROGRAM[disc]
}

function disciplineCountBucket(n: number): string {
  if (n === 1) return "1"
  if (n === 2) return "2"
  if (n >= 3 && n <= 5) return "3-5"
  if (n >= 6 && n <= 10) return "6-10"
  if (n >= 11 && n <= 15) return "11-15"
  return "16+"
}

function distribution(counts: number[]) {
  const dist: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3-5": 0,
    "6-10": 0,
    "11-15": 0,
    "16+": 0,
  }
  for (const c of counts) dist[disciplineCountBucket(c)]++
  return dist
}

const regDiscCounts = VALIDATION_LOCATIONS.map((l) => l.disciplines.length)
const sorted = [...regDiscCounts].sort((a, b) => a - b)

/** Summary for manifest / stats. */
export const VALIDATION_LOCATION_TIER_STATS = {
  total: VALIDATION_LOCATIONS.length,
  uniqueDisciplines: VALIDATION_DISCIPLINE_KEYS.length,
  avgDisciplinesPerLocation: +(regDiscCounts.reduce((a, b) => a + b, 0) / regDiscCounts.length).toFixed(2),
  medianDisciplinesPerLocation: sorted[Math.floor(sorted.length / 2)],
  minDisciplinesPerLocation: sorted[0],
  maxDisciplinesPerLocation: sorted[sorted.length - 1],
  distribution: distribution(regDiscCounts),
  facilities: Object.keys(VALIDATION_FACILITIES).length,
} as const
