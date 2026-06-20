/**
 * Enterprise placement scheduling corpus — 265+ requests.
 * Tagged via scenarioTag → [TAG] prefix on availabilityName for validation traceability.
 * Does not modify slot-requests.ts baseline (45 rows).
 */
import {
  DAYS,
  GOLD_SCHOOLS,
  PARTNER_GOLD,
  SHIFTS,
  loc,
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

const SCHOOLS = [
  "Community College of Baltimore County - Essex Campus - Nursing",
  "Community College of Baltimore County - Dundalk Campus - Nursing",
  "Trinity Washington University - Nursing - Undergraduate",
  "Chamberlain University - Tyson's Corner Campus - Nursing",
  "Prince George's Community College - Nursing - Pre-Licensure Nursing",
  "Stevenson University - Nursing - Pre-Licensure Nursing",
  "Salisbury University - Nursing",
  "University of Maryland - Baltimore - Nursing",
  "The George Washington University - Nursing - BSN",
  "Georgetown University - Nursing",
  "Coppin State University - Nursing",
  "Morgan State University - Nursing",
  "Notre Dame of Maryland University - Nursing",
  "University of Maryland - Baltimore - Physical Therapy",
  "George Washington University - Physical Therapy",
  "Salisbury University - Physical Therapy",
  "Towson University - Physical Therapy",
  "Towson University - Occupational Therapy",
  "University of Maryland - Baltimore - Occupational Therapy",
  "University of Maryland - College Park - SLP",
  "Towson University - Speech-Language Pathology",
  "University of Maryland - Baltimore - Respiratory Therapy",
  "Community College of Baltimore County - Respiratory Therapy",
] as const

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]
}

function statusFor(i: number, mix: SlotStatus[]): SlotStatus {
  return mix[i % mix.length]
}

function baseNursing(
  partial: Partial<RowSeed> & Pick<RowSeed, "scenarioTag" | "availabilityName" | "requestedLocation">,
): RowSeed {
  return {
    school: pick(SCHOOLS, partial.scenarioTag?.length ?? 0),
    experienceType: "Individual",
    requestedSlots: 2,
    pendingDuration: 5 + (partial.scenarioTag?.length ?? 0),
    programType: "Pre-Licensure (Nursing)",
    requestedShifts: SHIFTS.day12,
    requestedDaysOfWeek: DAYS.wed,
    requestedDate: "Jun 01, 2026",
    requestedBy: "School",
    requestedDuration: "Sep 15–Nov 30, 2026",
    approvedInfo: "--",
    studentProfileShared: "",
    partnerCategory: "",
    status: "Request Pending",
    ...partial,
  }
}

