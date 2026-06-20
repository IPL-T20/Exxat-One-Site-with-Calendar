/**
 * Enterprise VALIDATION corpus — ~95 locations, ~3500+ requests.
 * Load: ?dataset=enterprise-validation
 */
import {
  DAYS,
  GOLD_SCHOOLS,
  resetFixtureSeq,
  row,
  SHIFTS,
  assignValidationSchool,
  pickValidationSchool,
  type RowSeed,
} from "./slot-request-fixture-utils"
import {
  VALIDATION_LOCATIONS,
  programForDiscipline,
  requestCountForLoadTier,
  resolveDisciplineLoad,
  validationLocString,
  VALIDATION_LOCATION_TIER_STATS,
  type ValidationDisciplineKey,
  type ValidationLocationDef,
} from "./enterprise-validation-locations"
import type { SlotRequest, SlotStatus } from "./slot-requests"
import { requestedDateDaysAgo } from "../slot-requests-calendar/queue-age"

const SPAN = {
  fall2026: "Sep 08–Nov 28, 2026",
  fall2025: "Sep 10–Dec 05, 2025",
  spring2027: "Mar 01–May 15, 2027",
  summer2026: "Jun 10–Aug 05, 2026",
  winter2026: "Jan 06–Mar 28, 2026",
  shortOct: "Oct 10–Nov 07, 2026",
  longRun: "Jan 15, 2025–Dec 20, 2027",
  q3Spike: "Aug 15–Oct 30, 2026",
  handoffA: "Aug 01–Oct 15, 2026",
  handoffB: "Oct 16–Dec 20, 2026",
  nestedOuter: "Sep 01–Dec 15, 2026",
  nestedInner: "Oct 01–Nov 15, 2026",
  identical: "Sep 20–Nov 30, 2026",
  partialA: "Sep 01–Nov 01, 2026",
  partialB: "Oct 15–Dec 15, 2026",
  minimalOverlapA: "Sep 01–Sep 20, 2026",
  minimalOverlapB: "Sep 18–Oct 10, 2026",
  summerLull: "Jul 01–Aug 15, 2026",
  annual2025: "Sep 05–Nov 25, 2025",
  annual2026: "Sep 05–Nov 25, 2026",
  annual2027: "Sep 05–Nov 25, 2027",
} as const

function statusFor(i: number, mix: SlotStatus[]): SlotStatus {
  return mix[i % mix.length]
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]
}

function baseSeed(
  partial: Partial<RowSeed> & Pick<RowSeed, "scenarioTag" | "availabilityName" | "requestedLocation">,
  i: number,
): RowSeed {
  const { school, partnerCategory } = assignValidationSchool(i, {
    forceGold: partial.partnerCategory === "Gold Partner",
    schoolOverride: partial.school,
  })
  const queueAgeDays = 1 + (i % 30)
  return {
    school,
    experienceType: i % 7 === 0 ? "Group" : "Individual",
    requestedSlots: 1 + (i % 3),
    pendingDuration: queueAgeDays,
    programType: "Pre-Licensure (Nursing)",
    requestedShifts: SHIFTS.day12,
    requestedDaysOfWeek: DAYS.wed,
    requestedDate: requestedDateDaysAgo(queueAgeDays),
    requestedBy: "School",
    requestedDuration: SPAN.fall2026,
    approvedInfo: "--",
    studentProfileShared: i % 5 === 0 ? "1" : "",
    partnerCategory,
    status: "Request Pending",
    ...partial,
  }
}

function at(def: ValidationLocationDef, disc: ValidationDisciplineKey = def.disciplines[0]): string {
  return validationLocString(def)
}

function discProgram(def: ValidationLocationDef, disc?: ValidationDisciplineKey): string {
  const d = disc ?? def.disciplines[0]
  return programForDiscipline(d)
}

function findSlug(slug: string): ValidationLocationDef {
  const found = VALIDATION_LOCATIONS.find((l) => l.slug === slug)
  if (!found) throw new Error(`Validation location not found: ${slug}`)
  return found
}

