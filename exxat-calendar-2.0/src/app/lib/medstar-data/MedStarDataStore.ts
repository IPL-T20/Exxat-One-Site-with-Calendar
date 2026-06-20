import { publicAssetUrl } from "../app-base-path"
import type {
  MedStarLoadVerification,
  MedStarManifest,
  MedStarRequest,
  MedStarScenario,
  MedStarRequestsIndex,
  MedStarScenariosIndex,
} from "./types"

const DEFAULT_BASE = publicAssetUrl("medstar").replace(/\/$/, "")

let loadPromise: Promise<MedStarDataStore> | null = null

export class MedStarDataStore {
  private manifest: MedStarManifest | null = null
  private requests: MedStarRequest[] = []
  private requestsById = new Map<number, MedStarRequest>()
  private scenariosById = new Map<string, MedStarScenario>()
  private scenarioIds: string[] = []
  private requestIdToScenarioIds = new Map<number, string[]>()
  private scenariosByFootprint = new Map<string, string[]>()
  private topByActiveCount: string[] = []
  private topByPressureScore: string[] = []
  private loaded = false

  /** Fetch manifest + indexes once. Safe to call multiple times. */
  static async load(baseUrl = DEFAULT_BASE): Promise<MedStarDataStore> {
    if (!loadPromise) {
      loadPromise = (async () => {
        const store = new MedStarDataStore()
        await store.fetchAll(baseUrl)
        return store
      })()
    }
    return loadPromise
  }

  /** Reset singleton (tests / hot reload). */
  static reset(): void {
    loadPromise = null
  }

  private async fetchAll(baseUrl: string): Promise<void> {
    const base = baseUrl.replace(/\/$/, "")
    const [manifestRes, requestsRes, scenariosRes] = await Promise.all([
      fetch(`${base}/manifest.json`),
      fetch(`${base}/requests.index.json`),
      fetch(`${base}/scenarios.index.json`),
    ])

    if (!manifestRes.ok) throw new Error(`Failed to load manifest: ${manifestRes.status}`)
    if (!requestsRes.ok) throw new Error(`Failed to load requests index: ${requestsRes.status}`)
    if (!scenariosRes.ok) throw new Error(`Failed to load scenarios index: ${scenariosRes.status}`)

    this.manifest = (await manifestRes.json()) as MedStarManifest
    const requestsIndex = (await requestsRes.json()) as MedStarRequestsIndex
    const scenariosIndex = (await scenariosRes.json()) as MedStarScenariosIndex

    this.requests = requestsIndex.requests ?? []
    this.requestsById.clear()
    for (const row of this.requests) {
      this.requestsById.set(row.id, row)
    }

    this.scenarioIds = scenariosIndex.scenarioIds ?? []
    this.scenariosById.clear()
    for (const [id, scenario] of Object.entries(scenariosIndex.scenariosById ?? {})) {
      this.scenariosById.set(id, scenario)
    }

    this.requestIdToScenarioIds.clear()
    for (const [reqId, scenarioIds] of Object.entries(
      scenariosIndex.requestIdToScenarioIds ?? {},
    )) {
      this.requestIdToScenarioIds.set(Number(reqId), scenarioIds)
    }

    this.scenariosByFootprint.clear()
    for (const [fp, ids] of Object.entries(scenariosIndex.scenariosByFootprint ?? {})) {
      this.scenariosByFootprint.set(fp, ids)
    }

    this.topByActiveCount = scenariosIndex.topScenarioIds?.byActiveCount ?? []
    this.topByPressureScore = scenariosIndex.topScenarioIds?.byPressureScore ?? []
    this.loaded = true
  }

  isLoaded(): boolean {
    return this.loaded
  }

  getManifest(): MedStarManifest | null {
    return this.manifest
  }

  getRequests(): readonly MedStarRequest[] {
    return this.requests
  }

