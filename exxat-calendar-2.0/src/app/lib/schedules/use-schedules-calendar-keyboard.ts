import { useCallback, useEffect, type RefObject } from "react"

const NAV_SELECTOR = '[data-schedules-kbd-target="nav"]'
const STRIPE_SELECTOR = '[data-schedules-kbd-target="stripe"]'
const ANY_TARGET = "[data-schedules-kbd-target]"

function orderedTargets(grid: HTMLElement): HTMLElement[] {
  return [...grid.querySelectorAll<HTMLElement>(ANY_TARGET)].filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
  )
}

function stripesInRow(grid: HTMLElement, rowId: string): HTMLElement[] {
  return [...grid.querySelectorAll<HTMLElement>(`${STRIPE_SELECTOR}[data-schedules-kbd-row="${rowId}"]`)].sort(
    (a, b) => a.offsetLeft - b.offsetLeft,
  )
}

/**
 * Schedules calendar — arrow-key navigation across sidebar rows and timeline stripes.
 * Enter activates the focused control; Escape is handled by the caller.
 */
export function useSchedulesCalendarKeyboard({
  enabled,
  gridRef,
  onEscape,
}: {
  enabled: boolean
  gridRef: RefObject<HTMLElement | null>
  onEscape: () => void
}) {
  const moveVertical = useCallback(
    (direction: 1 | -1) => {
      const grid = gridRef.current
      if (!grid) return
      const targets = orderedTargets(grid)
      if (targets.length === 0) return

      const active = document.activeElement as HTMLElement | null
      let idx = active ? targets.indexOf(active) : -1
      if (idx === -1) {
        targets[direction === 1 ? 0 : targets.length - 1]?.focus()
        return
      }
      targets[idx + direction]?.focus()
    },
    [gridRef],
  )

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      const grid = gridRef.current
      if (!grid) return

      const target = e.target as HTMLElement | null
      const inGrid = target != null && grid.contains(target)
      if (!inGrid && target !== grid) return

      if (e.key === "Escape") {
        onEscape()
        return
      }

      if (!inGrid) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        moveVertical(1)
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        moveVertical(-1)
        return
      }

      if (target?.dataset.schedulesKbdTarget !== "stripe") return

      const rowId = target.dataset.schedulesKbdRow
      if (!rowId) return

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault()
        const inRow = stripesInRow(grid, rowId)
        const idx = inRow.indexOf(target)
        const next = e.key === "ArrowRight" ? inRow[idx + 1] : inRow[idx - 1]
        next?.focus()
        return
      }

      if (e.key === "Home") {
        e.preventDefault()
        orderedTargets(grid)[0]?.focus()
        return
      }

      if (e.key === "End") {
        e.preventDefault()
        const targets = orderedTargets(grid)
        targets[targets.length - 1]?.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [enabled, gridRef, moveVertical, onEscape])
}
