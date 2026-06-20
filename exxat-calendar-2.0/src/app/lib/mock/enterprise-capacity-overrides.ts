/**
 * Ground-truth capacity overrides for enterprise validation scenarios.
 * Applied when loading the enterprise dataset so hot-row competition is meaningful.
 */
import type { LocationCapacityRecord } from "../slot-requests-calendar/types"

/** locationId → discipline → concurrent slot cap */
export const ENTERPRISE_DISCIPLINE_CAPACITY: Record<string, Record<string, number>> = {
  /** 7E IMCU — Nursing hot row (~55 requests, Fri Day pile) */
  "7e-imcu": { Nursing: 8, PT: 4, OT: 4 },
  /** 5E Oncology — mixed footprint cluster (45) */
  "5e-medical-oncology": { Nursing: 10 },
  /** Franklin 5T Med Surg — weekend homogeneous cluster (20) */
  "5t-med-surg-neuro-stroke": { Nursing: 6 },
  /** MWHC 2G ICU — overbook + future risk */
  "2g-medical-icu": { Nursing: 6 },
  /** Stress corpus — 50+ TTh Day cluster */
  "9e-med-surg-tele": { Nursing: 8 },
  /** Stress corpus — 25+ NICU TTh cluster + near-cap */
  nicu: { Nursing: 6, Pediatrics: 6 },
  /** Stress corpus — Gold vs Gold / large vs small */
  "behavioral-health": { Nursing: 4, "Behavioral Health": 4 },
  /** Stress corpus — shift split control row */
  "4h-burn-trauma-icu": { Nursing: 6 },
  /** Validation corpus — hot competition rows */
  "3e-nicu": { Nursing: 6, Pediatrics: 6 },
  "multidisciplinary-clinic": { Nursing: 12, PT: 6, OT: 6 },
  "comprehensive-cancer-center": { Nursing: 10, Pharmacy: 8 },
}

export function applyEnterpriseCapacityOverrides(
  catalog: LocationCapacityRecord[],
): LocationCapacityRecord[] {
  return catalog.map((record) => {
    const overrides = ENTERPRISE_DISCIPLINE_CAPACITY[record.locationId]
    if (!overrides) return record
    return {
      ...record,
      disciplineCaps: { ...record.disciplineCaps, ...overrides },
    }
  })
}

export function isEnterpriseCorpusRow(row: { availabilityName?: string }): boolean {
  return /^\[(ENT|STRESS|VALID)-/.test(row.availabilityName ?? "")
}

export function rowsUseEnterpriseCorpus(rows: { availabilityName?: string }[]): boolean {
  return rows.some(isEnterpriseCorpusRow)
}
