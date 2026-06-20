import type { ReactNode } from "react"
import { FontAwesomeIcon } from "./font-awesome-icon"
import { cn } from "./ui/utils"

/** Shared pill segment track — gray recessed track, white active chip. */
export function ToolbarSegmentTrack({
  children,
  className,
  size = "default",
  "aria-label": ariaLabel,
}: {
  children: ReactNode
  className?: string
  size?: "default" | "sm"
  "aria-label"?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-lg bg-gray-100 p-0.5 gap-0.5",
        size === "sm" && "h-8",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ToolbarSegmentButton({
  active,
  onClick,
  icon,
  label,
  compact,
  size = "default",
  className,
}: {
  active: boolean
  onClick: () => void
  icon?: string
  label: string
  /** @deprecated prefer size="sm" */
  compact?: boolean
  size?: "default" | "sm"
  className?: string
}) {
  const sm = size === "sm" || compact

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-md font-['Roboto'] font-medium capitalize transition-all duration-150 whitespace-nowrap",
        sm ? "h-7 px-2.5 text-xs gap-1" : "px-3 py-1.5 text-xs gap-1.5",
        active
          ? "bg-white text-[#3F51B5] shadow-sm"
          : "text-gray-500 hover:text-gray-700",
        className,
      )}
    >
      {icon ? (
        <FontAwesomeIcon
          name={icon}
          className={cn("flex-shrink-0", compact ? "size-3" : "size-3.5")}
          aria-hidden
        />
      ) : null}
      {label}
    </button>
  )
}
