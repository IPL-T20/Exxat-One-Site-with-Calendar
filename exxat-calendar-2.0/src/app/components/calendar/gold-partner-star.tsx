import type { ReactNode } from "react"

/**
 * Gold partner marker — light-gold circle + dark-gold star.
 *
 * App-wide geometry rule (all usages go through GoldPartnerStar):
 * - Star rendered diameter = 80% of circle diameter
 * - Star centered horizontally and vertically inside the circle (flex + symmetric SVG path)
 */
const GOLD_CIRCLE_TINT = "color-mix(in oklch, var(--chart-4) 32%, var(--background))"
const GOLD_STAR_DARK = "color-mix(in oklch, var(--chart-4) 72%, black)"

export const GOLD_PARTNER_BORDER = GOLD_STAR_DARK

/** Star diameter as a fraction of the enclosing circle — do not override per call site. */
export const GOLD_STAR_IN_CIRCLE_RATIO = 0.8

/** Combined circle+star height as a fraction of adjacent text font-size. */
const TEXT_HEIGHT_RATIO = 0.9

const GOLD_STAR_VIEWBOX = 100

function buildCenteredStarPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points = 5,
): string {
  const segments: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = -Math.PI / 2 + (i * Math.PI) / points
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    segments.push(`${i === 0 ? "M" : "L"}${x.toFixed(3)} ${y.toFixed(3)}`)
  }
  return `${segments.join(" ")} Z`
}

/** Symmetric star path — outer tips span 80% of the viewBox (matches GOLD_STAR_IN_CIRCLE_RATIO). */
const GOLD_STAR_PATH = buildCenteredStarPath(
  GOLD_STAR_VIEWBOX / 2,
  GOLD_STAR_VIEWBOX / 2,
  (GOLD_STAR_VIEWBOX / 2) * GOLD_STAR_IN_CIRCLE_RATIO,
  (GOLD_STAR_VIEWBOX / 2) * GOLD_STAR_IN_CIRCLE_RATIO * 0.39,
)

export type GoldPartnerStarSize = "xs" | "sm" | "md" | "lg"

const EM_SCALE: Record<GoldPartnerStarSize, number> = {
  /** Dense chips and table cells */
  xs: 0.85,
  /** Inline with text-xs labels — full cap height */
  sm: 1,
  md: TEXT_HEIGHT_RATIO,
  lg: 1,
}

export const GOLD_PARTNER_INLINE_GAP = "gap-[0.35em]"

/** Toolbar filter + ribbon — same circle size as “Gold partners only” checkbox row. */
export const GOLD_PARTNER_FILTER_LABEL_CLASS = "text-xs leading-none"
export const GOLD_PARTNER_FILTER_STAR_SIZE: GoldPartnerStarSize = "sm"

export function GoldPartnerStar({
  size = "md",
  className = "",
}: {
  size?: GoldPartnerStarSize
  className?: string
}) {
  const scale = EM_SCALE[size]
  const starSize = `${GOLD_STAR_IN_CIRCLE_RATIO * 100}%`

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-full box-border leading-none ${className}`}
      style={{
        width: `${scale}em`,
        height: `${scale}em`,
        backgroundColor: GOLD_CIRCLE_TINT,
        border: `1px solid ${GOLD_STAR_DARK}`,
        color: GOLD_STAR_DARK,
      }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${GOLD_STAR_VIEWBOX} ${GOLD_STAR_VIEWBOX}`}
        fill="currentColor"
        style={{
          width: starSize,
          height: starSize,
          display: "block",
        }}
        aria-hidden
      >
        <path d={GOLD_STAR_PATH} />
      </svg>
    </span>
  )
}

export function GoldPartnerLeading({
  size = "md",
  className = "",
  children,
}: {
  size?: GoldPartnerStarSize
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center ${GOLD_PARTNER_INLINE_GAP} min-w-0 ${className}`}
    >
      <GoldPartnerStar size={size} />
      {children}
    </span>
  )
}

export function GoldPartnerStarsInline({
  count,
  size = "md",
  maxVisible = 2,
}: {
  count: number
  size?: GoldPartnerStarSize
  /** @deprecated kept for API compat */
  compactThreshold?: number
  maxVisible?: number
}) {
  if (count <= 0) return null
  const visible = Math.min(count, maxVisible)
  return (
    <span className="inline-flex items-center gap-[0.1em] flex-shrink-0 align-middle leading-none">
      {Array.from({ length: visible }, (_, i) => (
        <GoldPartnerStar key={i} size={size} />
      ))}
    </span>
  )
}
