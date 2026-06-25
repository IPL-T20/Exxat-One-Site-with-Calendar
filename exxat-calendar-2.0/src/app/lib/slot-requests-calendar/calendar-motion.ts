/** Scroll / period navigation behavior — instant when user prefers reduced motion. */
export function preferredCalendarScrollBehavior(): ScrollBehavior {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return "auto"
  }
  return "smooth"
}