/** Resolve by unit-name fragment when slug varies by floor prefix. */
function findByUnit(fragment: string): ValidationLocationDef {
  const lower = fragment.toLowerCase()
  const matches = VALIDATION_LOCATIONS.filter((l) => l.unit.toLowerCase().includes(lower))
  if (matches.length === 0) {
    throw new Error(`Validation location not found for unit fragment: ${fragment}`)
  }
  // Prefer exact hub names (no floor prefix) when multiple match
  return matches.sort((a, b) => a.unit.length - b.unit.length)[0]
}

// ── Discipline matrix coverage — every registered discipline gets a load tier ─

function generateDisciplineMatrixCoverage(): SlotRequest[] {
  const out: SlotRequest[] = []
  let i = 0

  for (const location of VALIDATION_LOCATIONS) {
    for (const disc of location.disciplines) {
      const tier = resolveDisciplineLoad(location, disc)
      const count = requestCountForLoadTier(tier)
      for (let j = 0; j < count; j++) {
        out.push(
          row(
            baseSeed(
              {
                scenarioTag: "VALID-MATRIX",
                availabilityName: `[VALID-MATRIX] ${location.unit} · ${disc} ${j + 1}`,
                requestedLocation: at(location),
                programType: discProgram(location, disc),
                requestedDuration: pick(
                  [SPAN.fall2026, SPAN.spring2027, SPAN.summer2026, SPAN.winter2026],
                  i + j,
                ),
                requestedDaysOfWeek: pick([DAYS.mwf, DAYS.tth, DAYS.wed, DAYS.fri, ""], i + j),
                requestedShifts: pick([SHIFTS.day12, SHIFTS.day8, SHIFTS.night12], i + j),
                requestedSlots:
                  tier === "saturated" ? 2 + (j % 2) : tier === "hotspot" ? 3 : 1 + (j % 2),
                status: statusFor(i + j, ["Request Pending", "Approved", "Review"]),
                approvedInfo: j % 4 === 0 ? "1" : "--",
              },
              i++,
            ),
          ),
        )
      }
    }
  }

  return out
}

// ── Competition clusters (10 / 20 / 30 / 55) ────────────────────────────────

