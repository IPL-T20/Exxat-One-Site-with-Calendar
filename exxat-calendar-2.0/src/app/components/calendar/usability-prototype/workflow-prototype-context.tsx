import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  applyUsabilityRowOverrides,
  buildUsabilitySurfaceSnapshot,
  busiestDayRatioLabel,
  isFacilitatorMode,
  type UsabilitySurfaceSnapshot,
} from "../../../lib/mock/usability-fixture-alignment"
import { USABILITY_FIXTURE_IDS } from "../../../lib/mock/usability-prototype-rows"
import type { SlotRequestRow } from "../../../lib/slot-requests-calendar/types"
import { parseLocationParts } from "../../../lib/slot-requests-calendar/parse"
import {
  isActiveReviewRow,
  recommendedReviewRank,
  sortPrimaryReviewRows,
} from "../../../lib/decision-workflow/review-order"
import { useMedStarDataOptional } from "../../../lib/medstar-data/medstar-data-context"
import type { MedStarScenario } from "../../../lib/medstar-data/types"
import {
  buildScenarioOutcome,
  buildScenarioRecommendedAction,
  rowsForScenario,
  scenarioClusterLabel,
  splitScenarioRows,
} from "../../../lib/medstar-data/scenario-workflow"
import type { RecommendedAction } from "../decision-intelligence-band"

export type OutcomeType = "approve" | "hold" | "decline"
export type HoldReason = "Ops" | "Interview" | "Info needed" | "Other"
export type DeclineReason = "Capacity" | "Eligibility" | "Other"

export interface OutcomeImpactRow {
  school: string
  slots: number
  status: string
  effect: string
  effectTone?: "default" | "amber" | "destructive" | "muted"
}

export interface WorkflowOutcome {
  type: OutcomeType
  requestId: string
  school: string
  reason?: string
  consequenceLead: string
  consequenceDetail: string
  impactTitle: string
  impactRows: OutcomeImpactRow[]
  calendarDelta: string
  nextLabel: string
  nextAction: () => void
  remainingActive?: number
  continueCompareIds?: string[]
  scenarioId?: string
}

export interface F8Annotation {
  text: string
  tone: "approve" | "hold" | "decline" | "continue"
}

export type PrototypeFrame =
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"

interface WorkflowPrototypeContextValue {
  enabled: boolean
  facilitatorMode: boolean
  baseRows: SlotRequestRow[]
  effectiveRows: SlotRequestRow[]
  surfaceSnapshot: UsabilitySurfaceSnapshot | null
  hopkinsApproved: boolean
  approvedIds: ReadonlySet<string>
  declinedIds: ReadonlySet<string>
  holdIds: ReadonlyMap<string, string>
  outcome: WorkflowOutcome | null
  continueBanner: string | null
  f8Annotation: F8Annotation | null
  clusterPulse: boolean
  currentFrame: PrototypeFrame
  setCurrentFrame: (frame: PrototypeFrame) => void
  dismissContinueBanner: () => void
  dismissF8Annotation: () => void
  clearOutcome: () => void
  applyApprove: (requestId: string, school: string, onNext: () => void) => void
  applyHold: (
    requestId: string,
    school: string,
    reason: HoldReason,
    onReturn: () => void,
  ) => void
  applyDecline: (
    requestId: string,
    school: string,
    reason: DeclineReason,
    onReturn: () => void,
  ) => void
  showContinueBanner: (text: string) => void
  isRequestDeclined: (id: string) => boolean
  isRequestOnHold: (id: string) => boolean
  getDetailVariant: (
    requestId: string,
  ) => "decide-first" | "ready" | "approve-with-risk"
  primaryRows: SlotRequestRow[]
  contextRows: SlotRequestRow[]
  activeCount: number
  clusterLabel: string
  activeScenario: MedStarScenario | null
  setActiveScenario: (scenario: MedStarScenario | null) => void
  isMedStarWorkflow: boolean
  isFixtureFallback: boolean
  getRecommendedAction: (row: SlotRequestRow) => RecommendedAction
}

const WorkflowPrototypeContext = createContext<WorkflowPrototypeContextValue | null>(null)

