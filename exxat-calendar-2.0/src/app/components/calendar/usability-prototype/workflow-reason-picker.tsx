import { Button } from "../../ui/button"

export function WorkflowReasonPicker({
  title,
  reasons,
  onConfirm,
  onCancel,
}: {
  title: string
  reasons: readonly string[]
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  return (
    <div className="shrink-0 border-t border-border bg-muted/20 px-8 py-4 space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">
        {reasons.map((reason) => (
          <Button key={reason} size="sm" variant="secondary" onClick={() => onConfirm(reason)}>
            {reason}
          </Button>
        ))}
      </div>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
