import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { useMedStarReal } from "../../../lib/medstar-real/medstar-real-context"
import type { CalendarModel } from "../useCalendarModel"

export function MedStarOutcomeModal({ model }: { model: CalendarModel }) {
  const medstar = useMedStarReal()
  const outcome = medstar.outcome

  if (!medstar.enabled || !outcome) return null

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) {
          medstar.clearOutcome()
          model.exitApprovalWorkflow()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Decision recorded</DialogTitle>
          <DialogDescription>{outcome.school}</DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium text-foreground py-2">{outcome.message}</p>
        <p className="text-xs text-muted-foreground">
          Calendar updated: {medstar.activeCount} in progress on Medical Surgical cluster.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            onClick={() => {
              medstar.clearOutcome()
              if (medstar.activeCount >= 2) {
                model.setApprovalCluster({
                  requestIds: medstar.primaryRows.map((r) => r.id),
                })
              } else {
                model.exitApprovalWorkflow()
              }
            }}
          >
            {medstar.activeCount >= 2 ? "Continue Compare" : "View Calendar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
