/**
 * Schedules sidebar tree — three visual tiers.
 *
 * Surfaces (globals.css) — warm sand family:
 *   Department — `--schedules-sidebar-warm-base` (#faf3f0 light)
 *   Location   — darker same hue (`#efe5de` light)
 *   Schedule   — neutral card surface
 *
 * Typography differentiates nav rows (location, department) from schedule data rows.
 */
export const SCHEDULES_SIDEBAR_LEVEL = {
  location: {
    title: "text-[13px] font-semibold leading-tight tracking-tight text-foreground",
    kpiTone: "strong" as const,
  },
  department: {
    title: "text-[12px] font-semibold leading-tight text-foreground/80",
    kpiTone: "soft" as const,
  },
  schedule: {
    title: "text-[12px] font-semibold leading-snug text-foreground",
    meta: "text-[10px] font-normal leading-snug text-muted-foreground",
  },
} as const

export type SchedulesSidebarKpiTone =
  (typeof SCHEDULES_SIDEBAR_LEVEL)["location"]["kpiTone"]