export function WorkflowPrototypeProvider({
  enabled,
  baseRows,
  children,
}: {
  enabled: boolean
  baseRows: SlotRequestRow[]
  children: ReactNode
}) {
  const facilitatorMode = useMemo(
    () => (enabled ? isFacilitatorMode(typeof window !== "undefined" ? window.location.search : "") : false),
    [enabled],
  )

  const [hopkinsApproved, setHopkinsApproved] = useState(false)
  const [approvedIds, setApprovedIds] = useState<Set<string>>(() => new Set())
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(() => new Set())
  const [holdIds, setHoldIds] = useState<Map<string, string>>(() => new Map())
  const [outcome, setOutcome] = useState<WorkflowOutcome | null>(null)
  const [continueBanner, setContinueBanner] = useState<string | null>(null)
  const [f8Annotation, setF8Annotation] = useState<F8Annotation | null>(null)
  const [clusterPulse, setClusterPulse] = useState(false)
  const [currentFrame, setCurrentFrame] = useState<PrototypeFrame>("F1")
  const [activeScenario, setActiveScenario] = useState<MedStarScenario | null>(null)

  const medstarData = useMedStarDataOptional()
  const isMedStarWorkflow = Boolean(medstarData?.isMedStarLoaded)
  const isFixtureFallback = medstarData?.source === "fixture"

  const effectiveRows = useMemo(() => {
    if (!enabled) return baseRows
    return applyUsabilityRowOverrides(baseRows, {
      hopkinsApproved,
      approvedIds,
      declinedIds,
      holdIds,
    })
  }, [enabled, baseRows, hopkinsApproved, approvedIds, declinedIds, holdIds])

  const surfaceSnapshot = useMemo(() => {
    if (!enabled || isMedStarWorkflow) return null
    return buildUsabilitySurfaceSnapshot(effectiveRows, hopkinsApproved, holdIds, declinedIds)
  }, [enabled, isMedStarWorkflow, effectiveRows, hopkinsApproved, holdIds, declinedIds])

  const allEffectiveRows = useMemo(() => {
    if (!isMedStarWorkflow || !medstarData?.allRows.length) return effectiveRows
    return applyUsabilityRowOverrides(medstarData.allRows, {
      hopkinsApproved: false,
      approvedIds,
      declinedIds,
      holdIds,
    })
  }, [
    isMedStarWorkflow,
    medstarData?.allRows,
    effectiveRows,
    approvedIds,
    declinedIds,
    holdIds,
  ])

  const scenarioMemberRows = useMemo(() => {
    if (!activeScenario) return effectiveRows
    return rowsForScenario(allEffectiveRows, activeScenario)
  }, [activeScenario, effectiveRows, allEffectiveRows])

  const { primaryRows, contextRows } = useMemo(() => {
    if (!enabled) {
      return { primaryRows: [] as SlotRequestRow[], contextRows: [] as SlotRequestRow[] }
    }
    if (isMedStarWorkflow && activeScenario) {
      return splitScenarioRows(scenarioMemberRows, declinedIds)
    }
    if (isFixtureFallback) {
      return {
        primaryRows: sortPrimaryReviewRows(
          effectiveRows.filter((r) => isActiveReviewRow(r) && !declinedIds.has(r.id)),
        ),
        contextRows: effectiveRows.filter(
          (r) => !isActiveReviewRow(r) && r.status !== "Canceled" && !declinedIds.has(r.id),
        ),
      }
    }
    return {
      primaryRows: sortPrimaryReviewRows(effectiveRows.filter(isActiveReviewRow)),
      contextRows: effectiveRows.filter((r) => !isActiveReviewRow(r) && r.status !== "Canceled"),
    }
  }, [
    enabled,
    isMedStarWorkflow,
    isFixtureFallback,
    activeScenario,
    scenarioMemberRows,
    effectiveRows,
    declinedIds,
  ])

  const activeCount = primaryRows.length
  const clusterLabel = useMemo(() => {
    if (activeScenario) return scenarioClusterLabel(activeScenario)
    if (medstarData?.isMedStarLoaded && medstarData.store) {
      const top = medstarData.store.getTopScenarios("activeCount")[0]
      if (top) return scenarioClusterLabel(top)
    }
    if (enabled && baseRows.length > 0) {
      const unit = parseLocationParts(baseRows[0].requestedLocation).unit
      return unit ? `${unit}` : "Behavioral Health · OT"
    }
    return "Behavioral Health · OT"
  }, [activeScenario, medstarData, enabled, baseRows])

  const dismissContinueBanner = useCallback(() => setContinueBanner(null), [])
  const dismissF8Annotation = useCallback(() => setF8Annotation(null), [])
  const clearOutcome = useCallback(() => {
    setOutcome(null)
    setCurrentFrame("F8")
    setClusterPulse(true)
    window.setTimeout(() => setClusterPulse(false), 2400)
  }, [])

  const showContinueBanner = useCallback((text: string) => {
    setContinueBanner(text)
    setClusterPulse(true)
    window.setTimeout(() => setClusterPulse(false), 2000)
  }, [])

  const isRequestDeclined = useCallback(
    (id: string) => declinedIds.has(id),
    [declinedIds],
  )
  const isRequestOnHold = useCallback((id: string) => holdIds.has(id), [holdIds])

  const getDetailVariant = useCallback(
    (requestId: string): "decide-first" | "ready" | "approve-with-risk" => {
      if (isMedStarWorkflow) {
        const rank = recommendedReviewRank(requestId, primaryRows) ?? 0
        if (rank > 1 && activeScenario?.pressureBand === "extreme") {
          return "approve-with-risk"
        }
        return "ready"
      }
      if (requestId === USABILITY_FIXTURE_IDS.towson && !hopkinsApproved) {
        return "decide-first"
      }
      if (requestId === USABILITY_FIXTURE_IDS.towson && hopkinsApproved) {
        return "approve-with-risk"
      }
      return "ready"
    },
    [isMedStarWorkflow, primaryRows, activeScenario, hopkinsApproved],
  )

  const getRecommendedAction = useCallback(
    (row: SlotRequestRow): RecommendedAction => {
      if (isMedStarWorkflow && activeScenario) {
        return buildScenarioRecommendedAction(row, primaryRows, activeScenario)
      }
      const rank = recommendedReviewRank(row.id, primaryRows) ?? 0
      const others = Math.max(0, activeCount - 1)
      const variant = getDetailVariant(row.id)
      const action: RecommendedAction["action"] =
        variant === "decide-first" ? "Hold" : rank === 1 ? "Approve" : "Hold"
      return {
        action,
        why:
          variant === "decide-first"
            ? "Recommended: Resolve Johns Hopkins first — partner sequence blocks approval here."
            : rank === 1
              ? `Recommended: ${row.pendingDuration} days pending — highest in compare order (${rank} of ${activeCount}).`
              : `Recommended: Review after higher-priority requests — rank ${rank} of ${activeCount} in compare order.`,
        potentialImpact: `Potential impact: Approving ${row.requestedSlots} slot${row.requestedSlots === 1 ? "" : "s"} may increase pressure on ${clusterLabel} — ${others} other In-Progress request${others === 1 ? "" : "s"} overlap this window.`,
        otherAffected: `Other requests affected: ${others} In-Progress school request${others === 1 ? "" : "s"} on ${clusterLabel} (Sep–Dec 2026).`,
        remains: `What remains unresolved: ${Math.max(0, activeCount - 1)} of ${activeCount} In-Progress requests on ${clusterLabel} after this decision.`,
      }
    },
    [primaryRows, activeCount, getDetailVariant, clusterLabel, isMedStarWorkflow, activeScenario],
  )

  const applyApprove = useCallback(
    (requestId: string, school: string, onNext: () => void) => {
      setApprovedIds((prev) => new Set(prev).add(requestId))
      if (isMedStarWorkflow && activeScenario) {
        const remainingAfter = primaryRows.filter((r) => r.id !== requestId)
        setOutcome(
          buildScenarioOutcome("approve", requestId, school, primaryRows, activeScenario, {
            onNext,
          }) as WorkflowOutcome,
        )
        setF8Annotation({
          text: `1 request approved · ${remainingAfter.length} still need review`,
          tone: "approve",
        })
        setCurrentFrame("F7")
        setClusterPulse(true)
        window.setTimeout(() => setClusterPulse(false), 2400)
        return
      }
      if (requestId === USABILITY_FIXTURE_IDS.hopkins) {
        setHopkinsApproved(true)
      }
      const isTowson = requestId === USABILITY_FIXTURE_IDS.towson
      const loadAfter = isTowson ? 10 : 10
      const loadBefore = isTowson ? 10 : 9
      const remainingAfter = primaryRows.filter((r) => r.id !== requestId)
      setOutcome({
        type: "approve",
        requestId,
        school,
        remainingActive: remainingAfter.length,
        continueCompareIds: remainingAfter.map((r) => r.id),
        consequenceLead: isTowson
          ? "Wed Oct 15 remains full · 0 headroom."
          : "Wed Oct 15 is now full.",
        consequenceDetail: isTowson
          ? `${loadAfter}/10 on busiest day in this window.`
          : `${loadBefore}/10 → ${loadAfter}/10 on busiest day in this window.`,
        impactTitle: "What changed",
        impactRows: isTowson
          ? [
              {
                school: "Duke",
                slots: 2,
                status: "Pending",
                effect: "Would still block",
                effectTone: "destructive",
              },
              {
                school: "Johns Hopkins",
                slots: 1,
                status: "Approved",
                effect: "No change",
                effectTone: "muted",
              },
            ]
          : [
              {
                school: "Towson",
                slots: 3,
                status: "Pending",
                effect: "Would tighten",
                effectTone: "amber",
              },
              {
                school: "Duke",
                slots: 2,
                status: "Pending",
                effect: "Would block",
                effectTone: "destructive",
              },
              {
                school: "Villanova",
                slots: 2,
                status: "Approved",
                effect: "No change",
                effectTone: "muted",
              },
            ],
        calendarDelta: isTowson
          ? `Calendar: ${busiestDayRatioLabel(10)} · Risk posture · Duke still needs review`
          : `Calendar: 9/10 Decide-first → ${busiestDayRatioLabel(10)} Risk · Towson & Duke still need review`,
        nextLabel: isTowson ? "Review Duke next →" : "Review Towson next →",
        nextAction: onNext,
      })
      setF8Annotation({
        text: isTowson
          ? `Towson approved · ${busiestDayRatioLabel(10)}`
          : `Hopkins approved · ${busiestDayRatioLabel(10)}`,
        tone: "approve",
      })
      setCurrentFrame("F7")
    },
    [primaryRows, isMedStarWorkflow, activeScenario],
  )

  const applyHold = useCallback(
    (requestId: string, school: string, reason: HoldReason, onReturn: () => void) => {
      setHoldIds((prev) => new Map(prev).set(requestId, reason))
      if (isMedStarWorkflow && activeScenario) {
        setOutcome(
          buildScenarioOutcome("hold", requestId, school, primaryRows, activeScenario, {
            reason,
            onNext: onReturn,
          }) as WorkflowOutcome,
        )
        setF8Annotation({ text: `${school.split(" - ")[0]} on hold`, tone: "hold" })
        setCurrentFrame("F7")
        return
      }
      const ratio = busiestDayRatioLabel(hopkinsApproved ? 10 : 9)
      setOutcome({
        type: "hold",
        requestId,
        school,
        reason,
        remainingActive: primaryRows.length,
        continueCompareIds: primaryRows.map((r) => r.id),
        consequenceLead: "No capacity change.",
        consequenceDetail: "Request stays in queue — competitors unchanged.",
        impactTitle: "What stayed the same",
        impactRows: [
          { school: "Wed Oct 15", slots: 0, status: "—", effect: `${ratio} (unchanged)`, effectTone: "muted" },
          {
            school: "Johns Hopkins",
            slots: 1,
            status: hopkinsApproved ? "Approved" : "Review",
            effect: hopkinsApproved ? "No change" : "Still recommended first",
            effectTone: "muted",
          },
          { school: "Duke", slots: 2, status: "Pending", effect: "Unchanged", effectTone: "muted" },
          { school: "Cluster", slots: 0, status: "—", effect: "3 need decision", effectTone: "muted" },
        ],
        calendarDelta: `Calendar shows hold posture · ${ratio} unchanged`,
        nextLabel: hopkinsApproved ? "Return to compare →" : "Review Johns Hopkins →",
        nextAction: onReturn,
      })
      setF8Annotation({ text: `${school.split(" ")[0]} on hold · no capacity change`, tone: "hold" })
      setCurrentFrame("F7")
    },
    [hopkinsApproved, primaryRows, isMedStarWorkflow, activeScenario],
  )

  const applyDecline = useCallback(
    (requestId: string, school: string, reason: DeclineReason, onReturn: () => void) => {
      setDeclinedIds((prev) => new Set(prev).add(requestId))
      if (isMedStarWorkflow && activeScenario) {
        const remainingAfter = primaryRows.filter((r) => r.id !== requestId)
        setOutcome(
          buildScenarioOutcome("decline", requestId, school, primaryRows, activeScenario, {
            reason,
            onNext: onReturn,
          }) as WorkflowOutcome,
        )
        setF8Annotation({
          text: `1 request declined · ${remainingAfter.length} still need review`,
          tone: "decline",
        })
        setCurrentFrame("F7")
        return
      }
      const slots = requestId === USABILITY_FIXTURE_IDS.towson ? 3 : 1
      const ratio = busiestDayRatioLabel(hopkinsApproved ? 10 : 9)
      const remainingAfter = primaryRows.filter((r) => r.id !== requestId)
      setOutcome({
        type: "decline",
        requestId,
        school,
        reason,
        remainingActive: remainingAfter.length,
        continueCompareIds: remainingAfter.map((r) => r.id),
        consequenceLead: `${slots} slot${slots === 1 ? "" : "s"} released from this request.`,
        consequenceDetail: `No change to approved placements on Wed Oct 15 (${ratio}).`,
        impactTitle: "What changed for others",
        impactRows: [
          {
            school: "Duke",
            slots: 2,
            status: "Pending",
            effect: "Headroom improved",
            effectTone: "default",
          },
          {
            school: "Johns Hopkins",
            slots: 1,
            status: hopkinsApproved ? "Approved" : "Review",
            effect: hopkinsApproved ? "No change" : "Still recommended first",
            effectTone: "muted",
          },
          {
            school: "Villanova",
            slots: 2,
            status: "Approved",
            effect: "No change",
            effectTone: "muted",
          },
        ],
        calendarDelta: `Calendar shows ${ratio} · fewer active requests in compare`,
        nextLabel: "Review Duke next →",
        nextAction: onReturn,
      })
      setF8Annotation({ text: `${school.split(" ")[0]} declined · ${slots} slots released`, tone: "decline" })
      setCurrentFrame("F7")
    },
    [hopkinsApproved, primaryRows, isMedStarWorkflow, activeScenario],
  )

  const value = useMemo<WorkflowPrototypeContextValue>(
    () => ({
      enabled,
      facilitatorMode,
      baseRows,
      effectiveRows,
      surfaceSnapshot,
      hopkinsApproved,
      approvedIds,
      declinedIds,
      holdIds,
      outcome,
      continueBanner,
      f8Annotation,
      clusterPulse,
      currentFrame,
      setCurrentFrame,
      dismissContinueBanner,
      dismissF8Annotation,
      clearOutcome,
      applyApprove,
      applyHold,
      applyDecline,
      showContinueBanner,
      isRequestDeclined,
      isRequestOnHold,
      getDetailVariant,
      primaryRows,
      contextRows,
      activeCount,
      clusterLabel,
      activeScenario,
      setActiveScenario,
      isMedStarWorkflow,
      isFixtureFallback,
      getRecommendedAction,
    }),
    [
      enabled,
      facilitatorMode,
      baseRows,
      effectiveRows,
      surfaceSnapshot,
      hopkinsApproved,
      approvedIds,
      declinedIds,
      holdIds,
      outcome,
      continueBanner,
      f8Annotation,
      clusterPulse,
      currentFrame,
      dismissContinueBanner,
      dismissF8Annotation,
      clearOutcome,
      applyApprove,
      applyHold,
      applyDecline,
      showContinueBanner,
      isRequestDeclined,
      isRequestOnHold,
      getDetailVariant,
      primaryRows,
      contextRows,
      activeCount,
      clusterLabel,
      activeScenario,
      isMedStarWorkflow,
      isFixtureFallback,
      getRecommendedAction,
    ],
  )

  return (
    <WorkflowPrototypeContext.Provider value={value}>{children}</WorkflowPrototypeContext.Provider>
  )
}

export function useWorkflowPrototype(): WorkflowPrototypeContextValue {
  const ctx = useContext(WorkflowPrototypeContext)
  if (!ctx) {
    return {
      enabled: false,
      facilitatorMode: false,
      baseRows: [],
      effectiveRows: [],
      surfaceSnapshot: null,
      hopkinsApproved: false,
      approvedIds: new Set(),
      declinedIds: new Set(),
      holdIds: new Map(),
      outcome: null,
      continueBanner: null,
      f8Annotation: null,
      clusterPulse: false,
      currentFrame: "F1",
      setCurrentFrame: () => {},
      dismissContinueBanner: () => {},
      dismissF8Annotation: () => {},
      clearOutcome: () => {},
      applyApprove: () => {},
      applyHold: () => {},
      applyDecline: () => {},
      showContinueBanner: () => {},
      isRequestDeclined: () => false,
      isRequestOnHold: () => false,
      getDetailVariant: () => "ready",
      primaryRows: [],
      contextRows: [],
      activeCount: 0,
      clusterLabel: "",
      activeScenario: null,
      setActiveScenario: () => {},
      isMedStarWorkflow: false,
      isFixtureFallback: false,
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
