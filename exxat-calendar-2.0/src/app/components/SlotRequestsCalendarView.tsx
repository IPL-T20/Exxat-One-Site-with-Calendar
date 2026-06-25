import { useEffect, useRef } from "react"
import { USABILITY_FIXTURE_FOCUS_DATE } from "../lib/mock/usability-fixture-alignment"
import {
  MEDSTAR_CALENDAR_FOCUS_DATE,
  useMedStarDataOptional,
} from "../lib/medstar-data/medstar-data-context"
import { defaultViewportScrollLeft } from "../lib/slot-requests-calendar/calendar-timeline"
import type { CalendarModel } from "./calendar/useCalendarModel"
import {
  CalendarDetailPanel,
  CalendarKpiStrip,
  CalendarToolbar,
} from "./calendar/calendar-shell"
import { ApprovalClusterModal, ApprovalRequestDetailModal } from "./calendar/approval-request-modal"
import { AvailabilityDetailModal } from "./calendar/availability-detail-modal"
import { ConceptCodaTimeline } from "./calendar/concept-coda"
import { ConceptPlannerTimeline } from "./calendar/concept-planner"
import {
  F8AnnotationToast,
  PrototypeFrameIndicator,
} from "./calendar/usability-prototype/prototype-chrome"
import { WorkflowOutcomeModal } from "./calendar/usability-prototype/workflow-outcome-modal"
import { useWorkflowPrototype } from "./calendar/usability-prototype/workflow-prototype-context"
import { MedStarCompareModal } from "./calendar/medstar-real/MedStarCompareModal"
import { MedStarDecideModal } from "./calendar/medstar-real/MedStarDecideModal"
import { MedStarOutcomeModal } from "./calendar/medstar-real/MedStarOutcomeModal"

function WorkflowOutcomeLayer({ model }: { model: CalendarModel }) {
  const proto = useWorkflowPrototype()

  return (
    <WorkflowOutcomeModal
      outcome={proto.outcome}
      onClose={() => {
        proto.clearOutcome()
        model.exitApprovalWorkflow()
      }}
      onViewCalendar={() => {
        proto.clearOutcome()
        model.exitApprovalWorkflow()
      }}
      onContinueCompare={() => {
        const ids = proto.outcome?.continueCompareIds ?? proto.primaryRows.map((r) => r.id)
        const scenarioId =
          proto.outcome?.scenarioId ?? proto.activeScenario?.id ?? undefined
        proto.clearOutcome()
        if (ids.length >= 2) {
          model.setApprovalCluster({ requestIds: ids, scenarioId })
        } else {
          model.exitApprovalWorkflow()
        }
      }}
    />
  )
}

export function SlotRequestsCalendarView({
  model,
  debugMedStar = false,
  focusDate,
}: {
  model: CalendarModel
  debugMedStar?: boolean
  focusDate?: Date
}) {
  const proto = useWorkflowPrototype()
  const medstarData = useMedStarDataOptional()
  const didScrollFixture = useRef(false)

  useEffect(() => {
    if (didScrollFixture.current || model.timelineWidth <= 0) return
    const scrollTarget = debugMedStar
      ? focusDate
      : medstarData?.isMedStarLoaded
        ? MEDSTAR_CALENDAR_FOCUS_DATE
        : proto.enabled
          ? USABILITY_FIXTURE_FOCUS_DATE
          : null
    if (!scrollTarget) return
    const el = model.scrollRef.current
    if (!el) return
    el.scrollTo({
      left: defaultViewportScrollLeft(
        model.zoom,
        model.timelineWidth,
        model.todayX,
        model.ppd,
        model.monthPxW,
        scrollTarget,
      ),
      behavior: "auto",
    })
    didScrollFixture.current = true
  }, [
    debugMedStar,
    focusDate,
    medstarData?.isMedStarLoaded,
    proto.enabled,
    model.zoom,
    model.ppd,
    model.monthPxW,
    model.timelineWidth,
    model.scrollRef,
  ])

  useEffect(() => {
    if (
      proto.enabled &&
      !debugMedStar &&
      !model.approvalCluster &&
      !model.approvalDetailRequestId &&
      !proto.outcome
    ) {
      proto.setCurrentFrame("F1")
    }
  }, [
    debugMedStar,
    proto.enabled,
    model.approvalCluster,
    model.approvalDetailRequestId,
    proto.outcome,
    proto.setCurrentFrame,
  ])

  return (
    <div
      className="flex flex-col min-h-0 flex-1 bg-background text-foreground"
      aria-label="Slot requests placement calendar"
    >
        <CalendarKpiStrip model={model} />
        <CalendarToolbar model={model} />

        {model.mode === "approval" && <ConceptCodaTimeline model={model} debugMedStar={debugMedStar} />}
        {model.mode === "operations" && <ConceptPlannerTimeline model={model} />}

        {model.mode === "operations" && <CalendarDetailPanel model={model} />}
        {model.mode === "approval" && (
          <>
            {debugMedStar ? (
              <>
                <MedStarCompareModal model={model} />
                <MedStarDecideModal model={model} />
                <MedStarOutcomeModal model={model} />
              </>
            ) : (
              <>
                <AvailabilityDetailModal model={model} />
                <ApprovalClusterModal model={model} />
                <ApprovalRequestDetailModal model={model} />
                {proto.enabled ? (
                  <>
                    <WorkflowOutcomeLayer model={model} />
                    <F8AnnotationToast />
                    <PrototypeFrameIndicator />
                  </>
                ) : null}
              </>
            )}
          </>
        )}
    </div>
  )
}
