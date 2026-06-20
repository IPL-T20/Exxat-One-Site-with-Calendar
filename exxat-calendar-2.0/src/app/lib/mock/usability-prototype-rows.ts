/**
 * Frozen usability fixture — MedStar · Behavioral Health · OT · Oct 2026.
 * Constitution: single review cluster for F1–F8 prototype assembly.
 */
import { DAYS, SHIFTS, loc, row } from "./slot-request-fixture-utils"
import type { SlotRequest } from "./slot-requests"

const BH = loc("Behavioral Health", "MedStar Good Samaritan Hospital", "Behavioral Health")
const OT = "Master of Occupational Therapy (OT)"

export const USABILITY_FIXTURE_IDS = {
  hopkins: "R-1041",
  towson: "R-1042",
  duke: "R-1043",
  villanova: "R-1044",
} as const

export const USABILITY_PROTOTYPE_ROWS: SlotRequest[] = [
  row({
    id: USABILITY_FIXTURE_IDS.villanova,
    school: "Villanova University - OT",
    availabilityName: "BH OT Fall 2026",
    experienceType: "Individual",
    requestedSlots: 2,
    pendingDuration: 12,
    requestedLocation: BH,
    programType: OT,
    requestedShifts: SHIFTS.day12,
    requestedDaysOfWeek: `${DAYS.wed}+${DAYS.fri}`,
    requestedDate: "May 15, 2026",
    requestedBy: "School",
    requestedDuration: "Sep 01–Nov 30, 2026",
    approvedInfo: "2",
    studentProfileShared: "",
    partnerCategory: "PARTNER_GOLD",
    status: "Approved",
    scenarioTag: "USABILITY",
  }),
  row({
    id: USABILITY_FIXTURE_IDS.hopkins,
    school: "Johns Hopkins University - OT",
    availabilityName: "BH OT Fall 2026",
    experienceType: "Individual",
    requestedSlots: 1,
    pendingDuration: 4,
    requestedLocation: BH,
    programType: OT,
    requestedShifts: SHIFTS.day12,
    requestedDaysOfWeek: `${DAYS.wed}+${DAYS.fri}`,
    requestedDate: "Jun 01, 2026",
    requestedBy: "School",
    requestedDuration: "Sep 08–Nov 28, 2026",
    approvedInfo: "--",
    studentProfileShared: "1",
    partnerCategory: "PARTNER_GOLD",
    status: "Review",
    scenarioTag: "USABILITY",
  }),
  row({
    id: USABILITY_FIXTURE_IDS.towson,
    school: "Towson University - OT",
    availabilityName: "BH OT Fall 2026",
    experienceType: "Group",
    requestedSlots: 3,
    pendingDuration: 6,
    requestedLocation: BH,
    programType: OT,
    requestedShifts: SHIFTS.day12,
    requestedDaysOfWeek: `${DAYS.wed}+${DAYS.fri}`,
    requestedDate: "Jun 02, 2026",
    requestedBy: "School",
    requestedDuration: "Sep 04–Dec 18, 2026",
    approvedInfo: "--",
    studentProfileShared: "",
    partnerCategory: "",
    status: "Request Pending",
    scenarioTag: "USABILITY",
  }),
  row({
    id: USABILITY_FIXTURE_IDS.duke,
    school: "Duke University - OT",
    availabilityName: "BH OT Fall 2026",
    experienceType: "Individual",
    requestedSlots: 2,
    pendingDuration: 3,
    requestedLocation: BH,
    programType: OT,
    requestedShifts: SHIFTS.day12,
    requestedDaysOfWeek: `${DAYS.wed}+${DAYS.fri}`,
    requestedDate: "Jun 03, 2026",
    requestedBy: "School",
    requestedDuration: "Sep 11–Nov 27, 2026",
    approvedInfo: "--",
    studentProfileShared: "1",
    partnerCategory: "",
    status: "Request Pending",
    scenarioTag: "USABILITY",
  }),
]
