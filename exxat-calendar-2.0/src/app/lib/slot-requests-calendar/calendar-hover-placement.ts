export type HoverPlacementSide = "right" | "left" | "above" | "below"

export type CalendarHoverPlacement = {
  left: number
  top: number
  transform?: string
  side: HoverPlacementSide
  /** Caret offset from card left (above/below) or card top (right/left). */
  caretOffset: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Intersect scroll-root band with the browser viewport — card must fit on screen. */
export function visibleCardTopBounds(
  scrollRoot: HTMLElement | null,
  cardH: number,
  pad = 12,
): { minCardTop: number; maxCardTop: number } {
  if (!scrollRoot) {
    return { minCardTop: pad, maxCardTop: Math.max(pad, window.innerHeight - cardH - pad) }
  }

  const rootRect = scrollRoot.getBoundingClientRect()
  const visTop = Math.max(pad, rootRect.top + pad)
  const visBottom = Math.min(window.innerHeight - pad, rootRect.bottom - pad)
  const maxCardTopViewport = Math.max(visTop, visBottom - cardH)

  return {
    minCardTop: scrollRoot.scrollTop + (visTop - rootRect.top),
    maxCardTop: scrollRoot.scrollTop + (maxCardTopViewport - rootRect.top),
  }
}

function clampCardCenterY(
  desiredCenterY: number,
  cardH: number,
  minCardTop: number,
  maxCardTop: number,
): { centerY: number; caretOffset: number } {
  const cardTop = clamp(desiredCenterY - cardH / 2, minCardTop, maxCardTop)
  const centerY = cardTop + cardH / 2
  return {
    centerY,
    caretOffset: clamp(desiredCenterY - cardTop, 14, cardH - 14),
  }
}

function clampCardTop(
  desiredTop: number,
  minCardTop: number,
  maxCardTop: number,
): number {
  return clamp(desiredTop, minCardTop, maxCardTop)
}

type PlacementBounds = {
  minCardTop: number
  maxCardTop: number
  viewLeft: number
  viewRight: number
  gap: number
}

function placeBesideAnchor(
  side: "right" | "left",
  anchorLeft: number,
  anchorRight: number,
  anchorCenterY: number,
  cardW: number,
  cardH: number,
  bounds: PlacementBounds,
): CalendarHoverPlacement | null {
  const { minCardTop, maxCardTop, viewLeft, viewRight, gap } = bounds

  const cardLeft =
    side === "right" ? anchorRight + gap : anchorLeft - gap - cardW

  if (cardLeft < viewLeft || cardLeft > viewRight) return null

  const { centerY, caretOffset } = clampCardCenterY(
    anchorCenterY,
    cardH,
    minCardTop,
    maxCardTop,
  )

  return {
    left: cardLeft,
    top: centerY,
    transform: "translateY(-50%)",
    side,
    caretOffset,
  }
}

function placeAboveBelow(
  anchorTop: number,
  anchorBottom: number,
  centerX: number,
  cardW: number,
  cardH: number,
  bounds: PlacementBounds,
  preferBelow: boolean,
): CalendarHoverPlacement {
  const { minCardTop, maxCardTop, viewLeft, viewRight, gap } = bounds
  const left = clamp(centerX - cardW / 2, viewLeft, Math.max(viewLeft, viewRight))

  const belowTop = clampCardTop(anchorBottom + gap, minCardTop, maxCardTop)
  const aboveTop = clampCardTop(anchorTop - gap - cardH, minCardTop, maxCardTop)

  const belowSpace = maxCardTop - belowTop
  const aboveSpace = aboveTop - minCardTop
  const belowFits = belowSpace >= 0 && belowTop + cardH <= maxCardTop + cardH
  const aboveFits = aboveSpace >= 0

  const useBelow =
    preferBelow && belowFits
      ? true
      : !preferBelow && aboveFits
        ? false
        : belowFits && !aboveFits
          ? true
          : aboveFits && !belowFits
            ? false
            : belowTop <= aboveTop

  if (useBelow) {
    return {
      left,
      top: belowTop,
      side: "below",
      caretOffset: clamp(centerX - left - 6, 16, cardW - 28),
    }
  }

  return {
    left,
    top: aboveTop + cardH,
    transform: "translateY(-100%)",
    side: "above",
    caretOffset: clamp(centerX - left - 6, 16, cardW - 28),
  }
}

/** Viewport placement for calendar stripe hover cards. */
export function computeCalendarHoverPlacement(
  anchor: DOMRect,
  cardW: number,
  estimatedCardH = 280,
): CalendarHoverPlacement {
  const pad = 12
  const gap = 8
  const cardH = estimatedCardH
  const { minCardTop, maxCardTop } = visibleCardTopBounds(null, cardH, pad)
  const viewLeft = pad
  const viewRight = window.innerWidth - cardW - pad

  const visibleLeft = Math.max(anchor.left, viewLeft)
  const visibleRight = Math.min(anchor.right, window.innerWidth - pad)
  const centerX =
    visibleRight > visibleLeft
      ? (visibleLeft + visibleRight) / 2
      : anchor.left + anchor.width / 2

  const anchorCenterY = anchor.top + anchor.height / 2
  const bounds: PlacementBounds = {
    minCardTop,
    maxCardTop,
    viewLeft,
    viewRight,
    gap,
  }

  const right = placeBesideAnchor(
    "right",
    anchor.left,
    anchor.right,
    anchorCenterY,
    cardW,
    cardH,
    bounds,
  )
  if (right) return right

  const left = placeBesideAnchor(
    "left",
    anchor.left,
    anchor.right,
    anchorCenterY,
    cardW,
    cardH,
    bounds,
  )
  if (left) return left

  const spaceBelow = window.innerHeight - anchor.bottom - gap - pad
  const spaceAbove = anchor.top - gap - pad
  return placeAboveBelow(
    anchor.top,
    anchor.bottom,
    centerX,
    cardW,
    cardH,
    bounds,
    spaceBelow >= spaceAbove,
  )
}

export type ScrollRootAnchorRect = {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
}

/** Map a viewport anchor rect into scroll-container content coordinates. */
export function anchorRectInScrollRoot(
  anchor: DOMRect,
  scrollRoot: HTMLElement,
): ScrollRootAnchorRect {
  const rootRect = scrollRoot.getBoundingClientRect()
  const left = anchor.left - rootRect.left + scrollRoot.scrollLeft
  const top = anchor.top - rootRect.top + scrollRoot.scrollTop
  return {
    left,
    top,
    width: anchor.width,
    height: anchor.height,
    right: left + anchor.width,
    bottom: top + anchor.height,
  }
}

/**
 * Place hover card beside the hovered stripe when possible — avoids covering
 * adjacent rows; clamps fully inside the visible window (no card scroll).
 */
export function computeCalendarHoverPlacementInScrollRoot(
  anchor: DOMRect,
  scrollRoot: HTMLElement,
  cardW: number,
  estimatedCardH = 280,
): CalendarHoverPlacement {
  const pad = 12
  const gap = 8
  const cardH = estimatedCardH
  const rootRect = scrollRoot.getBoundingClientRect()
  const anchorInRoot = anchorRectInScrollRoot(anchor, scrollRoot)

  const { minCardTop, maxCardTop } = visibleCardTopBounds(scrollRoot, cardH, pad)
  const viewLeft = scrollRoot.scrollLeft + pad
  const viewRight = scrollRoot.scrollLeft + scrollRoot.clientWidth - cardW - pad

  const visibleAnchorLeft = Math.max(anchor.left, rootRect.left + pad)
  const visibleAnchorRight = Math.min(anchor.right, rootRect.right - pad)
  const centerXContent =
    (visibleAnchorLeft + visibleAnchorRight) / 2 -
    rootRect.left +
    scrollRoot.scrollLeft

  const anchorCenterY = anchorInRoot.top + anchorInRoot.height / 2
  const bounds: PlacementBounds = {
    minCardTop,
    maxCardTop,
    viewLeft,
    viewRight,
    gap,
  }

  const right = placeBesideAnchor(
    "right",
    anchorInRoot.left,
    anchorInRoot.right,
    anchorCenterY,
    cardW,
    cardH,
    bounds,
  )
  if (right) return right

  const left = placeBesideAnchor(
    "left",
    anchorInRoot.left,
    anchorInRoot.right,
    anchorCenterY,
    cardW,
    cardH,
    bounds,
  )
  if (left) return left

  const anchorBottomInView = anchor.bottom - rootRect.top
  const anchorTopInView = anchor.top - rootRect.top
  const visBottom = Math.min(window.innerHeight - pad, rootRect.bottom - pad)
  const visTop = Math.max(pad, rootRect.top + pad)
  const spaceBelow = visBottom - anchor.bottom - gap
  const spaceAbove = anchor.top - visTop - gap

  return placeAboveBelow(
    anchorInRoot.top,
    anchorInRoot.bottom,
    centerXContent,
    cardW,
    cardH,
    bounds,
    spaceBelow >= spaceAbove,
  )
}
