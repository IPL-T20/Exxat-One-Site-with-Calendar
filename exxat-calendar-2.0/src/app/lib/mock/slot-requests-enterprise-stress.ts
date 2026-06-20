/**
 * Enterprise STRESS corpus — 300+ requests engineered to exercise DecisionSnapshot
 * and wired Approval Calendar surfaces (footprint competition, capacity, clusters).
 *
 * Load: ?dataset=enterprise-stress
 * Tags: [STRESS-*] prefix on availabilityName
 */
import {
  DAYS,
  GOLD_SCHOOLS,
  PARTNER_GOLD,
  SHIFTS,
  loc,
  pickStressSchool,
  resetFixtureSeq,
  row,
  type RowSeed,
} from "./slot-request-fixture-utils"
import type { SlotRequest, SlotStatus } from "./slot-requests"

const FAC = {
  union: "MedStar Union Memorial Hospital",
  mwhc: "MedStar Washington Hospital Center",
  franklin: "MedStar Franklin Square Medical Center",
  smmc: "MedStar Southern Maryland Hospital Center",
  rehab: "MedStar National Rehabilitation Hospital",
  goodsam: "MedStar Good Samaritan Hospital",
} as const

const SPAN_HOT = "Sep 08–Nov 28, 2026"
const SPAN_FALL = "Sep 01–Dec 15, 2026"

function statusFor(i: number, mix: SlotStatus[]): SlotStatus {
  return mix[i % mix.length]
}

function baseNursing(
  partial: Partial<RowSeed> & Pick<RowSeed, "scenarioTag" | "availabilityName" | "requestedLocation">,
): RowSeed {
  return {
    school: pickStressSchool(partial.scenarioTag?.length ?? 0),
    experienceType: "Individual",
    requestedSlots: 2,
    pendingDuration: 5 + (partial.scenarioTag?.length ?? 0),
    programType: "Pre-Licensure (Nursing)",
    requestedShifts: SHIFTS.day12,
    requestedDaysOfWeek: DAYS.wed,
    requestedDate: "Jun 01, 2026",
    requestedBy: "School",
    requestedDuration: SPAN_HOT,
    approvedInfo: "--",
    studentProfileShared: "",
    partnerCategory: "",
    status: "Request Pending",
    ...partial,
  }
}

/** STRESS-01: 55-request Fri · Day 12h pile — 50+ cluster, true competition */
function generateMegaFriDayPile(): SlotRequest[] {
  const unit = loc("7E - IMCU", FAC.union, "Intermediate Care")
  const out: SlotRequest[] = []

  for (let i = 0; i < 2; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-C-APPROVED-BASE",
          school: pickStressSchool(i + 5),
          availabilityName: `Approved baseline ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 4,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.day12,
          requestedDuration: SPAN_HOT,
          status: "Approved",
          approvedInfo: "4",
          pendingDuration: 0,
        }),
      ),
    )
  }

  const goldIdx = new Set([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 2, 5])
  for (let i = 0; i < 55; i++) {
    const isGold = goldIdx.has(i)
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-TRUE-COMP-FRI-55",
          school: isGold
            ? i % 3 === 0
              ? GOLD_SCHOOLS.towson
              : i % 3 === 1
                ? GOLD_SCHOOLS.duke
                : GOLD_SCHOOLS.jhu
            : pickStressSchool(i + 10),
          availabilityName: `Fri Day pile ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: i % 11 === 0 ? 4 : i % 5 === 0 ? 3 : 2,
          requestedDaysOfWeek: DAYS.fri,
          requestedShifts: SHIFTS.day12,
          requestedDuration: SPAN_HOT,
          pendingDuration: 1 + (i % 21),
          partnerCategory: isGold ? PARTNER_GOLD : "",
          status: statusFor(i, ["Request Pending", "Review", "Request Pending", "Request Pending"]),
        }),
      ),
    )
  }

  return out
}

