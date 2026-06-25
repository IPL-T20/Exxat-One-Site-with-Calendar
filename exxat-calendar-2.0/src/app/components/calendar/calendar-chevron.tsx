import { FontAwesomeIcon, type FontAwesomeIconName } from "../font-awesome-icon"
import { cn } from "../ui/utils"

/**
 * Calendar arrow glyphs — one Font Awesome family, five semantic use cases.
 *
 * | Use            | Icon                         | Control pattern                          |
 * |----------------|------------------------------|------------------------------------------|
 * | nav            | chevron-left / chevron-right | Sequential prev/next (pair w/ aria-label)|
 * | disclosure     | chevron-down / chevron-up    | Popover/menu trigger (aria-haspopup)     |
 * | expand         | chevron-right / chevron-down | In-place tree row (aria-expanded)        |
 * | bulk-toggle    | chevron-down / chevron-up    | Expand-all / collapse-all bulk action    |
 * | affordance     | chevron-right (small)        | Decorative drill-in hint on tappable row |
 *
 * Hierarchical “back to parent view” uses {@link CalendarBackIcon} (angle-left), not chevrons.
 */

type NavChevron = { use: "nav"; direction: "left" | "right"; className?: string }
type DisclosureChevron = { use: "disclosure"; open?: boolean; className?: string }
type ExpandChevron = { use: "expand"; open: boolean; className?: string }
type BulkToggleChevron = { use: "bulk-toggle"; expanded: boolean; className?: string }
type AffordanceChevron = { use: "affordance"; className?: string }

export type CalendarChevronProps =
  | NavChevron
  | DisclosureChevron
  | ExpandChevron
  | BulkToggleChevron
  | AffordanceChevron

const CHEVRON_STYLE = {
  nav: "size-3.5 shrink-0 text-foreground",
  disclosure: "size-2.5 shrink-0 text-muted-foreground",
  expand: "size-3 shrink-0 text-muted-foreground",
  bulkToggle: "size-3 shrink-0 text-muted-foreground",
  affordance: "size-2.5 shrink-0 text-muted-foreground opacity-80",
} as const

function resolveChevron(props: CalendarChevronProps): {
  name: FontAwesomeIconName
  style: string
} {
  switch (props.use) {
    case "nav":
      return {
        name: props.direction === "left" ? "chevronLeft" : "chevronRight",
        style: CHEVRON_STYLE.nav,
      }
    case "disclosure":
      return {
        name: props.open ? "chevronUp" : "chevronDown",
        style: CHEVRON_STYLE.disclosure,
      }
    case "expand":
      return {
        name: props.open ? "chevronDown" : "chevronRight",
        style: CHEVRON_STYLE.expand,
      }
    case "bulk-toggle":
      return {
        name: props.expanded ? "chevronUp" : "chevronDown",
        style: CHEVRON_STYLE.bulkToggle,
      }
    case "affordance":
      return { name: "chevronRight", style: CHEVRON_STYLE.affordance }
  }
}

/** Decorative — meaning comes from the labelled control that wraps this icon. */
export function CalendarChevron(props: CalendarChevronProps) {
  const { name, style } = resolveChevron(props)
  return (
    <FontAwesomeIcon
      name={name}
      className={cn(style, props.className)}
      aria-hidden
    />
  )
}

/** Hierarchical back — angle-left for “return to parent view”, not sequential prev/next. */
export function CalendarBackIcon({ className }: { className?: string }) {
  return (
    <FontAwesomeIcon
      name="angleLeft"
      className={cn("size-3.5 shrink-0 text-muted-foreground", className)}
      aria-hidden
    />
  )
}