function generateCompetitionPile(
  location: ValidationLocationDef,
  tag: string,
  count: number,
  footprint: { days: string; shift: string; span: string; disc?: ValidationDisciplineKey },
  startIdx: number,
): SlotRequest[] {
  const disc = footprint.disc ?? "Nursing"
  const out: SlotRequest[] = []

  for (let i = 0; i < count; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: tag,
            availabilityName: `Competition pile ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location, disc),
            requestedDaysOfWeek: footprint.days,
            requestedShifts: footprint.shift,
            requestedDuration: footprint.span,
            requestedSlots: i % 11 === 0 ? 4 : i % 5 === 0 ? 3 : 2,
            status: statusFor(i, ["Request Pending", "Review", "Request Pending"]),
          },
          startIdx + i,
        ),
      ),
    )
  }

  return out
}

function generateCompetitionClusters(): SlotRequest[] {
  const friFootprint = { days: DAYS.fri, shift: SHIFTS.day12, span: SPAN.fall2026, disc: "Nursing" as const }
  const tthFootprint = { days: DAYS.tth, shift: SHIFTS.day12, span: SPAN.fall2026, disc: "Nursing" as const }

  return [
    ...generateCompetitionPile(findSlug("7e-imcu"), "VALID-COMP-55", 55, friFootprint, 10_000),
    ...generateCompetitionPile(findSlug("9e-med-surg-tele"), "VALID-COMP-52", 52, tthFootprint, 10_100),
    ...generateCompetitionPile(findByUnit("NICU"), "VALID-COMP-30", 30, tthFootprint, 10_200),
    ...generateCompetitionPile(findSlug("2g-medical-icu"), "VALID-COMP-20", 20, friFootprint, 10_300),
    ...generateCompetitionPile(findSlug("4h-burn-trauma-icu"), "VALID-COMP-10", 10, friFootprint, 10_400),
  ]
}

// ── False overlap: shift + weekday ──────────────────────────────────────────

function generateFalseOverlaps(): SlotRequest[] {
  const icu = findSlug("4h-burn-trauma-icu")
  const onc = findByUnit("Medical Oncology")
  const out: SlotRequest[] = []

  for (let i = 0; i < 20; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: i < 10 ? "VALID-FALSE-SHIFT-DAY" : "VALID-FALSE-SHIFT-NIGHT",
            availabilityName: `Shift split ${i + 1}`,
            requestedLocation: at(icu),
            programType: discProgram(icu, "ICU"),
            requestedDuration: SPAN.identical,
            requestedDaysOfWeek: DAYS.daily,
            requestedShifts: i < 10 ? SHIFTS.day12 : SHIFTS.night12,
            requestedSlots: 2,
          },
          11_000 + i,
        ),
      ),
    )
  }

  for (let i = 0; i < 24; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: i < 12 ? "VALID-FALSE-WD-MWF" : "VALID-FALSE-WD-TTH",
            availabilityName: `Weekday split ${i + 1}`,
            requestedLocation: at(onc),
            programType: discProgram(onc, "Nursing"),
            requestedDuration: SPAN.identical,
            requestedDaysOfWeek: i < 12 ? DAYS.mwf : DAYS.tth,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
          },
          11_100 + i,
        ),
      ),
    )
  }

  return out
}

// ── Date overlap topology ───────────────────────────────────────────────────

function generateOverlapTopologies(): SlotRequest[] {
  const hub = findByUnit("Acute Stroke")
  const out: SlotRequest[] = []
  const configs: Array<[string, string, number]> = [
    ["VALID-OVERLAP-IDENTICAL", SPAN.identical, 15],
    ["VALID-OVERLAP-NESTED", SPAN.nestedOuter, 8],
    ["VALID-OVERLAP-PARTIAL", SPAN.partialA, 12],
    ["VALID-OVERLAP-MINIMAL", SPAN.minimalOverlapA, 10],
    ["VALID-OVERLAP-NON", SPAN.spring2027, 8],
  ]

  let idx = 12_000
  for (const [tag, span, count] of configs) {
    for (let i = 0; i < count; i++) {
      const innerSpan =
        tag === "VALID-OVERLAP-NESTED"
          ? SPAN.nestedInner
          : tag === "VALID-OVERLAP-PARTIAL" && i >= 6
            ? SPAN.partialB
            : tag === "VALID-OVERLAP-MINIMAL" && i >= 5
              ? SPAN.minimalOverlapB
              : span

      out.push(
        row(
          baseSeed(
            {
              scenarioTag: tag,
              availabilityName: `${tag} ${i + 1}`,
              requestedLocation: at(hub),
              programType: discProgram(hub),
              requestedDuration: innerSpan,
              requestedDaysOfWeek: pick([DAYS.mwf, DAYS.tth, DAYS.fri], idx),
              requestedShifts: SHIFTS.day12,
              requestedSlots: 1 + (i % 2),
            },
            idx++,
          ),
        ),
      )
    }
  }

  return out
}

// ── Sequential / handoff / back-to-back ─────────────────────────────────────

function generateSequentialHandoffs(): SlotRequest[] {
  const unit = findByUnit("Med Surg Neuro")
  const out: SlotRequest[] = []

  for (let i = 0; i < 8; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SEQ-A",
            availabilityName: `Handoff cohort A ${i + 1}`,
            requestedLocation: at(unit),
            requestedDuration: SPAN.handoffA,
            requestedDaysOfWeek: DAYS.mwf,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 3,
            status: i < 2 ? "Approved" : "Request Pending",
            approvedInfo: i < 2 ? "3" : "--",
          },
          13_000 + i,
        ),
      ),
    )
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SEQ-B",
            availabilityName: `Handoff cohort B ${i + 1}`,
            requestedLocation: at(unit),
            requestedDuration: SPAN.handoffB,
            requestedDaysOfWeek: DAYS.mwf,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 3,
            status: "Request Pending",
          },
          13_100 + i,
        ),
      ),
    )
  }

  return out
}

// ── Capacity tiers ──────────────────────────────────────────────────────────

function generateCapacityScenarios(): SlotRequest[] {
  const out: SlotRequest[] = []
  let idx = 14_000

  type CapacityTierFilter = ValidationLocationDef["capacityTier"]

  const tiers: Array<[CapacityTierFilter, string, number]> = [
    ["empty", "VALID-CAP-EMPTY", 3],
    ["under", "VALID-CAP-UNDER", 8],
    ["balanced", "VALID-CAP-BALANCED", 12],
    ["near", "VALID-CAP-NEAR", 18],
    ["over", "VALID-CAP-OVER", 22],
    ["uneven", "VALID-CAP-UNEVEN", 15],
    ["future-risk", "VALID-CAP-FUTURE", 10],
  ]

  for (const [tier, tag, perLoc] of tiers) {
    const locs = VALIDATION_LOCATIONS.filter((l) => l.capacityTier === tier).slice(0, 6)
    for (const location of locs) {
      for (let i = 0; i < perLoc; i++) {
        const disc =
          tier === "uneven" && location.dominantDiscipline
            ? i % 3 === 0
              ? location.dominantDiscipline
              : location.disciplines[(i + 1) % location.disciplines.length]
            : location.disciplines[i % location.disciplines.length]

        out.push(
          row(
            baseSeed(
              {
                scenarioTag: tag,
                availabilityName: `Capacity ${tier} ${i + 1}`,
                requestedLocation: at(location),
                programType: discProgram(location, disc),
                requestedDuration: SPAN.fall2026,
                requestedDaysOfWeek: DAYS.fri,
                requestedShifts: SHIFTS.day12,
                requestedSlots: tier === "over" ? 3 + (i % 2) : 2,
                status: statusFor(i, ["Request Pending", "Approved", "Review"]),
                approvedInfo: i % 4 === 0 ? "2" : "--",
              },
              idx++,
            ),
          ),
        )
      }
    }
  }

  // Overbook: approved baseline + pending queue on 2G ICU
  const overUnit = findSlug("2g-medical-icu")
  for (let i = 0; i < 12; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-CAP-OVER-APPROVED",
            availabilityName: `Overbook approved ${i + 1}`,
            requestedLocation: at(overUnit),
            programType: discProgram(overUnit, "ICU"),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: DAYS.daily,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 1,
            status: "Approved",
            approvedInfo: "1",
          },
          idx++,
        ),
      ),
    )
  }
  for (let i = 0; i < 16; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-CAP-OVER-PENDING",
            availabilityName: `Overbook pending ${i + 1}`,
            requestedLocation: at(overUnit),
            programType: discProgram(overUnit, "ICU"),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: DAYS.daily,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
            status: "Request Pending",
          },
          idx++,
        ),
      ),
    )
  }

  return out
}

// ── School scenarios: multi-discipline, multi-location, repeat, long-tail ───

function generateSchoolScenarios(): SlotRequest[] {
  const out: SlotRequest[] = []
  let idx = 15_000

  const multiDiscSchool = "The George Washington University - Nursing - BSN"
  const hub = findByUnit("Multidisciplinary Clinic")
  for (let i = 0; i < 12; i++) {
    const disc = hub.disciplines[i % hub.disciplines.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-MULTI-DISC",
            school: multiDiscSchool,
            availabilityName: `Multi-discipline GWU ${i + 1}`,
            requestedLocation: at(hub),
            programType: discProgram(hub, disc),
            requestedDuration: SPAN.fall2026,
            requestedSlots: 2,
          },
          idx++,
        ),
      ),
    )
  }

  const multiLocSchool = "Community College of Baltimore County - Essex Campus - Nursing"
  const locs = [
    findSlug("7e-imcu"),
    findSlug("9e-med-surg-tele"),
    findByUnit("Emergency Department"),
    findByUnit("NICU"),
    findSlug("behavioral-health"),
  ]
  for (let i = 0; i < 20; i++) {
    const location = locs[i % locs.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-MULTI-LOC",
            school: multiLocSchool,
            availabilityName: `Multi-location CCBC ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.fall2026,
            requestedSlots: 2,
          },
          idx++,
        ),
      ),
    )
  }

  // Repeat schools across system
  for (let s = 0; s < 25; s++) {
    const school = pickValidationSchool(s + 200)
    for (let r = 0; r < 4; r++) {
      const location = VALIDATION_LOCATIONS[(s * 3 + r) % VALIDATION_LOCATIONS.length]
      out.push(
        row(
          baseSeed(
            {
              scenarioTag: "VALID-SCHOOL-REPEAT",
              school,
              availabilityName: `Repeat school ${s + 1}-${r + 1}`,
              requestedLocation: at(location),
              programType: discProgram(location),
              requestedDuration: pick([SPAN.fall2026, SPAN.spring2027], s + r),
              requestedSlots: 1 + (r % 2),
            },
            idx++,
          ),
        ),
      )
    }
  }

  // Long-tail schools (single request each)
  for (let i = 0; i < 40; i++) {
    const location = VALIDATION_LOCATIONS[i % VALIDATION_LOCATIONS.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SCHOOL-LONGTAIL",
            school: pickValidationSchool(300 + i),
            availabilityName: `Long-tail ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.summerLull,
            requestedSlots: 1,
            status: "Request Pending",
          },
          idx++,
        ),
      ),
    )
  }

  return out
}

// ── Gold partner (rare) ─────────────────────────────────────────────────────

function generateGoldScenarios(): SlotRequest[] {
  const out: SlotRequest[] = []
  let idx = 16_000
  const bh = findSlug("behavioral-health")

  // Gold vs non-Gold on tight unit
  for (let i = 0; i < 18; i++) {
    const isGold = i < 4
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-GOLD-VS-NON",
            school: isGold
              ? pick([GOLD_SCHOOLS.towson, GOLD_SCHOOLS.duke, GOLD_SCHOOLS.jhu], i)
              : pickValidationSchool(i + 50),
            partnerCategory: isGold ? "Gold Partner" : "",
            availabilityName: `Gold vs non ${i + 1}`,
            requestedLocation: at(bh),
            programType: discProgram(bh, "Behavioral Health"),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: DAYS.monWed,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
          },
          idx++,
        ),
      ),
    )
  }

  // Gold vs Gold
  const goldSchools = [GOLD_SCHOOLS.towson, GOLD_SCHOOLS.duke, GOLD_SCHOOLS.jhu]
  for (let i = 0; i < 9; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-GOLD-VS-GOLD",
            school: goldSchools[i % 3],
            partnerCategory: "Gold Partner",
            availabilityName: `Gold vs Gold ${i + 1}`,
            requestedLocation: at(bh),
            programType: discProgram(bh, "Behavioral Health"),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: DAYS.monWed,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
          },
          idx++,
        ),
      ),
    )
  }

  // Gold in sparse simple location
  const sparse = VALIDATION_LOCATIONS.find((l) => l.densityTier === "sparse")!
  for (let i = 0; i < 3; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-GOLD-SPARSE",
            school: GOLD_SCHOOLS.towson,
            partnerCategory: "Gold Partner",
            availabilityName: `Gold sparse ${i + 1}`,
            requestedLocation: at(sparse),
            programType: discProgram(sparse),
            requestedDuration: SPAN.spring2027,
            requestedSlots: 1,
          },
          idx++,
        ),
      ),
    )
  }

  return out
}

// ── Seasonal / year-view stress ─────────────────────────────────────────────

function generateSeasonalYearStress(): SlotRequest[] {
  const out: SlotRequest[] = []
  let idx = 17_000

  const fallTargets = VALIDATION_LOCATIONS.filter((l) => l.densityTier === "heavy" || l.densityTier === "extreme")

  // Fall spike across heavy units
  for (let i = 0; i < 80; i++) {
    const location = fallTargets[i % fallTargets.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SEASON-FALL",
            availabilityName: `Fall spike ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.q3Spike,
            requestedDaysOfWeek: DAYS.mwf,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2 + (i % 2),
          },
          idx++,
        ),
      ),
    )
  }

  // Summer lull
  for (let i = 0; i < 35; i++) {
    const location = VALIDATION_LOCATIONS[i % VALIDATION_LOCATIONS.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SEASON-SUMMER-LULL",
            availabilityName: `Summer lull ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.summerLull,
            requestedSlots: 1,
            status: i % 3 === 0 ? "Approved" : "Request Pending",
            approvedInfo: i % 3 === 0 ? "1" : "--",
          },
          idx++,
        ),
      ),
    )
  }

  // Quarterly spikes Q1 / Q3
  for (let q = 0; q < 2; q++) {
    const tag = q === 0 ? "VALID-SEASON-Q1" : "VALID-SEASON-Q3"
    const span = q === 0 ? SPAN.winter2026 : SPAN.q3Spike
    for (let i = 0; i < 30; i++) {
      const location = VALIDATION_LOCATIONS[(q * 30 + i) % VALIDATION_LOCATIONS.length]
      out.push(
        row(
          baseSeed(
            {
              scenarioTag: tag,
              availabilityName: `Quarterly ${q + 1} ${i + 1}`,
              requestedLocation: at(location),
              programType: discProgram(location),
              requestedDuration: span,
              requestedSlots: 2,
            },
            idx++,
          ),
        ),
      )
    }
  }

  // Recurring annual demand (same school, same unit, 3 years)
  const annualUnit = findSlug("7e-imcu")
  const annualSchool = pickValidationSchool(400)
  for (let y = 0; y < 3; y++) {
    const span = [SPAN.annual2025, SPAN.annual2026, SPAN.annual2027][y]
    for (let i = 0; i < 6; i++) {
      out.push(
        row(
          baseSeed(
            {
              scenarioTag: "VALID-YEAR-RECUR",
              school: annualSchool,
              availabilityName: `Annual recur Y${y + 1} ${i + 1}`,
              requestedLocation: at(annualUnit),
              programType: discProgram(annualUnit, "Nursing"),
              requestedDuration: span,
              requestedDaysOfWeek: DAYS.fri,
              requestedShifts: SHIFTS.day12,
              requestedSlots: 4,
              status: y === 0 ? "Approved" : "Request Pending",
              approvedInfo: y === 0 ? "4" : "--",
            },
            idx++,
          ),
        ),
      )
    }
  }

  // Long-running placements
  for (let i = 0; i < 12; i++) {
    const location = VALIDATION_LOCATIONS[i % 20]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-LONG",
            availabilityName: `Long run ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.longRun,
            requestedDaysOfWeek: DAYS.daily,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
            status: i < 4 ? "Approved" : "Request Pending",
            approvedInfo: i < 4 ? "2" : "--",
          },
          idx++,
        ),
      ),
    )
  }

  // Short-term
  for (let i = 0; i < 25; i++) {
    const location = VALIDATION_LOCATIONS[(i * 7) % VALIDATION_LOCATIONS.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SHORT",
            availabilityName: `Short term ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.shortOct,
            requestedSlots: 1,
          },
          idx++,
        ),
      ),
    )
  }

  return out
}

// ── Mixed approval states + aggregation stress ──────────────────────────────

function generateMixedAggregation(): SlotRequest[] {
  const out: SlotRequest[] = []
  const unit = findByUnit("Orthopedics")
  let idx = 18_000

  // Large slot vs many small
  out.push(
    row(
      baseSeed(
        {
          scenarioTag: "VALID-LARGE-VS-SMALL-GROUP",
          school: pickValidationSchool(500),
          availabilityName: "Large 10-slot block",
          requestedLocation: at(unit),
          programType: discProgram(unit, "Nursing"),
          requestedDuration: SPAN.fall2026,
          experienceType: "Group",
          requestedSlots: 10,
          requestedDaysOfWeek: DAYS.mwf,
          requestedShifts: SHIFTS.day12,
        },
        idx++,
      ),
    ),
  )

  for (let i = 0; i < 35; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-LARGE-VS-SMALL-RIVAL",
            availabilityName: `Small rival ${i + 1}`,
            requestedLocation: at(unit),
            programType: discProgram(unit, "Nursing"),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: DAYS.mwf,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 1,
            status: "Request Pending",
          },
          idx++,
        ),
      ),
    )
  }

  // Mixed states cluster
  const mixedUnit = findByUnit("Telemetry")
  for (let i = 0; i < 32; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-MIXED-STATES",
            availabilityName: `Mixed state ${i + 1}`,
            requestedLocation: at(mixedUnit),
            programType: discProgram(mixedUnit),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: DAYS.weekend,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
            status: statusFor(i, [
              "Request Pending",
              "Approved",
              "Review",
              "Declined",
              "Canceled",
            ]),
            approvedInfo: i % 5 === 1 ? "2" : "--",
            partnerCategory: i % 9 === 0 ? "Waitlist — capacity full" : "",
          },
          idx++,
        ),
      ),
    )
  }

  // Isolated requests (no competition)
  const sparseLocs = VALIDATION_LOCATIONS.filter((l) => l.densityTier === "sparse")
  for (let i = 0; i < 45; i++) {
    const location = sparseLocs[i % sparseLocs.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-ISO",
            availabilityName: `Isolated ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: pick([SPAN.spring2027, SPAN.summer2026], i),
            requestedDaysOfWeek: pick([DAYS.satSun, DAYS.wed, ""], i),
            requestedShifts: pick([SHIFTS.eve8, SHIFTS.day8], i),
            requestedSlots: 1,
            status: "Request Pending",
          },
          idx++,
        ),
      ),
    )
  }

  // Weekend / alternating patterns
  for (let i = 0; i < 24; i++) {
    const location = VALIDATION_LOCATIONS[(i * 11) % VALIDATION_LOCATIONS.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SCHED-WEEKEND",
            availabilityName: `Weekend ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: DAYS.satSun,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
          },
          idx++,
        ),
      ),
    )
  }

  for (let i = 0; i < 20; i++) {
    const location = VALIDATION_LOCATIONS[(i * 13) % VALIDATION_LOCATIONS.length]
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SCHED-ALT",
            availabilityName: `Alternating ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location),
            requestedDuration: SPAN.fall2026,
            requestedDaysOfWeek: i % 2 === 0 ? "Mon+Wed+Fri" : "Tue+Thu+Sat",
            requestedShifts: SHIFTS.day12,
            requestedSlots: 2,
          },
          idx++,
        ),
      ),
    )
  }

  // Compete despite minimal visual overlap (same footprint, different weekdays)
  const stealth = findByUnit("Med Surg/Tele")
  for (let i = 0; i < 15; i++) {
    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-COMP-STEALTH",
            availabilityName: `Stealth compete ${i + 1}`,
            requestedLocation: at(stealth),
            programType: discProgram(stealth, "Nursing"),
            requestedDuration: SPAN.partialA,
            requestedDaysOfWeek: i % 2 === 0 ? DAYS.fri : DAYS.wed,
            requestedShifts: SHIFTS.day12,
            requestedSlots: 3,
          },
          idx++,
        ),
      ),
    )
  }

  return out
}