  getRequestById(id: number): MedStarRequest | undefined {
    return this.requestsById.get(id)
  }

  getScenarios(): readonly MedStarScenario[] {
    return this.scenarioIds
      .map((id) => this.scenariosById.get(id))
      .filter((s): s is MedStarScenario => Boolean(s))
  }

  getScenarioById(id: string): MedStarScenario | undefined {
    return this.scenariosById.get(id)
  }

  getScenariosForRequestId(requestId: number): MedStarScenario[] {
    const ids = this.requestIdToScenarioIds.get(requestId) ?? []
    return ids
      .map((id) => this.scenariosById.get(id))
      .filter((s): s is MedStarScenario => Boolean(s))
  }

  getScenariosByFootprint(footprint: string): MedStarScenario[] {
    const ids = this.scenariosByFootprint.get(footprint) ?? []
    return ids
      .map((id) => this.scenariosById.get(id))
      .filter((s): s is MedStarScenario => Boolean(s))
  }

  getTopScenarios(
    sort: "activeCount" | "pressureScore" = "activeCount",
  ): readonly MedStarScenario[] {
    const ids = sort === "pressureScore" ? this.topByPressureScore : this.topByActiveCount
    return ids
      .map((id) => this.scenariosById.get(id))
      .filter((s): s is MedStarScenario => Boolean(s))
  }

  /** Verify loaded indexes — logs report and returns structured result. */
  verify(): MedStarLoadVerification {
    const manifest = this.manifest
    const report: MedStarLoadVerification = {
      manifestLoaded: Boolean(manifest),
      requestCount: this.requests.length,
      uniqueRequestCount: this.requestsById.size,
      scenarioCount: this.scenarioIds.length,
      orphanScenarioRequestIds: 0,
      duplicateDisplayIds: manifest?.duplicateDisplayIds ?? [],
      warnings: [],
    }

    if (!manifest) {
      report.warnings.push("Manifest not loaded")
      return report
    }

    for (const [reqId, scenarioIds] of this.requestIdToScenarioIds) {
      if (!this.requestsById.has(reqId)) {
        report.orphanScenarioRequestIds++
      }
      if (!scenarioIds.length) {
        report.warnings.push(`Empty scenario list for requestId ${reqId}`)
      }
    }

    if (report.requestCount !== manifest.requestCount) {
      report.warnings.push(
        `Request count mismatch: manifest=${manifest.requestCount} index=${report.requestCount}`,
      )
    }
    if (report.scenarioCount !== manifest.scenarioCount) {
      report.warnings.push(
        `Scenario count mismatch: manifest=${manifest.scenarioCount} index=${report.scenarioCount}`,
      )
    }

    return report
  }

  /** Console verification report (dev / QA). */
  printVerificationReport(): MedStarLoadVerification {
    const report = this.verify()
    console.group("[MedStarDataStore] verification")
    console.log("manifest loaded:         ", report.manifestLoaded)
    console.log("requests loaded:         ", report.requestCount)
    console.log("unique request IDs:      ", report.uniqueRequestCount)
    console.log("unique scenarios:        ", report.scenarioCount)
    console.log("orphan scenario req IDs: ", report.orphanScenarioRequestIds)
    console.log(
      "duplicate displayIds:    ",
      report.duplicateDisplayIds.length,
      report.duplicateDisplayIds.length ? "(non-fatal)" : "",
    )
    if (report.duplicateDisplayIds.length) {
      console.log("  ", report.duplicateDisplayIds)
    }
    if (report.warnings.length) {
      console.warn("warnings:", report.warnings)
    }
    console.groupEnd()
    return report
  }
}

/** Dev helper — load store and print verification (not wired to product UI). */
export async function verifyMedStarDataStore(baseUrl = DEFAULT_BASE): Promise<MedStarLoadVerification> {
  MedStarDataStore.reset()
  const store = await MedStarDataStore.load(baseUrl)
  return store.printVerificationReport()
}