/** STRESS-02: 52-request Tue/Thu · Day 12h — second 50+ cluster */
function generateMegaTthPile(): SlotRequest[] {
  const unit = loc("9E - Med Surg/Tele", FAC.union, "Medical Surgical")
  const out: SlotRequest[] = []

  for (let i = 0; i < 52; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-TRUE-COMP-TTH-52",
          school: pickStressSchool(i + 70),
          availabilityName: `TTh Day pile ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: i % 9 === 0 ? 4 : 2,
          requestedDaysOfWeek: DAYS.tth,
          requestedShifts: SHIFTS.day12,
          requestedDuration: SPAN_HOT,
          pendingDuration: 2 + (i % 18),
          status: statusFor(i, ["Request Pending", "Review"]),
        }),
      ),
    )
  }

  return out
}

/** STRESS-03: 25-request NICU cluster — 20+ cluster + near-cap */
function generateNicUCluster25(): SlotRequest[] {
  const unit = loc("NICU", FAC.franklin, "Women's Health")
  const out: SlotRequest[] = []

  for (let i = 0; i < 3; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-C-NEAR-CAP-NICU",
          school: pickStressSchool(i + 130),
          availabilityName: `NICU approved ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (Pediatrics)",
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.tth,
          requestedShifts: SHIFTS.day12,
          requestedDuration: SPAN_HOT,
          status: "Approved",
          approvedInfo: "2",
          pendingDuration: 0,
        }),
      ),
    )
  }

  for (let i = 0; i < 25; i++) {
    const isGold = i < 4
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-CLUSTER-25-NICU",
          school: isGold
            ? i === 0
              ? GOLD_SCHOOLS.towson
              : i === 1
                ? GOLD_SCHOOLS.duke
                : i === 2
                  ? GOLD_SCHOOLS.jhu
                  : GOLD_SCHOOLS.towson
            : pickStressSchool(i + 140),
          availabilityName: `NICU TTh Day ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (Pediatrics)",
          requestedSlots: i % 6 === 0 ? 3 : 2,
          requestedDaysOfWeek: DAYS.tth,
          requestedShifts: SHIFTS.day12,
          requestedDuration: SPAN_HOT,
          pendingDuration: 3 + (i % 12),
          partnerCategory: isGold ? PARTNER_GOLD : "",
          status: statusFor(i, ["Request Pending", "Review"]),
        }),
      ),
    )
  }

  return out
}

/** STRESS-04: Same dates — Day vs Night (false overlap / shift-separated) */
function generateShiftFalseOverlap(): SlotRequest[] {
  const unit = loc("4H - Burn/Trauma ICU", FAC.mwhc, "Intensive Care")
  const span = "Oct 01–Dec 10, 2026"
  const out: SlotRequest[] = []

  for (let i = 0; i < 10; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-FALSE-SHIFT-DAY",
          school: pickStressSchool(i + 170),
          availabilityName: `Daily Day lane ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (ICU)",
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
        }),
      ),
    )
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-FALSE-SHIFT-NIGHT",
          school: pickStressSchool(i + 180),
          availabilityName: `Daily Night lane ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (ICU)",
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.night12,
          requestedDuration: span,
        }),
      ),
    )
  }

  return out
}

/** STRESS-05: Same shift — MWF vs TTh (false overlap / weekday-separated) */
function generateWeekdayFalseOverlap(): SlotRequest[] {
  const unit = loc("5E - Medical Oncology", FAC.mwhc, "Medical Surgical")
  const span = "Sep 15–Nov 30, 2026"
  const out: SlotRequest[] = []

  for (let i = 0; i < 12; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-FALSE-WEEKDAY-MWF",
          school: pickStressSchool(i + 190),
          availabilityName: `MWF lane ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.mwf,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
        }),
      ),
    )
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-FALSE-WEEKDAY-TTH",
          school: pickStressSchool(i + 202),
          availabilityName: `TTh lane ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.tth,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
        }),
      ),
    )
  }

  return out
}

/** STRESS-06: Overbooked approved load + pending pipeline */
function generateOverbooked(): SlotRequest[] {
  const unit = loc("2G - Medical ICU", FAC.mwhc, "Intensive Care")
  const out: SlotRequest[] = []

  for (let i = 0; i < 2; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-C-OVERBOOKED",
          school: pickStressSchool(i),
          availabilityName: `ICU over-approved ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (ICU)",
          requestedSlots: 6,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.day12,
          requestedDuration: "Sep 01–Dec 01, 2026",
          status: "Approved",
          approvedInfo: "6",
          pendingDuration: 0,
        }),
      ),
    )
  }

  for (let i = 0; i < 14; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-C-OVERBOOKED-QUEUE",
          school: pickStressSchool(i + 220),
          availabilityName: `ICU queue on full unit ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (ICU)",
          requestedSlots: i % 4 === 0 ? 3 : 2,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.day12,
          requestedDuration: "Oct 15–Dec 15, 2026",
          pendingDuration: 4 + (i % 10),
        }),
      ),
    )
  }

  return out
}

/** STRESS-07: Gold vs non-Gold on tight 4-cap unit */
function generateGoldVsNonGold(): SlotRequest[] {
  const unit = loc("Behavioral Health", FAC.smmc, "Behavioral Health")
  const span = "Aug 25–Dec 18, 2026"
  const out: SlotRequest[] = []

  for (let i = 0; i < 3; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-G-GOLD-VS-NON",
          school: i === 0 ? GOLD_SCHOOLS.towson : i === 1 ? GOLD_SCHOOLS.duke : GOLD_SCHOOLS.jhu,
          availabilityName: `Gold partner ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (Behavioral Health)",
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.monWed,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
          partnerCategory: PARTNER_GOLD,
          pendingDuration: 1 + i,
        }),
      ),
    )
  }

  for (let i = 0; i < 18; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-G-GOLD-VS-NON",
          school: pickStressSchool(i + 240),
          availabilityName: `Non-gold competitor ${i + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (Behavioral Health)",
          requestedSlots: 1,
          requestedDaysOfWeek: DAYS.monWed,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
          pendingDuration: 5 + (i % 14),
        }),
      ),
    )
  }

  return out
}

/** STRESS-08: Gold vs Gold — same Mon · Day 12h footprint, cap 4 */
function generateGoldVsGold(): SlotRequest[] {
  const unit = loc("Behavioral Health", FAC.smmc, "Behavioral Health")
  const span = "Sep 10–Nov 20, 2026"
  const goldSchools = [GOLD_SCHOOLS.towson, GOLD_SCHOOLS.duke, GOLD_SCHOOLS.jhu]

  return goldSchools.flatMap((school, i) =>
    [2, 2, 1].map((slots, j) =>
      row(
        baseNursing({
          scenarioTag: "STRESS-G-GOLD-VS-GOLD",
          school,
          availabilityName: `Gold vs Gold ${school.split(" - ")[0]} ${j + 1}`,
          requestedLocation: unit,
          programType: "Pre-Licensure (Behavioral Health)",
          requestedSlots: slots,
          requestedDaysOfWeek: DAYS.monWed,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
          partnerCategory: PARTNER_GOLD,
          pendingDuration: i + j,
        }),
      ),
    ),
  )
}

/** STRESS-09: One large group request vs many 1-slot requests — same footprint */
function generateLargeVsSmall(): SlotRequest[] {
  const unit = loc("5C - Orthopedics", FAC.mwhc, "Medical Surgical")
  const span = "Oct 05–Dec 18, 2026"
  const out: SlotRequest[] = []

  for (let i = 0; i < 3; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-D-LARGE-VS-SMALL-BULK",
          school: pickStressSchool(i + 260),
          availabilityName: `Large group cohort ${i + 1}`,
          requestedLocation: unit,
          experienceType: "Group",
          requestedSlots: i === 0 ? 10 : 8,
          requestedDaysOfWeek: DAYS.fri,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
          pendingDuration: 2,
        }),
      ),
    )
  }

  for (let i = 0; i < 28; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-D-LARGE-VS-SMALL-SINGLE",
          school: pickStressSchool(i + 270),
          availabilityName: `Single slot ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 1,
          requestedDaysOfWeek: DAYS.fri,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
          pendingDuration: 4 + (i % 16),
        }),
      ),
    )
  }

  return out
}

