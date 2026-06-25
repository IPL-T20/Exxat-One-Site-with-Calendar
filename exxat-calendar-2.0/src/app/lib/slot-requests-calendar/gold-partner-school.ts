/** Anonymous gold-partner designation — ~5% of schools, stable across reloads. */
export const GOLD_PARTNER_SCHOOL_RATE = 0.05

export const GOLD_PARTNER_CATEGORY_LABEL = "Gold Partner"

/** Institution key — strip program / track suffix after first " - ". */
export function goldPartnerSchoolKey(school: string): string {
  const trimmed = school.trim()
  if (!trimmed) return ""
  const dash = trimmed.indexOf(" - ")
  const base = dash > 0 ? trimmed.slice(0, dash) : trimmed
  return base.toLowerCase().replace(/\s+/g, " ")
}

function hashSchoolKey(key: string): number {
  let hash = 2166136261
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Deterministic ~5% of unique school institutions. */
export function isAnonymizedGoldPartnerSchool(school: string): boolean {
  const key = goldPartnerSchoolKey(school)
  if (!key) return false
  const bucket = hashSchoolKey(key) % 10_000
  return bucket < GOLD_PARTNER_SCHOOL_RATE * 10_000
}

export function isGoldPartnerEntity(entity: {
  school: string
  partnerCategory?: string | null
}): boolean {
  const cat = (entity.partnerCategory ?? "").toLowerCase()
  if (cat.includes("gold partner")) return true
  return isAnonymizedGoldPartnerSchool(entity.school)
}

export function resolveGoldPartnerCategory(
  school: string,
  existingCategory?: string | null,
): string {
  if (isAnonymizedGoldPartnerSchool(school)) return GOLD_PARTNER_CATEGORY_LABEL
  return existingCategory?.trim() ?? ""
}
