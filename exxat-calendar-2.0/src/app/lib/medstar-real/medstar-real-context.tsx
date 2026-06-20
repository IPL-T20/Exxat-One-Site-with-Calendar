import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import scenarioJson from "../../data/medical-surgical-scenario.json"
import {
  isActiveMedStarRow,
  medStarScenarioToRows,
} from "./adapter"
import {
  buildMedStarClusterSurface,
  buildMedStarHoverContent,
  type MedStarClusterSurface,
  type MedStarHoverContent,
} from "./cluster-surface"
import { sortMedStarPrimaryRows } from "./review-order"
import type { MedStarOutcome, MedStarOutcomeType, MedStarScenario } from "./types"
import { MEDSTAR_SCENARIO_ID } from "./types"
import type { SlotRequestRow } from "../slot-requests-calendar/types"

interface MedStarRealContextValue {
  enabled: boolean
  scenarioId: string
  scenario: MedStarScenario
  baseRows: SlotRequestRow[]
  effectiveRows: SlotRequestRow[]
  activeCount: number
  clusterSurface: MedStarClusterSurface
  hoverContent: MedStarHoverContent
  primaryRows: SlotRequestRow[]
  contextRows: SlotRequestRow[]
  outcome: MedStarOutcome | null
  clusterPulse: boolean
  clearOutcome: () => void
  applyApprove: (requestId: string, school: string) => void
  applyHold: (requestId: string, school: string) => void
  applyDecline: (requestId: string, school: string) => void
  getRecommendedAction: (row: SlotRequestRow) => {
    action: "Approve" | "Hold" | "Decline"
    why: string
    potentialImpact: string
    otherAffected: string
    remains: string
  }
}

const MedStarRealContext = createContext<MedStarRealContextValue | null>(null)

const SCENARIO = scenarioJson as MedStarScenario