function generateHot7EImcu(): SlotRequest[] {
  const unit = loc("7E - IMCU", FAC.union, "Intermediate Care")
  const out: SlotRequest[] = []
  const span = "Sep 08–Nov 28, 2026"

  for (let i = 0; i < 2; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-C-01-APPROVED-BASE",
          school: pick(SCHOOLS, i + 3),
          availabilityName: `Approved baseline cohort ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 4,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
          status: "Approved",
          approvedInfo: "4",
          pendingDuration: 0,
        }),
      ),
    )
  }

  for (let i = 0; i < 20; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-01-FRI-DAY-PILE",
          school: pick(SCHOOLS, i),
          availabilityName: `Fri Day competition ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: i % 5 === 0 ? 4 : 2,
          requestedDaysOfWeek: DAYS.fri,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
          pendingDuration: 3 + (i % 14),
          status: statusFor(i, ["Request Pending", "Review", "Request Pending"]),
        }),
      ),
    )
  }

  for (let i = 0; i < 4; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-05-DAY-NIGHT-DAY",
          school: pick(SCHOOLS, i + 10),
          availabilityName: `Day shift parallel ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 3,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.day12,
          requestedDuration: span,
        }),
      ),
    )
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-05-DAY-NIGHT-NIGHT",
          school: pick(SCHOOLS, i + 14),
          availabilityName: `Night shift parallel ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.daily,
          requestedShifts: SHIFTS.night12,
          requestedDuration: span,
        }),
      ),
    )
  }

  for (let i = 0; i < 3; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-06-MWF",
          school: pick(SCHOOLS, i + 20),
          availabilityName: `MWF pattern ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.mwf,
          requestedDuration: span,
        }),
      ),
    )
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-06-TTH",
          school: pick(SCHOOLS, i + 23),
          availabilityName: `TTh pattern ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 2,
          requestedDaysOfWeek: DAYS.tth,
          requestedDuration: span,
        }),
      ),
    )
  }

  const handoffs: [string, string][] = [
    ["Sep 08–Oct 17, 2026", "Oct 18–Nov 28, 2026"],
    ["Sep 08–Oct 31, 2026", "Nov 01–Nov 28, 2026"],
  ]
  handoffs.forEach(([a, b], i) => {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-04-BACK-TO-BACK-A",
          school: GOLD_SCHOOLS.towson,
          availabilityName: `Cohort A handoff ${i + 1}`,
          requestedLocation: unit,
          requestedDuration: a,
          requestedDaysOfWeek: DAYS.wed,
          partnerCategory: i === 0 ? PARTNER_GOLD : "",
        }),
      ),
    )
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-04-BACK-TO-BACK-B",
          school: GOLD_SCHOOLS.towson,
          availabilityName: `Cohort B handoff ${i + 1}`,
          requestedLocation: unit,
          requestedDuration: b,
          requestedDaysOfWeek: DAYS.wed,
          partnerCategory: i === 0 ? PARTNER_GOLD : "",
        }),
      ),
    )
  })

  out.push(
    row(
      baseNursing({
        scenarioTag: "ENT-G-03-GOLD-VS-GOLD",
        school: GOLD_SCHOOLS.towson,
        availabilityName: "Gold Towson Fri Day",
        requestedLocation: unit,
        requestedSlots: 2,
        requestedDaysOfWeek: DAYS.fri,
        partnerCategory: PARTNER_GOLD,
        pendingDuration: 1,
      }),
    ),
  )
  out.push(
    row(
      baseNursing({
        scenarioTag: "ENT-G-03-GOLD-VS-GOLD",
        school: GOLD_SCHOOLS.duke,
        availabilityName: "Gold Duke Fri Day",
        requestedLocation: unit,
        requestedSlots: 2,
        requestedDaysOfWeek: DAYS.fri,
        partnerCategory: PARTNER_GOLD,
        pendingDuration: 2,
      }),
    ),
  )

  out.push(
    row(
      baseNursing({
        scenarioTag: "ENT-G-04-GOLD-IN-PILE",
        school: GOLD_SCHOOLS.jhu,
        availabilityName: "Gold JHU Fri Day large group",
        requestedLocation: unit,
        experienceType: "Group",
        requestedSlots: 6,
        requestedDaysOfWeek: DAYS.fri,
        partnerCategory: PARTNER_GOLD,
        pendingDuration: 1,
      }),
    ),
  )

  for (let i = 0; i < 5; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-C-04-WED-EXHAUST",
          school: pick(SCHOOLS, i + 30),
          availabilityName: `Wed-only load ${i + 1}`,
          requestedLocation: unit,
          requestedSlots: 3,
          requestedDaysOfWeek: DAYS.wed,
          requestedDuration: "Oct 01–Dec 15, 2026",
        }),
      ),
    )
  }

  for (let i = 0; i < 3; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-UR-URGENT",
          school: pick(SCHOOLS, i + 40),
          availabilityName: `Urgent start ${i + 1}`,
          requestedLocation: unit,
          requestedDuration: "Jun 08–Jun 28, 2026",
          pendingDuration: i,
          requestedDaysOfWeek: DAYS.daily,
        }),
      ),
    )
  }

  return out
}