/** STRESS-10: Long-running + sequential handoffs */
function generateLongAndSequential(): SlotRequest[] {
  const unit = loc("7E - IMCU", FAC.union, "Intermediate Care")
  const out: SlotRequest[] = []

  for (let i = 0; i < 6; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-LONG-RUN",
          school: pickStressSchool(i + 300),
          availabilityName: `Longitudinal ${i + 1}`,
          requestedLocation: unit,
          programType: "Post-Licensure (Nursing)",
          requestedDuration: "Jul 2026–Jun 2027",
          requestedDaysOfWeek: DAYS.mwf,
          requestedSlots: 1,
        }),
      ),
    )
  }

  const pairs: [string, string][] = [
    ["Sep 08–Oct 17, 2026", "Oct 18–Nov 28, 2026"],
    ["Sep 08–Oct 31, 2026", "Nov 01–Nov 28, 2026"],
    ["Oct 01–Oct 31, 2026", "Nov 01–Dec 15, 2026"],
  ]
  pairs.forEach(([a, b], i) => {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-SEQUENTIAL-A",
          school: pickStressSchool(i + 310),
          availabilityName: `Sequential cohort A${i + 1}`,
          requestedLocation: unit,
          requestedDuration: a,
          requestedDaysOfWeek: DAYS.wed,
          requestedShifts: SHIFTS.day12,
        }),
      ),
    )
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-T-SEQUENTIAL-B",
          school: pickStressSchool(i + 315),
          availabilityName: `Sequential cohort B${i + 1}`,
          requestedLocation: unit,
          requestedDuration: b,
          requestedDaysOfWeek: DAYS.wed,
          requestedShifts: SHIFTS.day12,
        }),
      ),
    )
  })

  return out
}