// ── Imaging / allied / specialty spread ─────────────────────────────────────

function generateSpecialtySpread(): SlotRequest[] {
  const out: SlotRequest[] = []
  let idx = 19_000

  const specialtyLocs = VALIDATION_LOCATIONS.filter((l) =>
    l.disciplines.some((d) =>
      ["Radiologic Technology", "Imaging", "Pharmacy", "Dietetics", "Social Work", "Allied Health"].includes(
        d,
      ),
    ),
  )

  for (let i = 0; i < 60; i++) {
    const location = specialtyLocs[i % specialtyLocs.length]
    const disc =
      location.disciplines.find((d) =>
        ["Radiologic Technology", "Imaging", "Pharmacy", "Dietetics", "Social Work", "Allied Health"].includes(
          d,
        ),
      ) ?? location.disciplines[0]

    out.push(
      row(
        baseSeed(
          {
            scenarioTag: "VALID-SPECIALTY",
            availabilityName: `Specialty ${i + 1}`,
            requestedLocation: at(location),
            programType: discProgram(location, disc),
            requestedDuration: pick([SPAN.fall2026, SPAN.winter2026], i),
            requestedSlots: 1 + (i % 2),
          },
          idx++,
        ),
      ),
    )
  }

  return out
}

/** Enterprise density amplifier — removed; discipline matrix + scenario tags cover breadth. */

