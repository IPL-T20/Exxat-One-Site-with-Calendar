import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { buildMedStarClusterSurface } from "../medstar-real/cluster-surface"
import type { MedStarClusterSurface } from "../medstar-real/cluster-surface"
import type { SlotRequestRow } from "../slot-requests-calendar/types"
import { computeApprovalWorkflowKpis } from "../slot-requests-calendar/calendar-workflow-kpis"
import {
  buildMappleCalendarScopeRows,
  MAPPLE_CALENDAR_FOCUS_DATE,
} from "../slot-requests/calendar-scope"
import { mappleSlotRequestsToRows } from "../slot-requests/slot-request-adapter"
import { loadSlotRequestsData } from "../slot-requests/use-slot-requests-data"
import { getSlotRequestRows } from "../mock/slot-requests-datasets"
import { buildMedStarCalendarScopeRows } from "./calendar-scope"
import { MedStarDataStore } from "./MedStarDataStore"
import { medStarRequestsToRows } from "./request-adapter"
import type { MedStarScenario } from "./types"
import { findExactScenario } from "./scenario-lookup"

export const MEDSTAR_CALENDAR_FOCUS_DATE = MAPPLE_CALENDAR_FOCUS_DATE

export type MedStarDataSource = "loading" | "mapple" | "medstar" | "fixture"

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

function logMappleReport(allRows: SlotRequestRow[], calendarRows: SlotRequestRow[]): void {
  const kpis = computeApprovalWorkflowKpis(allRows, {
    referenceDate: MAPPLE_CALENDAR_FOCUS_DATE,
  })

  console.group("[Mapple] Slot request data wired")
  console.log("product URL:            /slot-requests/list")
  console.log("requests loaded:       ", allRows.length)
  console.log("calendar scoped rows:  ", calendarRows.length)
  console.log("KPI (all rows):", kpis)
  console.groupEnd()
}

export function MedStarDataProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<MedStarDataSource>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [allRows, setAllRows] = useState<SlotRequestRow[]>([])
  const [calendarRows, setCalendarRows] = useState<SlotRequestRow[]>([])
  const [store, setStore] = useState<MedStarDataStore | null>(null)

  useEffect(() => {
    let cancelled = false

    loadSlotRequestsData()
      .then((data) => {
        if (cancelled) return
        if (data.status !== "ready") {
          throw new Error(data.error ?? "Failed to load Mapple slot requests")
        }
        const rows = mappleSlotRequestsToRows(data.slotRequests)
        const scoped = buildMappleCalendarScopeRows(rows)
        logMappleReport(rows, scoped)
        setStore(null)
        setAllRows(rows)
        setCalendarRows(scoped)
        setSource("mapple")
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.warn("[MedStarDataProvider] Mapple load failed — trying MedStar JSON", err)

        MedStarDataStore.load()
          .then((loaded) => {
            if (cancelled) return
            const rows = medStarRequestsToRows(loaded.getRequests())
            const scoped = buildMedStarCalendarScopeRows(rows, loaded)
            setStore(loaded)
            setAllRows(rows)
            setCalendarRows(scoped)
            setSource("medstar")
            setLoadError(null)
          })
          .catch((fallbackErr: unknown) => {
            if (cancelled) return
            console.warn("[MedStarDataProvider] MedStar load failed — using fixture fallback", fallbackErr)
            setStore(null)
            setAllRows(FIXTURE_ROWS)
            setCalendarRows(FIXTURE_ROWS)
            setSource("fixture")
            setLoadError(
              fallbackErr instanceof Error ? fallbackErr.message : "Failed to load slot request data",
            )
          })
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

  const isProductDataLoaded = source === "mapple" || source === "medstar"

  const value = useMemo<MedStarDataContextValue>(
    () => ({
      source,
      loadError,
      allRows,
      calendarRows,
      store,
      isMedStarLoaded: isProductDataLoaded,
      getClusterSurface,
      findScenarioForCluster,
    }),
    [
      source,
      loadError,
      allRows,
      calendarRows,
      store,
      isProductDataLoaded,
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
