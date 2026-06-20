import { Button } from "../../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip"
import { USABILITY_FIXTURE_IDS } from "../../../lib/mock/usability-prototype-rows"

type DetailVariant = "decide-first" | "ready" | "approve-with-risk"

const VARIANT_COPY: Record<
  DetailVariant,
  {
    sentence: string
    capacity: string
    policy: string
    ops: string
    suggested: string
    approveEnabled: boolean
    approveTooltip?: string
  }
> = {
  "decide-first": {
    sentence: "DECIDE JOHNS HOPKINS FIRST",
    capacity: "Capacity ✓ 0 left on busiest Wed",
    policy: "Policy ⚠ sequence",
    ops: "Ops ✓",
    suggested: "Open Johns Hopkins first, then return to this request.",
    approveEnabled: false,
    approveTooltip: "Decide Johns Hopkins first",
  },
  ready: {
    sentence: "READY TO APPROVE",
    capacity: "Capacity ✓ 0 left on busiest Wed",
    policy: "Policy ✓",
    ops: "Ops ✓",
    suggested: "Approve — no other partner blocks this request.",
    approveEnabled: true,
  },
  "approve-with-risk": {
    sentence: "APPROVE WITH RISK",
    capacity: "Capacity ✓ 0 left on busiest Wed",
    policy: "Policy ✓",
    ops: "Ops ✓",
    suggested: "Approve with risk — 0 left on busiest Wed; Duke would block.",
    approveEnabled: true,
  },
}

export function WorkflowVerdictBand({
  variant,
  medstarMode = false,
  ackChecked,
  onAckChange,
  showAck,
  onApprove,
  onModify,
  onHold,
  onDecline,
  onOpenHopkins,
}: {
  variant: DetailVariant
  medstarMode?: boolean
  ackChecked: boolean
  onAckChange: (v: boolean) => void
  showAck: boolean
  onApprove: () => void
  onModify: () => void
  onHold: () => void
  onDecline: () => void
  onOpenHopkins?: () => void
}) {
  const copy = VARIANT_COPY[variant]
  const sentence = medstarMode
    ? variant === "approve-with-risk"
      ? "APPROVE WITH RISK"
      : "READY TO REVIEW"
    : copy.sentence
  const suggested = medstarMode
    ? variant === "approve-with-risk"
      ? "Higher-priority requests remain in this scenario — review before approving."
      : "Recommended action supported by compare order — not a backend rule."
    : copy.suggested

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-8 py-4 space-y-3">
      <p className="text-base font-semibold tracking-tight">{sentence}</p>
      <p className="text-sm text-foreground leading-snug">{suggested}</p>
      {!medstarMode ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{copy.capacity}</span>
          <span>{copy.policy}</span>
          <span>{copy.ops}</span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {copy.approveEnabled ? (
          <Button size="sm" onClick={onApprove} disabled={showAck && !ackChecked}>
            Approve
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button size="sm" disabled>
                  Approve
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{copy.approveTooltip}</TooltipContent>
          </Tooltip>
        )}
        <Button size="sm" variant="secondary" onClick={onModify}>
          Modify
        </Button>
        <Button size="sm" variant="secondary" onClick={onHold}>
          Hold
        </Button>
        <Button size="sm" variant="outline" className="text-destructive" onClick={onDecline}>
          Decline
        </Button>
      </div>
      {variant === "decide-first" && onOpenHopkins ? (
        <button
          type="button"
          className="text-sm font-medium text-violet-700 hover:underline"
          onClick={onOpenHopkins}
        >
          Open Johns Hopkins →
        </button>
      ) : null}
      {showAck ? (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={ackChecked}
            onChange={(e) => onAckChange(e.target.checked)}
            className="rounded border-border"
          />
          I understand this recommendation and its consequence
        </label>
      ) : null}
    </div>
  )
}

export function WorkflowDetailSections({
  variant,
  hideSupportAccordions = false,
}: {
  variant: DetailVariant
  hideSupportAccordions?: boolean
}) {
  const copy = VARIANT_COPY[variant]
  const showConsequence = variant !== "decide-first"
  const before = variant === "approve-with-risk" ? 10 : 9
  const after = 10

  return (
    <div className="divide-y divide-border">
      {showConsequence ? (
        <section className="px-8 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Consequence if you approve
          </h3>
          <p className="text-sm font-semibold mb-2">Wed Oct 15</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
            <div
              className={`h-full rounded-full ${after >= 10 ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${(after / 10) * 100}%` }}
            />
          </div>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {before}/10 → {after}/10
          </p>
          <p className="text-xs text-muted-foreground mt-1">Busiest day in this commitment window</p>
        </section>
      ) : (
        <section className="px-8 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Consequence if you approve
          </h3>
          <p className="text-sm text-muted-foreground">
            Unavailable until sequence resolved — open Johns Hopkins first.
          </p>
        </section>
      )}

      <section className="px-8 py-4">
        <h3 className="text-sm font-semibold mb-3">If you approve, these change</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-muted-foreground border-b border-border">
              <th className="text-left py-2 font-medium">School</th>
              <th className="text-left py-2 font-medium">Slots</th>
              <th className="text-left py-2 font-medium">Status</th>
              <th className="text-left py-2 font-medium">Effect</th>
            </tr>
          </thead>
          <tbody>
            {variant === "decide-first" ? (
              <tr className="border-b border-border">
                <td className="py-2">Johns Hopkins</td>
                <td className="py-2 tabular-nums">1</td>
                <td className="py-2">Review</td>
                <td className="py-2 text-violet-700 font-medium">Decide first</td>
              </tr>
            ) : variant === "ready" ? (
              <>
                <tr className="border-b border-border">
                  <td className="py-2">Towson</td>
                  <td className="py-2 tabular-nums">3</td>
                  <td className="py-2">Pending</td>
                  <td className="py-2 text-amber-700 font-medium">Would tighten</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">Duke</td>
                  <td className="py-2 tabular-nums">2</td>
                  <td className="py-2">Pending</td>
                  <td className="py-2 text-red-700 font-medium">Would block</td>
                </tr>
                <tr>
                  <td className="py-2">Villanova</td>
                  <td className="py-2 tabular-nums">2</td>
                  <td className="py-2">Approved</td>
                  <td className="py-2 text-muted-foreground">No change</td>
                </tr>
              </>
            ) : (
              <>
                <tr className="border-b border-border">
                  <td className="py-2">Duke</td>
                  <td className="py-2 tabular-nums">2</td>
                  <td className="py-2">Pending</td>
                  <td className="py-2 text-red-700 font-medium">Would block</td>
                </tr>
                <tr>
                  <td className="py-2">Johns Hopkins</td>
                  <td className="py-2 tabular-nums">1</td>
                  <td className="py-2">Approved</td>
                  <td className="py-2 text-muted-foreground">No change</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      {hideSupportAccordions ? null : (
        <section className="px-8 py-3 space-y-1">
          {["Capacity", "Policy", "Operations", "Submission", "Audit"].map((label) => (
            <details key={label} className="group">
              <summary className="text-sm text-muted-foreground cursor-pointer py-2 list-none flex items-center gap-2">
                <span className="text-xs" aria-hidden>
                  ▸
                </span>
                {label}
                {label === "Audit" ? (
                  <span className="text-[11px] font-mono ml-auto">{USABILITY_FIXTURE_IDS.hopkins}</span>
                ) : null}
              </summary>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}
