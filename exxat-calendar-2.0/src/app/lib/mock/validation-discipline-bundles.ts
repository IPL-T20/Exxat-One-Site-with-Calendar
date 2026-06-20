/**
 * Curated discipline bundles for enterprise validation locations.
 * Each bundle reflects realistic multidisciplinary hospital units — not rotated lists.
 */
export type DisciplineKey = string

const d = (...keys: DisciplineKey[]) => keys

/** Single-discipline outpatient / specialty clinics */
export const CLINIC_SINGLE: Record<string, DisciplineKey> = {
  "CHF Clinic": "Nursing",
  "Anticoagulation Clinic": "Nursing",
  "Mammography Suite": "Radiologic Technology",
  "PET-CT Imaging": "Imaging",
  "Sleep Center": "Respiratory Therapy",
  "Infusion Center": "Nursing",
  "Wound Care Clinic": "Nursing",
  "Diabetes Education": "Dietetics",
  "Pulmonary Rehab": "Respiratory Therapy",
  "Hand Therapy": "OT",
  "Vestibular PT Lab": "PT",
  "Swallow Study Suite": "SLP",
  "Outpatient Pharmacy": "Pharmacy",
  "Employee Health": "Medical Assistant",
  "Community Outreach": "Social Work",
}

/** Med-surg / step-down units — 4–6 disciplines typical */
export const MED_SURG_BUNDLE = d(
  "Nursing",
  "Medical Surgical",
  "PT",
  "OT",
  "Social Work",
  "Respiratory Therapy",
)

/** ICU / critical care — 6–8 */
export const ICU_BUNDLE = d(
  "Nursing",
  "ICU",
  "Respiratory Therapy",
  "PT",
  "Pharmacy",
  "Medical Surgical",
  "Social Work",
)

/** Emergency / trauma — 8–10 */
export const EMERGENCY_BUNDLE = d(
  "Nursing",
  "Medical Surgical",
  "Respiratory Therapy",
  "Radiologic Technology",
  "Pharmacy",
  "Social Work",
  "PT",
  "Medical Assistant",
)

/** Women's & children's — 8–11 */
export const WOMENS_CHILDREN_BUNDLE = d(
  "Nursing",
  "Pediatrics",
  "Medical Surgical",
  "Social Work",
  "SLP",
  "Respiratory Therapy",
  "Pharmacy",
  "Medical Assistant",
)

/** Behavioral health pavilion — 8–12 */
export const BEHAVIORAL_BUNDLE = d(
  "Behavioral Health",
  "Psychology",
  "Counseling",
  "Social Work",
  "Nursing",
  "Medical Surgical",
  "Pharmacy",
  "Allied Health",
)

/** Perioperative complex — 7–10 */
export const PERIOP_BUNDLE = d(
  "Nursing",
  "Surgical Technology",
  "Medical Surgical",
  "Respiratory Therapy",
  "Pharmacy",
  "Medical Assistant",
  "Allied Health",
)

/** Imaging / diagnostics — 5–8 */
export const IMAGING_BUNDLE = d(
  "Radiologic Technology",
  "Sonography",
  "Imaging",
  "Nursing",
  "Medical Assistant",
  "Allied Health",
)

/** Rehab institute — 6–9 */
export const REHAB_BUNDLE = d(
  "PT",
  "OT",
  "SLP",
  "Nursing",
  "Psychology",
  "Social Work",
  "Medical Surgical",
)

/** Academic medical center mega-hub — 16–20 disciplines */
export const MEGA_HUB_BUNDLE = d(
  "Nursing",
  "Medical Surgical",
  "ICU",
  "PT",
  "OT",
  "SLP",
  "Respiratory Therapy",
  "Radiologic Technology",
  "Sonography",
  "Pharmacy",
  "Social Work",
  "Psychology",
  "Counseling",
  "Behavioral Health",
  "Pediatrics",
  "Surgical Technology",
  "Medical Assistant",
  "Dietetics",
  "Imaging",
  "Allied Health",
)

/** Cancer center — 12–16 */
export const ONCOLOGY_HUB_BUNDLE = d(
  "Nursing",
  "Medical Surgical",
  "Pharmacy",
  "Social Work",
  "Psychology",
  "Dietetics",
  "Radiologic Technology",
  "Imaging",
  "Respiratory Therapy",
  "PT",
  "OT",
  "Medical Assistant",
  "Allied Health",
  "Counseling",
)

/** Ambulatory / primary care — 4–6 */
export const AMBULATORY_BUNDLE = d(
  "Nursing",
  "Medical Assistant",
  "Social Work",
  "Pharmacy",
  "Allied Health",
  "Medical Surgical",
)

/** Extend a bundle to exactly `count` disciplines (deterministic, no duplicates). */
export function bundleOf(base: readonly DisciplineKey[], count: number): DisciplineKey[] {
  if (count <= base.length) return [...base.slice(0, count)]
  const extras: DisciplineKey[] = [
    "Allied Health",
    "Medical Assistant",
    "Counseling",
    "Psychology",
    "Dietetics",
    "Sonography",
    "Surgical Technology",
    "Imaging",
  ]
  const out = [...base]
  for (const e of extras) {
    if (out.length >= count) break
    if (!out.includes(e)) out.push(e)
  }
  return out.slice(0, count)
}
