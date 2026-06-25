import { useEffect, useState, type RefObject } from "react"
import {
  computeSchedulesFlatVirtualWindow,
  type SchedulesFlatRowPlan,
  type SchedulesFlatVirtualWindow,
} from "./schedules-flat-view-virtualizer"

const INITIAL_WINDOW: SchedulesFlatVirtualWindow = {
  start: 0,
  end: 0,
  paddingTop: 0,
  paddingBottom: 0,
  totalCount: 0,
}

export function useSchedulesFlatViewVirtualizer(
  scrollRef: RefObject<HTMLElement | null>,
  plan: SchedulesFlatRowPlan | null,
  headerHeight: number,
): SchedulesFlatVirtualWindow | null {
  const [window, setWindow] = useState<SchedulesFlatVirtualWindow>(INITIAL_WINDOW)

  useEffect(() => {
    if (!plan) {
      setWindow(INITIAL_WINDOW)
      return
    }

    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const next = computeSchedulesFlatVirtualWindow(
        plan,
        el.scrollTop,
        el.clientHeight,
        headerHeight,
      )
      setWindow((prev) =>
        prev.start === next.start &&
        prev.end === next.end &&
        prev.paddingTop === next.paddingTop &&
        prev.paddingBottom === next.paddingBottom
          ? prev
          : next,
      )
    }

    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [scrollRef, plan, headerHeight])

  return plan ? window : null
}
