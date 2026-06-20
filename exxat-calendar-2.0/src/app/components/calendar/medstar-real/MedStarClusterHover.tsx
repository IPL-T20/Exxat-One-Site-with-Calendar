import { createPortal } from "react-dom"
import { useMedStarReal } from "../../../lib/medstar-real/medstar-real-context"

export function MedStarClusterHover({
  rect,
}: {
  rect: DOMRect
}) {
  const medstar = useMedStarReal()
  if (!medstar.enabled) return null

  const h = medstar.hoverContent
  const cardW = 320
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - cardW / 2),
    window.innerWidth - cardW - 12,
  )
  const top = Math.max(12, rect.top - 8)

  return createPortal(
    <div
      className="fixed z-[100] pointer-events-none rounded-lg border border-border bg-popover text-popover-foreground shadow-xl w-[320px] overflow-hidden -translate-y-full"
      style={{ left, top }}
      role="tooltip"
    >
      <div className="px-3 py-2 border-b border-border bg-muted/30 text-[10px] text-muted-foreground">
        Compare requests · MedStar Health
      </div>
      <div className="p-3 space-y-3 text-sm max-h-80 overflow-y-auto">
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Why important?</p>
          <p className="mt-0.5">{h.whyImportant}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">What creates pressure?</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{h.pressureSource}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Schools</span>
            <p className="font-semibold tabular-nums">{h.schoolCount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">In progress</span>
            <p className="font-semibold tabular-nums">{h.activeCount}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Opens on click</p>
          <p className="mt-0.5 text-[#3F51B5] font-medium">{h.openAction}</p>
        </div>
        <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
          {h.unit} · {h.shift} · {h.dateSpan}
          <br />
          {h.slotTotals}
        </p>
      </div>
    </div>,
    document.body,
  )
}
