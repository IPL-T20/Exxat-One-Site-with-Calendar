import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import type { WorkflowOutcome } from "./workflow-prototype-context"

const OUTCOME_ICON: Record<WorkflowOutcome["type"], { glyph: string; title: string; className: string }> = {
  approve: { glyph: "✓", title: "Approved", className: "text-green-700" },
  hold: { glyph: "⏸", title: "On hold", className: "text-blue-700" },
  decline: { glyph: "✕", title: "Declined", className: "text-red-700" },
}

function effectClass(tone?: string) {
  if (tone === "destructive") return "text-red-700 font-medium"
  if (tone === "amber") return "text-amber-700 font-medium"
  if (tone === "muted") return "text-muted-foreground"
  return "font-medium"
}

export function WorkflowOutcomeModal({
  outcome,
  onClose,
  onViewCalendar,
  onContinueCompare,
}: {
  outcome: WorkflowOutcome | null
  onClose: () => void
  onViewCalendar: () => void
  onContinueCompare?: () => void
}) {
  if (!outcome) return null

  const icon = OUTCOME_ICON[outcome.type]
  const canContinue =
    (outcome.remainingActive ?? 0) >= 2 && Boolean(onContinueCompare)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[720px] w-[720px] p-8 gap-6">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className={`flex items-center gap-2 text-xl ${icon.className}`}>
            <span aria-hidden>{icon.glyph}</span>
            {icon.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {outcome.school}
            {outcome.reason ? ` · ${outcome.reason}` : ""}
          </p>
        </DialogHeader>

        <div className="space-y-1">
          <p className="text-sm font-semibold">{outcome.consequenceLead}</p>
          <p className="text-xs text-muted-foreground">{outcome.consequenceDetail}</p>
          {outcome.type === "hold" ? (
            <p className="text-xs text-muted-foreground pt-1">
              Hold does not free slots or advance other schools.
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {outcome.impactTitle}
          </h3>
          <ul className="space-y-2 text-sm">
            {outcome.impactRows.map((row) => (
              <li key={`${row.school}-${row.effect}`} className="flex justify-between gap-4">
                <span>
                  {row.school}
                  {row.slots > 0 ? ` (${row.slots})` : ""}
                </span>
                <span className={effectClass(row.effectTone)}>{row.effect}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-muted/25 px-4 py-3 space-y-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            What remains
          </h3>
          <p className="text-sm font-medium text-foreground">{outcome.calendarDelta}</p>
          <p className="text-xs text-muted-foreground">
            Your calendar updates when you close this — the cluster card reflects this change.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {canContinue ? (
            <Button onClick={() => { onContinueCompare!(); onClose() }}>Continue Compare</Button>
          ) : (
            <Button onClick={() => { outcome.nextAction(); onClose() }}>{outcome.nextLabel}</Button>
          )}
          <div className="flex gap-2">
            {!canContinue ? (
              <Button variant="secondary" onClick={onViewCalendar}>
                View on calendar
              </Button>
            ) : (
              <Button variant="secondary" onClick={onViewCalendar}>
                View Calendar
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {canContinue && outcome.remainingActive != null ? (
          <p className="text-xs text-muted-foreground">
            Calendar updated: {outcome.remainingActive} in progress on this cluster.
          </p>
        ) : null}

        <p className="text-[11px] text-muted-foreground font-mono">{outcome.requestId}</p>
      </DialogContent>
    </Dialog>
  )
}
