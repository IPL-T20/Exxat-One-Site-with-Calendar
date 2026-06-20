/** Layer A — normalized extract row (16 fields). */
export interface MedStarRequest {
  id: number
  school: string
  status: string
  availId: string | null
  availName: string | null
  shiftName: string | null
  shiftDuration: string | null
  experienceType: string | null
  location: string | null
  locationPath: string | null
  startDate: string | null
  endDate: string | null
  requestedSlots: number | null
  approvedSlots: number | null
  reqPendingDuration: number | null
  actionBy: string | null
}

export interface MedStarScenarioRecord {
  id: number
  school: string
  status: string
  requestedSlots: number | null
  approvedSlots: number | null
  reqPendingDuration: number | null
  startDate: string | null
  endDate: string | null
  availName: string | null
  availId: string | null
}

export interface MedStarScenario {
  id: string
  footprint: string
  classification: string
  clusterVerdict: string
  overlapReason?: string
  location: string | null
  hospital: string | null
  locationPath: string | null
  shiftName: string | null
  shiftDuration: string | null
  earliestStart: string | null
  latestEnd: string | null
  dateRanges?: string[]
  recordCount: number
  schoolCount: number
  schools: string[]
  requestedSlotsTotal: number
  approvedSlotsTotal: number
  activeRequestedSlots?: number
  activeCount: number
  reqPendingCount?: number
  reqPendingMax?: number
  statusMix: Record<string, number>
  availabilityContext?: string[]
  availabilityIdCount?: number
  requestIds: number[]
  records: MedStarScenarioRecord[]
  pressureScore?: number
  pressureBand: string
  hoverSummary: string
  detailSummary?: string
  rankScore?: number
}

export interface MedStarManifest {
  tenantName: string
  tenantId: string
  requestCount: number
  uniqueRequestCount: number
  scenarioCount: number
  generatedAt: string
  sources: {
    layerA: string
    layerB: string
    layerAPath?: string
    layerBPath?: string
  }
  duplicateDisplayIds: { id: number; count: number }[]
  indexFiles: {
    requests: string
    scenarios: string
  }
}

export interface MedStarScenariosIndex {
  scenarioIds: string[]
  scenariosById: Record<string, MedStarScenario>
  requestIdToScenarioIds: Record<string, string[]>
  scenariosByFootprint: Record<string, string[]>
  topScenarioIds: {
    byActiveCount: string[]
    byPressureScore: string[]
  }
}

export interface MedStarRequestsIndex {
  requests: MedStarRequest[]
  duplicateDisplayIds: { id: number; count: number }[]
}

export interface MedStarLoadVerification {
  manifestLoaded: boolean
  requestCount: number
  uniqueRequestCount: number
  scenarioCount: number
  orphanScenarioRequestIds: number
  duplicateDisplayIds: { id: number; count: number }[]
  warnings: string[]
}