function generateHot5EOncology(): SlotRequest[] {
  const unit = loc("5E - Medical Oncology", FAC.mwhc, "Medical Surgical")
  const out: SlotRequest[] = []
  const span = "Oct 01–Dec 20, 2026"

  for (let i = 0; i < 15; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-D-02-MIXED-FOOTPRINT",
          school: pick(SCHOOLS, i),
          availabilityName: `Mixed Fri Day ${i + 1}`,
          requestedLocation: unit,
          requestedDaysOfWeek: DAYS.fri,
          requestedDuration: span,
          requestedSlots: 2 + (i % 3),
        }),
      ),
    )
  }
  for (let i = 0; i < 15; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-D-02-MIXED-FOOTPRINT",
          school: pick(SCHOOLS, i + 15),
          availabilityName: `Mixed Night ${i + 1}`,
          requestedLocation: unit,
          requestedShifts: SHIFTS.night12,
          requestedDaysOfWeek: DAYS.monWed,
          requestedDuration: span,
          requestedSlots: 2,
        }),
      ),
    )
  }
  for (let i = 0; i < 15; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-D-02-MIXED-FOOTPRINT",
          school: pick(SCHOOLS, i + 30),
          availabilityName: `Mixed TTh ${i + 1}`,
          requestedLocation: unit,
          requestedDaysOfWeek: DAYS.tth,
          requestedDuration: span,
          requestedSlots: i % 4 === 0 ? 6 : 2,
          experienceType: i % 4 === 0 ? "Group" : "Individual",
        }),
      ),
    )
  }

  return out
}

function generateHotFranklinMedSurg(): SlotRequest[] {
  const unit = loc("5T - Med Surg Neuro/Stroke", FAC.franklin, "Medical Surgical")
  const out: SlotRequest[] = []

  const starts = ["Sep 01", "Sep 15", "Oct 01", "Oct 15", "Nov 01", "Nov 15"]
  starts.forEach((start, i) => {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-T-02-PARTIAL-OVERLAP",
          school: pick(SCHOOLS, i),
          availabilityName: `Staggered cohort ${i + 1}`,
          requestedLocation: unit,
          requestedDuration: `${start}–Dec 10, 2026`,
          requestedDaysOfWeek: DAYS.tth,
          requestedSlots: 2 + (i % 2),
        }),
      ),
    )
  })

  for (let i = 0; i < 20; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-D-01-HOMOGENEOUS-20",
          school: pick(SCHOOLS, i + 6),
          availabilityName: `Weekend cluster ${i + 1}`,
          requestedLocation: unit,
          requestedDaysOfWeek: DAYS.weekend,
          requestedShifts: SHIFTS.day12,
          requestedDuration: "Sep 20–Nov 30, 2026",
          requestedSlots: i % 7 === 0 ? 4 : 2,
          status: statusFor(i, ["Request Pending", "Review"]),
        }),
      ),
    )
  }

  return out
}

