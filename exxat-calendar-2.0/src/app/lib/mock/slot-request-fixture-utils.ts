/**
 * Shared helpers for slot-request fixture generation (baseline + enterprise).
 */
import type { SlotRequest, SlotStatus } from "./slot-requests"

export type RowSeed = Omit<SlotRequest, "id"> & { id?: string; scenarioTag?: string }

let seq = 9_000_000_000

export function resetFixtureSeq(start = 9_000_000_000) {
  seq = start
}

export function loc(unit: string, facility: string, group: string) {
  return `${unit} (${facility} > ${group})`
}

export function row(seed: RowSeed): SlotRequest {
  seq += 1
  const tag = seed.scenarioTag ? `[${seed.scenarioTag}] ` : ""
  const { scenarioTag: _t, ...rest } = seed
  return {
    ...rest,
    id: seed.id ?? String(seq),
    availabilityName: tag + rest.availabilityName,
  }
}

export const SHIFTS = {
  day12: "Day Shift (12-Hours)(07:00-19:00)",
  day8: "Day Shift (8-Hours)(07:00-15:00)",
  night12: "Night Shift (12-Hours)(19:00-07:00)",
  eve8: "Evening Shift (8-Hours)(15:00-23:00)",
  custom: "Custom Shift Timings",
} as const

export const DAYS = {
  daily: "Mon+Tue+Wed+Thu+Fri",
  mwf: "Mon+Wed+Fri",
  tth: "Tue+Thu",
  wed: "Wed",
  fri: "Fri",
  monWed: "Mon+Wed",
  satSun: "Sat+Sun",
  weekend: "Sat+Sun",
} as const

/** Gold Partner schools — ~10–15% of stress corpus rows carry PARTNER_GOLD. */
export const GOLD_SCHOOLS = {
  towson: "Towson University - Nursing - Graduate",
  duke: "Duke University - MSN",
  jhu: "Johns Hopkins University - School of Nursing",
} as const

export const PARTNER_GOLD = "Gold Partner"

/** 38 schools for enterprise-stress corpus (30+ requirement). */
export const STRESS_SCHOOL_POOL = [
  "Community College of Baltimore County - Essex Campus - Nursing",
  "Community College of Baltimore County - Dundalk Campus - Nursing",
  "Community College of Baltimore County - Catonsville Campus - Nursing",
  "Trinity Washington University - Nursing - Undergraduate",
  "Chamberlain University - Tyson's Corner Campus - Nursing",
  "Chamberlain University - Atlanta Campus - Nursing",
  "Prince George's Community College - Nursing - Pre-Licensure Nursing",
  "Stevenson University - Nursing - Pre-Licensure Nursing",
  "Salisbury University - Nursing",
  "University of Maryland - Baltimore - Nursing",
  "University of Maryland - College Park - Nursing",
  "The George Washington University - Nursing - BSN",
  "Georgetown University - Nursing",
  "Coppin State University - Nursing",
  "Morgan State University - Nursing",
  "Notre Dame of Maryland University - Nursing",
  "Bowie State University - Nursing",
  "Hood College - Nursing",
  "McDaniel College - Nursing",
  "Washington Adventist University - Nursing",
  "University of Maryland - Baltimore - Physical Therapy",
  "George Washington University - Physical Therapy",
  "Salisbury University - Physical Therapy",
  "Towson University - Physical Therapy",
  "University of Delaware - Physical Therapy",
  "Towson University - Occupational Therapy",
  "University of Maryland - Baltimore - Occupational Therapy",
  "University of Maryland - College Park - SLP",
  "Towson University - Speech-Language Pathology",
  "Loyola University Maryland - SLP",
  "University of Maryland - Baltimore - Respiratory Therapy",
  "Community College of Baltimore County - Respiratory Therapy",
  "Johns Hopkins University - School of Nursing",
  "Duke University - MSN",
  "Towson University - Nursing - Graduate",
  "Villanova University - Nursing",
  "Penn State University - Nursing",
  "Virginia Commonwealth University - Nursing",
  "West Chester University - Nursing",
] as const

export function pickStressSchool(i: number): string {
  return STRESS_SCHOOL_POOL[i % STRESS_SCHOOL_POOL.length]
}

/** Enterprise validation corpus — 70 schools; only VALIDATION_GOLD_SCHOOLS carry Gold Partner. */
export const VALIDATION_SCHOOL_POOL = [
  ...STRESS_SCHOOL_POOL,
  "Georgetown University - Nursing",
  "Howard University - Nursing",
  "University of Delaware - Nursing",
  "James Madison University - Nursing",
  "Towson University - Occupational Therapy",
  "Salisbury University - Occupational Therapy",
  "University of Delaware - Occupational Therapy",
  "Georgetown University - Physical Therapy",
  "Howard University - Physical Therapy",
  "James Madison University - Physical Therapy",
  "Loyola University Maryland - Nursing",
  "Goucher College - Nursing",
  "Frostburg State University - Nursing",
  "Mount St. Mary's University - Nursing",
  "Hood College - Physical Therapy",
  "McDaniel College - Physical Therapy",
  "Washington College - Nursing",
  "University of Virginia - Nursing",
  "Virginia Tech - Nursing",
  "Old Dominion University - Nursing",
  "Radford University - Nursing",
  "East Carolina University - Nursing",
  "University of North Carolina - Chapel Hill - Nursing",
  "Wake Forest University - Nursing",
  "Elizabethtown College - Nursing",
  "York College of Pennsylvania - Nursing",
  "Millersville University - Nursing",
  "Shippensburg University - Nursing",
  "Bloomsburg University - Nursing",
  "Temple University - Nursing",
  "Drexel University - Nursing",
  "La Salle University - Nursing",
  "Immaculata University - Nursing",
] as const

/** ~7% of schools — Gold rows come only from these (plus partnerCategory tag). */
export const VALIDATION_GOLD_SCHOOLS = new Set<string>([
  GOLD_SCHOOLS.towson,
  GOLD_SCHOOLS.duke,
  GOLD_SCHOOLS.jhu,
  "Georgetown University - Nursing",
  "The George Washington University - Nursing - BSN",
])

export function pickValidationSchool(i: number): string {
  return VALIDATION_SCHOOL_POOL[i % VALIDATION_SCHOOL_POOL.length]
}

/** Assign school + optional Gold Partner category (~8–12% of rows when forceGold false). */
export function assignValidationSchool(
  i: number,
  opts?: { forceGold?: boolean; schoolOverride?: string },
): { school: string; partnerCategory: string } {
  const school = opts?.schoolOverride ?? pickValidationSchool(i)
  const isGoldSchool = VALIDATION_GOLD_SCHOOLS.has(school)
  const tagGold =
    isGoldSchool && (opts?.forceGold === true || i % 12 === 0 || i % 12 === 1)
  return { school, partnerCategory: tagGold ? PARTNER_GOLD : "" }
}
