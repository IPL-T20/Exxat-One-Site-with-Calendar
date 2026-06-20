/**
 * Runnable scenario examples for the decision engine.
 * Invoke from devtools: import { runDecisionEngineExamples } from '.../decision-engine'
 */
import { row, loc, SHIFTS, DAYS, GOLD_SCHOOLS, PARTNER_GOLD } from "../../mock/slot-request-fixture-utils"
import type { SlotRequest } from "../../mock/slot-requests"
import { buildDecisionSnapshot } from "./build-decision-snapshot"
import type { RequestDecisionSnapshot } from "./decision-types"
import { requestsTrulyCompete } from "./footprint-competition"
import { buildSchedulingFootprint } from "./schedule-footprint"

const CAP_RECORDS = [
  {
    locationId: "7e-imcu",
    locationName: "7E - IMCU",
    locationGroup: "Intermediate Care",
    totalSlots: 8,
    disciplineCaps: { Nursing: 8 },
    source: "catalog" as const,
  },
]

function snap(rows: SlotRequest[]): Record<string, RequestDecisionSnapshot> {
  return buildDecisionSnapshot(rows, CAP_RECORDS).byRequestId
}

function print(label: string, s: RequestDecisionSnapshot) {
  console.log(`\n=== ${label} ===`)
  console.log({
    id: s.requestId,
    footprint: s.footprint.footprintLabel,
    competitionClass: s.competitionClass,
    capacityState: s.capacityState,
    cap: s.cap,
    peakApproved: s.peakApprovedSlots,
    peakDemand: s.peakDemandSlots,
    headroomAfterApproval: s.headroomAfterApproval,
    remainingHeadroom: s.remainingHeadroom,
    competing: s.competingRequestIds.length,
    competingSlotDemand: s.competingSlotDemand,
    gold: s.isGoldPartner,
    risk: s.approvalRisk,
    priority: s.priorityScore,
  })
}

export function runDecisionEngineExamples(): void {
  const unit = loc("7E - IMCU", "MedStar Union Memorial Hospital", "Intermediate Care")
  const span = "Sep 08–Nov 28, 2026"

  // 1. Simple isolated request
  const simple = snap([
    row({
      scenarioTag: "EX-SIMPLE",
      school: "Salisbury University - Nursing",
      availabilityName: "Open rotation",
      requestedLocation: unit,
      requestedDuration: span,
      requestedDaysOfWeek: DAYS.tth,
      requestedShifts: SHIFTS.day12,
      requestedSlots: 2,
      status: "Request Pending",
    }),
  ])
  print("Simple request", simple[Object.keys(simple)[0]!]!)

  // 2. Competing Fri-day pile (2 schools)
  const friA = row({
    scenarioTag: "EX-COMP-A",
    school: "CCBC - Essex - Nursing",
    availabilityName: "Fri A",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.fri,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 4,
    status: "Request Pending",
  })
  const friB = row({
    scenarioTag: "EX-COMP-B",
    school: "Trinity Washington University - Nursing",
    availabilityName: "Fri B",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.fri,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 4,
    status: "Request Pending",
  })
  const competing = snap([friA, friB])
  print("Competing Fri A", competing[friA.id]!)
  print("Competing Fri B", competing[friB.id]!)

  // 3. Shift-separated (day + night) — must NOT compete
  const dayRow = row({
    scenarioTag: "EX-DAY",
    school: "CCBC - Nursing",
    availabilityName: "Day lane",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.daily,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 4,
    status: "Request Pending",
  })
  const nightRow = row({
    scenarioTag: "EX-NIGHT",
    school: "Stevenson University - Nursing",
    availabilityName: "Night lane",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.daily,
    requestedShifts: SHIFTS.night12,
    requestedSlots: 4,
    status: "Request Pending",
  })
  const shiftSep = snap([dayRow, nightRow])
  const fpDay = buildSchedulingFootprint(dayRow)!
  const fpNight = buildSchedulingFootprint(nightRow)!
  console.log("\n=== Shift-separated compete? ===", requestsTrulyCompete(fpDay, fpNight))
  print("Day lane", shiftSep[dayRow.id]!)
  print("Night lane", shiftSep[nightRow.id]!)

  // 4. Weekday-separated MWF vs TTh
  const mwf = row({
    scenarioTag: "EX-MWF",
    school: "CCBC - Nursing",
    availabilityName: "MWF",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.mwf,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 2,
    status: "Request Pending",
  })
  const tth = row({
    scenarioTag: "EX-TTH",
    school: "Stevenson University - Nursing",
    availabilityName: "TTh",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.tth,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 2,
    status: "Request Pending",
  })
  const wdSep = snap([mwf, tth])
  console.log(
    "\n=== MWF vs TTh compete? ===",
    requestsTrulyCompete(buildSchedulingFootprint(mwf)!, buildSchedulingFootprint(tth)!),
  )
  print("MWF", wdSep[mwf.id]!)
  print("TTh", wdSep[tth.id]!)

  // 5. Saturated capacity (approved baseline + pending overflow)
  const approved = row({
    scenarioTag: "EX-APPROVED",
    school: "UMD - Nursing",
    availabilityName: "Approved baseline",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.fri,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 6,
    status: "Approved",
    approvedInfo: "6",
  })
  const pending = row({
    scenarioTag: "EX-PENDING",
    school: "CCBC - Nursing",
    availabilityName: "Pending overflow",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.fri,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 4,
    status: "Request Pending",
  })
  const saturated = snap([approved, pending])
  print("Saturated approved", saturated[approved.id]!)
  print("Saturated pending", saturated[pending.id]!)

  // 6. Gold vs non-Gold on same footprint
  const gold = row({
    scenarioTag: "EX-GOLD",
    school: GOLD_SCHOOLS.towson,
    availabilityName: "Gold Fri",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.fri,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 2,
    partnerCategory: PARTNER_GOLD,
    status: "Request Pending",
    pendingDuration: 1,
  })
  const nonGold = row({
    scenarioTag: "EX-NONGOLD",
    school: "CCBC - Nursing",
    availabilityName: "Non-gold Fri",
    requestedLocation: unit,
    requestedDuration: span,
    requestedDaysOfWeek: DAYS.fri,
    requestedShifts: SHIFTS.day12,
    requestedSlots: 2,
    status: "Request Pending",
    pendingDuration: 14,
  })
  const goldSnap = buildDecisionSnapshot([gold, nonGold], CAP_RECORDS)
  print("Gold partner", goldSnap.byRequestId[gold.id]!)
  print("Non-gold", goldSnap.byRequestId[nonGold.id]!)
  console.log("\n=== Queue order (gold first) ===", goldSnap.queueOrder)

  // 7. Large cluster — 12 Fri requests
  const pile: SlotRequest[] = []
  for (let i = 0; i < 12; i++) {
    pile.push(
      row({
        scenarioTag: "EX-PILE",
        school: `School ${i} - Nursing`,
        availabilityName: `Fri pile ${i}`,
        requestedLocation: unit,
        requestedDuration: span,
        requestedDaysOfWeek: DAYS.fri,
        requestedShifts: SHIFTS.day12,
        requestedSlots: 2,
        status: "Request Pending",
      }),
    )
  }
  const pileSnap = buildDecisionSnapshot(pile, CAP_RECORDS)
  console.log("\n=== Large cluster group ===", pileSnap.competitionGroups[0])
  print("Pile member 0", pileSnap.byRequestId[pile[0]!.id]!)
}