function generateSeasonalAndStrategic(): SlotRequest[] {
  const out: SlotRequest[] = []

  for (let i = 0; i < 25; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-SE-01-FALL-SPIKE",
          school: pick(SCHOOLS, i),
          availabilityName: `Fall surge ${i + 1}`,
          requestedLocation: loc(
            pick(["9E - Med Surg/Tele", "4T - Telemetry", "3T - Med Surg/Intermediate Care"], i),
            pick([FAC.union, FAC.franklin], i),
            "Medical Surgical",
          ),
          requestedDuration: `Sep ${String(5 + (i % 20)).padStart(2, "0")}–Nov 30, 2026`,
          requestedDaysOfWeek: pick([DAYS.mwf, DAYS.tth, DAYS.daily], i),
        }),
      ),
    )
  }

  for (let i = 0; i < 10; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-SE-02-SUMMER-LOW",
          school: pick(SCHOOLS, i + 25),
          availabilityName: `Summer low ${i + 1}`,
          requestedLocation: loc("CHF Clinic", FAC.goodsam, "Ambulatory"),
          requestedDuration: "Jun 10–Aug 05, 2026",
          requestedSlots: 1,
          status: i % 3 === 0 ? "Approved" : "Request Pending",
          approvedInfo: i % 3 === 0 ? "1" : "--",
        }),
      ),
    )
  }

  for (let i = 0; i < 12; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-SE-03-GRAD-SURGE",
          school: pick(SCHOOLS, i + 35),
          availabilityName: `Graduation crunch ${i + 1}`,
          requestedLocation: loc("2G - Medical ICU", FAC.mwhc, "Intensive Care"),
          requestedDuration: "Nov 10–Dec 06, 2026",
          pendingDuration: 8 + i,
          requestedDaysOfWeek: DAYS.daily,
        }),
      ),
    )
  }

  for (let i = 0; i < 5; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-Y-01-MULTI-YEAR",
          school: pick(SCHOOLS, i),
          availabilityName: `Longitudinal affiliation ${i + 1}`,
          requestedLocation: loc("Medical Surgical", FAC.rehab, "Medical Surgical"),
          programType: "Post-Licensure (Nursing)",
          requestedDuration: "Jul 2026–Jun 2027",
          requestedDaysOfWeek: DAYS.mwf,
          requestedSlots: 1,
        }),
      ),
    )
  }

  return out
}

function generateDurationExtremes(): SlotRequest[] {
  const out: SlotRequest[] = []

  for (let i = 0; i < 8; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-DU-01-ONE-DAY",
          school: pick(SCHOOLS, i),
          availabilityName: `Single-day observation ${i + 1}`,
          requestedLocation: loc("Emergency Department", FAC.smmc, "Emergency Medicine"),
          requestedDuration: `Nov ${10 + i}, 2026–Nov ${10 + i}, 2026`,
          requestedSlots: 1,
          requestedDaysOfWeek: "",
        }),
      ),
    )
  }

  for (let i = 0; i < 10; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-DU-02-LONG-SEMESTER",
          school: pick(SCHOOLS, i + 8),
          availabilityName: `Full semester block ${i + 1}`,
          requestedLocation: loc("Behavioral Health", FAC.smmc, "Behavioral Health"),
          requestedDuration: "Aug 25, 2026–Dec 18, 2026",
          requestedDaysOfWeek: DAYS.tth,
          requestedSlots: i % 3 === 0 ? 6 : 2,
          experienceType: i % 3 === 0 ? "Group" : "Individual",
        }),
      ),
    )
  }

  return out
}

function generateWaitlistAndFutureRisk(): SlotRequest[] {
  const out: SlotRequest[] = []
  const unit = loc("2G - Medical ICU", FAC.mwhc, "Intensive Care")

  for (let i = 0; i < 6; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-WL-WAITLIST",
          school: pick(SCHOOLS, i + 12),
          availabilityName: `Waitlist candidate ${i + 1}`,
          requestedLocation: unit,
          requestedDuration: "Oct 15–Dec 01, 2026",
          requestedDaysOfWeek: DAYS.daily,
          status: "Review",
          pendingDuration: 21 + i,
          partnerCategory: i === 0 ? "Waitlist — capacity full" : "",
        }),
      ),
    )
  }

  for (let i = 0; i < 8; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-C-06-FUTURE-RISK",
          school: pick(SCHOOLS, i + 18),
          availabilityName: `November pipeline ${i + 1}`,
          requestedLocation: unit,
          requestedDuration: "Nov 01–Dec 15, 2026",
          requestedDaysOfWeek: DAYS.daily,
          requestedSlots: 3,
          status: "Request Pending",
        }),
      ),
    )
  }

  out.push(
    row(
      baseNursing({
        scenarioTag: "ENT-C-03-OVERBOOKED",
        school: pick(SCHOOLS, 0),
        availabilityName: "Overcommitted approved A",
        requestedLocation: unit,
        requestedSlots: 6,
        requestedDaysOfWeek: DAYS.daily,
        requestedDuration: "Sep 01–Dec 01, 2026",
        status: "Approved",
        approvedInfo: "6",
      }),
    ),
  )
  out.push(
    row(
      baseNursing({
        scenarioTag: "ENT-C-03-OVERBOOKED",
        school: pick(SCHOOLS, 1),
        availabilityName: "Overcommitted approved B",
        requestedLocation: unit,
        requestedSlots: 6,
        requestedDaysOfWeek: DAYS.daily,
        requestedDuration: "Sep 01–Dec 01, 2026",
        status: "Approved",
        approvedInfo: "6",
      }),
    ),
  )

  return out
}

