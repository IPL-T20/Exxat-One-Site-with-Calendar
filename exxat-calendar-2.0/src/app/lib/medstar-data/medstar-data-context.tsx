import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { getSlotRequestRows } from "../mock/slot-requests-datasets"
import { buildMedStarClusterSurface } from "../medstar-real/cluster-surface"
import type { MedStarClusterSurface } from "../medstar-real/cluster-surface"
import type { SlotRequestRow } from "../slot-requests-calendar/types"
import { parseLocationParts } from "../slot-requests-calendar/parse"
import { computeApprovalWorkflowKpis } from "../slot-requests-calendar/calendar-workflow-kpis"
import { buildMedStarCalendarScopeRows } from "./calendar-scope"
import { MedStarDataStore } from "./MedStarDataStore"
import { medStarRequestsToRows } from "./request-adapter"
import type { MedStarScenario } from "./types"

export const MEDSTAR_CALENDAR_FOCUS_DATE = new Date(2026, 7, 15)

export type MedStarDataSource = "loading" | "medstar" | "fixture"

export interface MedStarDataContextValue {
  source: MedStarDataSource
  loadError: string | null
  allRows: SlotRequestRow[]
  calendarRows: SlotRequestRow[]
  store: MedStarDataStore | null
  isMedStarLoaded: boolean
  getClusterSurface: (requestIds: string[]) => MedStarClusterSurface | null
  findScenarioForCluster: (requestIds: string[]) => MedStarScenario | undefined
}

const MedStarDataContext = createContext<MedStarDataContextValue | null>(null)

const FIXTURE_ROWS = getSlotRequestRows("usability-prototype")

function logPhase1CReport(
  store: MedStarDataStore,
  allRows: SlotRequestRow[],
  calendarRows: SlotRequestRow[],
): void {
  const units = [
    ...new Set(calendarRows.map((r) => parseLocationParts(r.requestedLocation).unit)),
  ].sort()
  const kpis = computeApprovalWorkflowKpis(allRows, {
    referenceDate: MEDSTAR_CALENDAR_FOCUS_DATE,
  })

  console.group("[Phase 1C] MedStar data wired")
  console.log("product URL:            /slot-requests/list")
  console.log("requests loaded:       ", store.getRequests().length)
  console.log("scenario count:        ", store.getScenarios().length)
  console.log("calendar scoped rows:  ", calendarRows.length)
  console.log("unique calendar units: ", units.length)
  console.log("KPI (all rows):", kpis)
  console.log("first 10 calendar units:", units.slice(0, 10))
  console.log("fixture fallback:       only on load failure")
  console.groupEnd()
}

import { findExactScenario } from "./scenario-lookup"

export function MedStarDataProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<MedStarDataSource>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [allRows, setAllRows] = useState<SlotRequestRow[]>([])
  const [calendarRows, setCalendarRows] = useState<SlotRequestRow[]>([])
  const [store, setStore] = useState<MedStarDataStore | null>(null)

  useEffect(() => {
    let cancelled = false

    MedStarDataStore.load()
      .then((loaded) => {
        if (cancelled) return
        const rows = medStarRequestsToRows(loaded.getRequests())
        const scoped = buildMedStarCalendarScopeRows(rows, loaded)
        loaded.printVerificationReport()
        logPhase1CReport(loaded, rows, scoped)
        setStore(loaded)
        setAllRows(rows)
        setCalendarRows(scoped)
        setSource("medstar")
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.warn("[MedStarDataProvider] load failed — using fixture fallback", err)
        setStore(null)
        setAllRows(FIXTURE_ROWS)
        setCalendarRows(FIXTURE_ROWS)
        setSource("fixture")
        setLoadError(err instanceof Error ? err.message : "Failed to load MedStar data")
      })

    return () => {
      cancelled = true
    }
  }, [])

  const findScenarioForCluster = useCallback(
    (requestIds: string[]) => {
      if (!store) return undefined
      return findExactScenario(store, requestIds)
    },
    [store],
  )

  const getClusterSurface = useCallback(
    (requestIds: string[]): MedStarClusterSurface | null => {
      if (!store || requestIds.length < 2) return null
      const scenario = findExactScenario(store, requestIds)
      if (!scenario) return null
      const activeCount =
        scenario.activeCount ??
        requestIds.filter((id) => {
          const row = allRows.find((r) => r.id === id)
          return row?.status === "Review" || row?.status === "Request Pending"
        }).length
      return buildMedStarClusterSurface(scenario, activeCount)
    },
    [store, allRows],
  )

  const value = useMemo<MedStarDataContextValue>(
    () => ({
      source,
      loadError,
      allRows,
      calendarRows,
      store,
      isMedStarLoaded: source === "medstar",
      getClusterSurface,
      findScenarioForCluster,
    }),
    [
      source,
      loadError,
      allRows,
      calendarRows,
      store,
      getClusterSurface,
      findScenarioForCluster,
    ],
  )

  return (
    <MedStarDataContext.Provider value={value}>{children}</MedStarDataContext.Provider>
  )
}

export function useMedStarData(): MedStarDataContextValue {
  const ctx = useContext(MedStarDataContext)
  if (!ctx) {
    throw new Error("useMedStarData must be used within MedStarDataProvider")
  }
  return ctx
}

/** Optional hook — safe outside provider (returns null). */
export function useMedStarDataOptional(): MedStarDataContextValue | null {
  return useContext(MedStarDataContext)
}