export function MedStarRealProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  const baseRows = useMemo(() => medStarScenarioToRows(SCENARIO), [])
  const [approvedIds, setApprovedIds] = useState<Set<string>>(() => new Set())
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(() => new Set())
  const [holdIds, setHoldIds] = useState<Set<string>>(() => new Set())
  const [outcome, setOutcome] = useState<MedStarOutcome | null>(null)
  const [clusterPulse, setClusterPulse] = useState(false)

  const effectiveRows = useMemo(() => {
    return baseRows.map((row) => {
      if (approvedIds.has(row.id)) {
        return {
          ...row,
          status: "Approved" as const,
          approvedInfo: String(row.requestedSlots),
        }
      }
      if (declinedIds.has(row.id)) {
        return { ...row, status: "Declined" as const }
      }
      if (holdIds.has(row.id)) {
        return { ...row, status: "Review" as const }
      }
      return row
    })
  }, [baseRows, approvedIds, declinedIds, holdIds])

  const activeCount = useMemo(
    () => effectiveRows.filter(isActiveMedStarRow).length,
    [effectiveRows],
  )

  const primaryRows = useMemo(
    () => sortMedStarPrimaryRows(effectiveRows),
    [effectiveRows],
  )

  const contextRows = useMemo(
    () =>
      effectiveRows.filter(
        (r) => !isActiveMedStarRow(r) && r.status !== "Canceled",
      ),
    [effectiveRows],
  )

  const clusterSurface = useMemo(
    () => buildMedStarClusterSurface(SCENARIO, activeCount),
    [activeCount],
  )

  const hoverContent = useMemo(
    () => buildMedStarHoverContent(SCENARIO, activeCount),
    [activeCount],
  )

  const emitOutcome = useCallback(
    (type: MedStarOutcomeType, requestId: string, school: string, after: number) => {
      const message =
        type === "approve"
          ? `1 request approved. ${after} Medical Surgical requests still need review.`
          : type === "hold"
            ? `Request held. ${after} Medical Surgical requests still need review.`
            : `1 request declined. ${after} Medical Surgical requests still need review.`

      setOutcome({ type, requestId, school, remainingActive: after, message })
      setClusterPulse(true)
      window.setTimeout(() => setClusterPulse(false), 2400)
    },
    [],
  )

  const applyApprove = useCallback(
    (requestId: string, school: string) => {
      const after = Math.max(0, activeCount - 1)
      setApprovedIds((prev) => new Set(prev).add(requestId))
      emitOutcome("approve", requestId, school, after)
    },
    [activeCount, emitOutcome],
  )

  const applyHold = useCallback(
    (requestId: string, school: string) => {
      emitOutcome("hold", requestId, school, activeCount)
    },
    [activeCount, emitOutcome],
  )

  const applyDecline = useCallback(
    (requestId: string, school: string) => {
      const after = Math.max(0, activeCount - 1)
      setDeclinedIds((prev) => new Set(prev).add(requestId))
      emitOutcome("decline", requestId, school, after)
    },
    [activeCount, emitOutcome],
  )

  const clearOutcome = useCallback(() => setOutcome(null), [])

  const getRecommendedAction = useCallback(
    (row: SlotRequestRow) => {
      const rank = primaryRows.findIndex((r) => r.id === row.id) + 1
      const others = Math.max(0, activeCount - 1)
      return {
        action: rank === 1 ? ("Approve" as const) : ("Hold" as const),
        why:
          rank === 1
            ? `Recommended: ${row.pendingDuration} days pending — highest in compare order (${rank} of ${activeCount}).`
            : `Recommended: Review after higher-priority requests — rank ${rank} of ${activeCount} in compare order.`,
        potentialImpact: `Potential impact: Approving ${row.requestedSlots} slot${row.requestedSlots === 1 ? "" : "s"} may increase pressure on Medical Surgical — ${others} other In-Progress request${others === 1 ? "" : "s"} overlap this window.`,
        otherAffected: `Other requests affected: ${others} In-Progress school request${others === 1 ? "" : "s"} on Medical Surgical · Day 12h (Aug–Dec 2026).`,
        remains: `What remains unresolved: ${activeCount - 1} of ${activeCount} In-Progress requests on Medical Surgical after this decision.`,
      }
    },
    [primaryRows, activeCount],
  )

  const value = useMemo<MedStarRealContextValue>(
    () => ({
      enabled,
      scenarioId: MEDSTAR_SCENARIO_ID,
      scenario: SCENARIO,
      baseRows,
      effectiveRows,
      activeCount,
      clusterSurface,
      hoverContent,
      primaryRows,
      contextRows,
      outcome,
      clusterPulse,
      clearOutcome,
      applyApprove,
      applyHold,
      applyDecline,
      getRecommendedAction,
    }),
    [
      enabled,
      baseRows,
      effectiveRows,
      activeCount,
      clusterSurface,
      hoverContent,
      primaryRows,
      contextRows,
      outcome,
      clusterPulse,
      clearOutcome,
      applyApprove,
      applyHold,
      applyDecline,
      getRecommendedAction,
    ],
  )

  return (
    <MedStarRealContext.Provider value={value}>{children}</MedStarRealContext.Provider>
  )
}

export function useMedStarReal(): MedStarRealContextValue {
  const ctx = useContext(MedStarRealContext)
  if (!ctx) {
    return {
      enabled: false,
      scenarioId: MEDSTAR_SCENARIO_ID,
      scenario: SCENARIO,
      baseRows: [],
      effectiveRows: [],
      activeCount: 0,
      clusterSurface: buildMedStarClusterSurface(SCENARIO, 18),
      hoverContent: buildMedStarHoverContent(SCENARIO, 18),
      primaryRows: [],
      contextRows: [],
      outcome: null,
      clusterPulse: false,
      clearOutcome: () => {},
      applyApprove: () => {},
      applyHold: () => {},
      applyDecline: () => {},
      getRecommendedAction: () => ({
        action: "Hold",
        why: "",
        potentialImpact: "",
        otherAffected: "",
        remains: "",
      }),
    }
  }
  return ctx
}