function generateCrossDisciplineAndSchool(): SlotRequest[] {
  const out: SlotRequest[] = []

  const gwu = "The George Washington University - Nursing - BSN"
  const gwuSites = [
    loc("4H - Burn/Trauma ICU", FAC.mwhc, "Intensive Care"),
    loc("5E - Medical Oncology", FAC.mwhc, "Medical Surgical"),
    loc("5D/5F - High Risk/Postpartum", FAC.mwhc, "Women's Health"),
    loc("7E - IMCU", FAC.union, "Intermediate Care"),
  ]
  gwuSites.forEach((site, i) => {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-A-03-SAME-SCHOOL-MULTI",
          school: gwu,
          availabilityName: `GWU multi-site ${i + 1}`,
          requestedLocation: site,
          requestedDuration: "Oct 01–Nov 30, 2026",
          partnerCategory: "MWHC Scholarship Schools",
        }),
      ),
    )
  })

  out.push(
    row(
      baseNursing({
        scenarioTag: "ENT-X-01-CROSS-DISCIPLINE",
        school: "University of Maryland - Baltimore - Physical Therapy",
        availabilityName: "PT on IMCU unit",
        requestedLocation: loc("7E - IMCU", FAC.union, "Intermediate Care"),
        programType: "Doctor of Physical Therapy (PT)",
        requestedShifts: SHIFTS.day8,
        requestedDaysOfWeek: DAYS.wed,
        requestedSlots: 2,
        requestedDuration: "Sep 15–Nov 15, 2026",
        experienceType: "Individual",
        pendingDuration: 4,
        requestedDate: "Jun 02, 2026",
        requestedBy: "School",
        approvedInfo: "--",
        studentProfileShared: "",
        partnerCategory: "",
        status: "Request Pending",
      }),
    ),
  )
  out.push(
    row(
      baseNursing({
        scenarioTag: "ENT-X-01-CROSS-DISCIPLINE",
        school: "Towson University - Occupational Therapy",
        availabilityName: "OT on IMCU unit",
        requestedLocation: loc("7E - IMCU", FAC.union, "Intermediate Care"),
        programType: "Master of Occupational Therapy (OT)",
        requestedShifts: SHIFTS.day8,
        requestedDaysOfWeek: DAYS.fri,
        requestedSlots: 1,
        requestedDuration: "Oct 01–Dec 01, 2026",
        experienceType: "Individual",
        pendingDuration: 4,
        requestedDate: "Jun 02, 2026",
        requestedBy: "School",
        approvedInfo: "--",
        studentProfileShared: "",
        partnerCategory: "",
        status: "Request Pending",
      }),
    ),
  )

  for (let i = 0; i < 6; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-C-02-NEARLY-EXHAUSTED",
          school: pick(SCHOOLS, i + 50),
          availabilityName: `Tight capacity ${i + 1}`,
          requestedLocation: loc("NICU", FAC.franklin, "Women's Health"),
          programType: "Pre-Licensure (Pediatrics)",
          requestedDuration: "Sep 10–Dec 01, 2026",
          requestedSlots: 2,
          status: i < 2 ? "Approved" : "Request Pending",
          approvedInfo: i < 2 ? "2" : "--",
        }),
      ),
    )
  }

  for (let i = 0; i < 5; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-C-01-AVAILABLE",
          school: pick(SCHOOLS, i + 55),
          availabilityName: `Open capacity ${i + 1}`,
          requestedLocation: loc("Nursing Education", FAC.franklin, "Ambulatory"),
          programType: "Post-Licensure (Nursing)",
          requestedDuration: "Mar 01–May 15, 2027",
          requestedSlots: 1,
          status: "Request Pending",
        }),
      ),
    )
  }

  out.push(
    row({
      scenarioTag: "ENT-FILL-PT",
      school: "Salisbury University - Physical Therapy",
      availabilityName: "PT Neuro rotation",
      requestedLocation: loc("2E - Neurosurgery/Stroke/ENT", FAC.mwhc, "Medical Surgical"),
      programType: "Doctor of Physical Therapy (PT)",
      requestedShifts: SHIFTS.day8,
      requestedDaysOfWeek: DAYS.tth,
      requestedSlots: 2,
      requestedDuration: "Sep 01–Nov 15, 2026",
      experienceType: "Individual",
      pendingDuration: 4,
      requestedDate: "Jun 02, 2026",
      requestedBy: "School",
      approvedInfo: "--",
      studentProfileShared: "",
      partnerCategory: "",
      status: "Request Pending",
    }),
  )

  for (let i = 0; i < 24; i++) {
    out.push(
      row(
        baseNursing({
          scenarioTag: "ENT-FILL-BALANCE",
          school: pick(SCHOOLS, i + 60),
          availabilityName: `Balanced load ${i + 1}`,
          requestedLocation: loc(
            pick(
              [
                "4F - Pulmonary",
                "3EIMC - Burn/Trauma IMC",
                "4NE - Medical Cardiology/Cardiac IMC",
                "2SB - Behavioral Health",
              ],
              i,
            ),
            pick([FAC.mwhc, FAC.franklin, FAC.smmc], i),
            pick(["Medical Surgical", "Intensive Care", "Behavioral Health"], i),
          ),
          requestedDuration: pick(
            ["Aug 20–Oct 30, 2026", "Sep 01–Dec 01, 2026", "Oct 10–Dec 20, 2026"],
            i,
          ),
          requestedDaysOfWeek: pick([DAYS.mwf, DAYS.tth, DAYS.wed, DAYS.fri, ""], i),
          requestedSlots: 1 + (i % 4),
          status: statusFor(i, ["Request Pending", "Approved", "Review"]),
          approvedInfo: i % 3 === 1 ? String(1 + (i % 4)) : "--",
        }),
      ),
    )
  }

  return out
}

