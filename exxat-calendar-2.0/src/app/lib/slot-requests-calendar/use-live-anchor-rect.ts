import { useLayoutEffect, useState } from "react"

/** Re-measure anchor while hovered — keeps hover cards aligned during scroll/resize. */
export function useLiveAnchorRect(
  anchorEl: HTMLElement | null | undefined,
): DOMRect | null {
  const [version, setVersion] = useState(0)

  useLayoutEffect(() => {
    if (!anchorEl) return

    const measure = () => setVersion((v) => v + 1)

    const scrollTargets = new Set<EventTarget>()
    let node: Element | null = anchorEl
    while (node) {
      scrollTargets.add(node)
      node = node.parentElement
    }
    scrollTargets.add(window)

    measure()
    scrollTargets.forEach((target) => {
      target.addEventListener("scroll", measure, { passive: true })
    })
    window.addEventListener("resize", measure, { passive: true })

    return () => {
      scrollTargets.forEach((target) => {
        target.removeEventListener("scroll", measure)
      })
      window.removeEventListener("resize", measure)
    }
  }, [anchorEl])

  if (!anchorEl) return null
  void version
  return anchorEl.getBoundingClientRect()
}