/** STRESS-11: Fall seasonal spike across units */
function generateSeasonalSpike(): SlotRequest[] {
  const out: SlotRequest[] = []
  const units = [
    loc("4T - Telemetry", FAC.franklin, "Medical Surgical"),
    loc("3EIMC - Burn/Trauma IMC", FAC.mwhc, "Intermediate Care"),
    loc("2SB - Behavioral Health", FAC.franklin, "Behavioral Health"),
    loc("4NE - Medical Cardiology/Cardiac IMC", FAC.mwhc, "MHVI - Cardiac"),
    loc("Emergency Department", FAC.smmc, "Emergency Medicine"),
  ]

  for (let i = 0; i < 40; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-SE-FALL-SPIKE",
          school: pickStressSchool(i + 320),
          availabilityName: `Fall surge ${i + 1}`,
          requestedLocation: units[i % units.length],
          requestedDuration: `Sep ${String(5 + (i % 25)).padStart(2, "0")}–Nov 30, 2026`,
          requestedDaysOfWeek: pick([DAYS.mwf, DAYS.tth, DAYS.fri, DAYS.daily], i),
          requestedSlots: 1 + (i % 3),
          status: statusFor(i, ["Request Pending", "Approved", "Review"]),
          approvedInfo: i % 3 === 1 ? String(1 + (i % 3)) : "--",
        }),
      ),
    )
  }

  return out
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]
}

/** STRESS-12: Mixed terminal states + waitlist */
function generateMixedStates(): SlotRequest[] {
  const unit = loc("5T - Med Surg Neuro/Stroke", FAC.franklin, "Medical Surgical")
  const out: SlotRequest[] = []

  for (let i = 0; i < 24; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-X-MIXED-STATES",
          school: pickStressSchool(i + 360),
          availabilityName: `Mixed state ${i + 1}`,
          requestedLocation: unit,
          requestedDaysOfWeek: DAYS.weekend,
          requestedShifts: SHIFTS.day12,
          requestedDuration: "Sep 20–Nov 30, 2026",
          requestedSlots: 2,
          status: statusFor(i, [
            "Request Pending",
            "Approved",
            "Review",
            "Declined",
            "Canceled",
          ]),
          approvedInfo: i % 5 === 1 ? "2" : "--",
          partnerCategory: i % 7 === 0 ? "Waitlist — capacity full" : "",
          pendingDuration: i % 5 === 2 ? 22 + i : 3 + (i % 10),
        }),
      ),
    )
  }

  return out
}