export function buildEnterpriseSlotRequests(): SlotRequest[] {
  resetFixtureSeq(9_100_000_000)
  const rows = [
    ...generateHot7EImcu(),
    ...generateHot5EOncology(),
    ...generateHotFranklinMedSurg(),
    ...generateSeasonalAndStrategic(),
    ...generateDurationExtremes(),
    ...generateWaitlistAndFutureRisk(),
    ...generateCrossDisciplineAndSchool(),
  ]
  if (rows.length < 250) {
    throw new Error(`Enterprise corpus expected ≥250 rows, got ${rows.length}`)
  }
  return rows
}

export const ENTERPRISE_SLOT_REQUESTS: SlotRequest[] = buildEnterpriseSlotRequests()

export const ENTERPRISE_CORPUS_STATS = {
  totalRows: ENTERPRISE_SLOT_REQUESTS.length,
  activeRows: ENTERPRISE_SLOT_REQUESTS.filter(
    (r) => r.status !== "Declined" && r.status !== "Canceled",
  ).length,
  goldPartnerRows: ENTERPRISE_SLOT_REQUESTS.filter((r) => r.partnerCategory === PARTNER_GOLD)
    .length,
  scenarioTags: [
    ...new Set(
      ENTERPRISE_SLOT_REQUESTS.map((r) => {
        const m = r.availabilityName.match(/^\[([^\]]+)\]/)
        return m?.[1] ?? "UNTAGGED"
      }),
    ),
  ].sort(),
} as const