// ── Assembly ────────────────────────────────────────────────────────────────

export function buildEnterpriseValidationSlotRequests(): SlotRequest[] {
  resetFixtureSeq(9_400_000_000)

  const rows = [
    ...generateDisciplineMatrixCoverage(),
    ...generateCompetitionClusters(),
    ...generateFalseOverlaps(),
    ...generateOverlapTopologies(),
    ...generateSequentialHandoffs(),
    ...generateCapacityScenarios(),
    ...generateSchoolScenarios(),
    ...generateGoldScenarios(),
    ...generateSeasonalYearStress(),
    ...generateMixedAggregation(),
    ...generateSpecialtySpread(),
  ]

  const uniqueLocations = new Set(rows.map((r) => r.requestedLocation.split("(")[0]?.trim()))

  if (uniqueLocations.size < 90) {
    throw new Error(
      `Enterprise validation corpus expected ≥90 unique locations, got ${uniqueLocations.size}`,
    )
  }

  if (rows.length < 2000) {
    throw new Error(`Enterprise validation corpus expected ≥2000 rows, got ${rows.length}`)
  }

  return rows
}

export const ENTERPRISE_VALIDATION_SLOT_REQUESTS: SlotRequest[] =
  buildEnterpriseValidationSlotRequests()

const goldRows = ENTERPRISE_VALIDATION_SLOT_REQUESTS.filter(
  (r) => r.partnerCategory === "Gold Partner",
)
const uniqueSchools = new Set(ENTERPRISE_VALIDATION_SLOT_REQUESTS.map((r) => r.school))
const goldSchoolsInData = [...uniqueSchools].filter((s) =>
  ENTERPRISE_VALIDATION_SLOT_REQUESTS.some(
    (r) => r.school === s && r.partnerCategory === "Gold Partner",
  ),
)