/** Background spread — open capacity units, multi-discipline */
function generateBackgroundSpread(): SlotRequest[] {
  const out: SlotRequest[] = []
  const units: Array<[string, string, string, string]> = [
    ["CHF Clinic", FAC.goodsam, "Ambulatory", "Post-Licensure (Nursing)"],
    ["Nursing Education", FAC.franklin, "Ambulatory", "Post-Licensure (Nursing)"],
    ["2E - Neurosurgery/Stroke/ENT", FAC.mwhc, "Medical Surgical", "Doctor of Physical Therapy (PT)"],
    ["4NW - Vascular/Thoracic", FAC.mwhc, "MHVI - Cardiac", "Pre-Licensure (Nursing)"],
    ["3T - Med Surg/Intermediate Care", FAC.union, "Intermediate Care", "Pre-Licensure (Nursing)"],
    ["2C - Psych Medical", FAC.mwhc, "Medical Surgical", "Pre-Licensure (Nursing)"],
    ["5D/5F - High Risk/Postpartum", FAC.mwhc, "Women's Health", "Pre-Licensure (Pediatrics)"],
    ["Intensive Care", FAC.franklin, "Intensive Care", "Pre-Licensure (ICU)"],
  ]

  for (let i = 0; i < 32; i++) {
    const [unit, fac, group, program] = units[i % units.length]
    out.push(
      row(
        baseNursing({
          scenarioTag: "STRESS-FILL-BACKGROUND",
          school: pickStressSchool(i + 400),
          availabilityName: `Background ${i + 1}`,
          requestedLocation: loc(unit, fac, group),
          programType: program,
          requestedDuration: pick(
            ["Mar 01–May 15, 2027", "Jun 10–Aug 05, 2026", "Oct 10–Dec 20, 2026"],
            i,
          ),
          requestedDaysOfWeek: pick([DAYS.mwf, DAYS.tth, DAYS.wed, ""], i),
          requestedShifts: pick([SHIFTS.day12, SHIFTS.day8, SHIFTS.eve8], i),
          requestedSlots: 1 + (i % 2),
          status: statusFor(i, ["Request Pending", "Approved"]),
          approvedInfo: i % 2 === 0 ? "1" : "--",
        }),
      ),
    )
  }

  return out
}

export function buildEnterpriseStressSlotRequests(): SlotRequest[] {
  resetFixtureSeq(9_200_000_000)
  const rows = [
    ...generateMegaFriDayPile(),
    ...generateMegaTthPile(),
    ...generateNicUCluster25(),
    ...generateShiftFalseOverlap(),
    ...generateWeekdayFalseOverlap(),
    ...generateOverbooked(),
    ...generateGoldVsNonGold(),
    ...generateGoldVsGold(),
    ...generateLargeVsSmall(),
    ...generateLongAndSequential(),
    ...generateSeasonalSpike(),
    ...generateMixedStates(),
    ...generateBackgroundSpread(),
  ]

  if (rows.length < 250) {
    throw new Error(`Enterprise stress corpus expected ≥250 rows, got ${rows.length}`)
  }

  return rows
}

export const ENTERPRISE_STRESS_SLOT_REQUESTS: SlotRequest[] = buildEnterpriseStressSlotRequests()

const goldRows = ENTERPRISE_STRESS_SLOT_REQUESTS.filter((r) => r.partnerCategory === PARTNER_GOLD)

export const ENTERPRISE_STRESS_CORPUS_STATS = {
  totalRows: ENTERPRISE_STRESS_SLOT_REQUESTS.length,
  activeRows: ENTERPRISE_STRESS_SLOT_REQUESTS.filter(
    (r) => r.status !== "Declined" && r.status !== "Canceled",
  ).length,
  goldPartnerRows: goldRows.length,
  goldPartnerPct: Math.round((goldRows.length / ENTERPRISE_STRESS_SLOT_REQUESTS.length) * 100),
  uniqueSchools: new Set(ENTERPRISE_STRESS_SLOT_REQUESTS.map((r) => r.school)).size,
  scenarioTags: [
    ...new Set(
      ENTERPRISE_STRESS_SLOT_REQUESTS.map((r) => {
        const m = r.availabilityName.match(/^\[([^\]]+)\]/)
        return m?.[1] ?? "UNTAGGED"
      }),
    ),
  ].sort(),
} as const
