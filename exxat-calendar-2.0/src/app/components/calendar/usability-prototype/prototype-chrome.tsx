import { useEffect } from "react"
import { useWorkflowPrototype } from "./workflow-prototype-context"

export function PrototypeFrameIndicator() {
  const { enabled, facilitatorMode, currentFrame } = useWorkflowPrototype()
  if (!enabled || !facilitatorMode) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] rounded-md border border-border bg-background/95 px-3 py-1.5 text-xs font-mono shadow-md"
      aria-label={`Prototype frame ${currentFrame}`}
    >
      {currentFrame}
    </div>
  )
}

export function WorkflowContinueBanner() {
  const { enabled, continueBanner, dismissContinueBanner } = useWorkflowPrototype()
  if (!enabled || !continueBanner) return null

  return (
    <div
      className="shrink-0 flex items-center justify-between gap-4 border-b border-violet-200 bg-violet-50 px-8 py-2 text-sm"
      role="status"
    >
      <div className="flex items-center gap-2 text-violet-900">
        <span aria-hidden>↪</span>
        <span>
          <span className="font-medium">Continuing review</span>
          <span className="text-violet-800"> · {continueBanner}</span>
        </span>
      </div>
      <button
        type="button"
        className="text-xs font-medium text-violet-700 hover:underline"
        onClick={dismissContinueBanner}
      >
        Dismiss
      </button>
    </div>
  )
}

export function F8AnnotationToast() {
  const { enabled, f8Annotation, dismissF8Annotation } = useWorkflowPrototype()

  useEffect(() => {
    if (!f8Annotation) return
    const t = window.setTimeout(dismissF8Annotation, 6000)
    return () => window.clearTimeout(t)
  }, [f8Annotation, dismissF8Annotation])

  if (!enabled || !f8Annotation) return null

  const toneClass =
    f8Annotation.tone === "approve"
      ? "border-green-200 bg-green-50 text-green-900"
      : f8Annotation.tone === "hold"
        ? "border-blue-200 bg-blue-50 text-blue-900"
        : f8Annotation.tone === "decline"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-violet-200 bg-violet-50 text-violet-900"

  return (
    <div
      className={`fixed bottom-4 left-4 z-[60] max-w-md rounded-md border px-4 py-2 text-sm shadow-md ${toneClass}`}
      role="status"
    >
      {f8Annotation.text}
    </div>
  )
}