export const ENTERPRISE_VALIDATION_CORPUS_STATS = {
  totalRows: ENTERPRISE_VALIDATION_SLOT_REQUESTS.length,
  activeRows: ENTERPRISE_VALIDATION_SLOT_REQUESTS.filter(
    (r) => r.status !== "Declined" && r.status !== "Canceled",
  ).length,
  uniqueLocations: new Set(
    ENTERPRISE_VALIDATION_SLOT_REQUESTS.map((r) => r.requestedLocation.split("(")[0]?.trim()),
  ).size,
  registryLocations: VALIDATION_LOCATIONS.length,
  goldPartnerRows: goldRows.length,
  goldPartnerPct: Math.round(
    (goldRows.length / ENTERPRISE_VALIDATION_SLOT_REQUESTS.length) * 100,
  ),
  uniqueSchools: uniqueSchools.size,
  goldSchoolsRepresented: goldSchoolsInData.length,
  scenarioTags: [
    ...new Set(
      ENTERPRISE_VALIDATION_SLOT_REQUESTS.map((r) => {
        const m = r.availabilityName.match(/^\[([^\]]+)\]/)
        return m?.[1] ?? "UNTAGGED"
      }),
    ),
  ].sort(),
  locationTierStats: VALIDATION_LOCATION_TIER_STATS,
  hierarchyStats: VALIDATION_LOCATION_TIER_STATS,
} as const
