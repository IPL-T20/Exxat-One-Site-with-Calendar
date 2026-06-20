import { useEffect, useMemo } from "react"
import {
  MEDSTAR_CALENDAR_FOCUS_DATE,
  useMedStarDataOptional,
} from "../lib/medstar-data/medstar-data-context"
import { applyUsabilityRowOverrides } from "../lib/mock/usability-fixture-alignment"
import { useMedStarReal } from "../lib/medstar-real/medstar-real-context"
import { MEDSTAR_FOCUS_DATE } from "../lib/medstar-real/types"
import type { SlotRequestRow } from "../lib/slot-requests-calendar/types"
import { useCalendarModel } from "./calendar/useCalendarModel"
import { SlotRequestsCalendarView } from "./SlotRequestsCalendarView"
import { useWorkflowPrototype } from "./calendar/usability-prototype/workflow-prototype-context"

export function SlotRequestsCalendarWorkspace({
  debugMedStar = false,
}: {
  debugMedStar?: boolean
}) {
  const proto = useWorkflowPrototype()
  const medstar = useMedStarReal()
  const medstarData = useMedStarDataOptional()

  const rows = debugMedStar
    ? medstar.effectiveRows
    : proto.enabled
      ? proto.effectiveRows
      : proto.baseRows

  const kpiRows: SlotRequestRow[] | undefined = useMemo(() => {
    if (debugMedStar || !medstarData?.isMedStarLoaded) return undefined
    return applyUsabilityRowOverrides(medstarData.allRows, {
      hopkinsApproved: false,
      approvedIds: proto.approvedIds,
      declinedIds: proto.declinedIds,
      holdIds: proto.holdIds,
    })
  }, [
    debugMedStar,
    medstarData?.isMedStarLoaded,
    medstarData?.allRows,
    proto.approvedIds,
    proto.declinedIds,
    proto.holdIds,
  ])

  const calendarModel = useCalendarModel(rows, {
    kpiRows,
    kpiReferenceDate:
      !debugMedStar && medstarData?.isMedStarLoaded
        ? MEDSTAR_CALENDAR_FOCUS_DATE
        : undefined,
  })

  useEffect(() => {
    if (!debugMedStar) return
    calendarModel.setZoom("month")
    calendarModel.setMode("approval")
    calendarModel.toggleAll()
  }, [debugMedStar, calendarModel])

  return (
    <SlotRequestsCalendarView
      model={calendarModel}
      debugMedStar={debugMedStar}
      focusDate={debugMedStar ? MEDSTAR_FOCUS_DATE : undefined}
    />
  )
}
