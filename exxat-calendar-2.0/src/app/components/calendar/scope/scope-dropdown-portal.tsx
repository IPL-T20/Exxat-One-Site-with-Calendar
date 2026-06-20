import { createPortal } from "react-dom"
import { useEffect, useLayoutEffect, useState } from "react"

export function ScopeDropdownPortal({
  open,
  anchorRef,
  panelRef,
  measureRef,
  onClose,
  width = 352,
  maxHeight = 420,
  align = "start",
  fitContent = false,
  minWidth = 352,
  children,
}: {
  open: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  panelRef: React.RefObject<HTMLElement | null>
  /** When fitContent, width is taken from this element (e.g. the tab row). */
  measureRef?: React.RefObject<HTMLElement | null>
  onClose: () => void
  width?: number
  maxHeight?: number
  align?: "start" | "end"
  fitContent?: boolean
  minWidth?: number
  children: React.ReactNode
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [resolvedWidth, setResolvedWidth] = useState(width)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return

    const update = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const vw = window.innerWidth
      let nextWidth = Math.min(width, vw - 16)

      if (fitContent && measureRef?.current) {
        nextWidth = Math.min(
          Math.max(measureRef.current.offsetWidth, minWidth),
          vw - 16,
        )
      }

      setResolvedWidth(nextWidth)

      const rect = anchor.getBoundingClientRect()
      const rawLeft = align === "end" ? rect.right - nextWidth : rect.left
      const left = Math.min(Math.max(8, rawLeft), vw - nextWidth - 8)
      setPos({ top: rect.bottom + 4, left })
    }

    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [open, anchorRef, measureRef, width, align, fitContent, minWidth, children])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open, onClose, anchorRef, panelRef])

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef as React.RefObject<HTMLDivElement>}
      className="rounded border border-gray-200 bg-white text-popover-foreground shadow-sm flex flex-col"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: fitContent ? resolvedWidth : resolvedWidth,
        maxHeight,
        zIndex: 9999,
      }}
      role="dialog"
      aria-modal="false"
    >
      {children}
    </div>,
    document.body,
  )
}
