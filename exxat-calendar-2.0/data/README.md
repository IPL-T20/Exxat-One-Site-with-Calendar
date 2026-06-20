# Mapple schedule data (single source of truth)

**Authoritative file:** `Mapple_Health_Schedule_Dummy_Data.xlsx`

All schedule records for the Schedules hub (Overview, List, Calendar, Report) are generated from this workbook. Do not hand-edit `public/mapple/*.json`.

## Regenerate runtime indexes

```bash
npm run build:schedule-index
npm run verify:schedule-index
```

Outputs:

- `public/mapple/manifest.json`
- `public/mapple/schedules.json` — 2,000 schedule entities (`Schedules` sheet)
- `public/mapple/schedules-by-month.json` — month rollups (`Month` sheet)
- `public/mapple/schedules-by-week.json` — week rollups (`Week` sheet)
- `public/mapple/schedules-by-day.json` — day rollups (`Day` sheet)

Override source path: `MAPPLE_SCHEDULE_XLSX=/path/to/file.xlsx npm run build:schedule-index`

## Operational horizon (demo realism)

Site schedules are finalized ~3–4 weeks ahead. After reading the workbook, the build step normalizes every schedule that intersects **reference date → +14 days** so **~98%** are operationally **on-track** (Confirmed + Compliant, or Confirmed + Not Applicable — solid green calendar stripes). ~2% stay as deterministic exceptions so the **At risk** lens still has signal.

Constants: `src/app/lib/schedules/schedules-operational-horizon.ts`  
Reference date: `SCHEDULE_REFERENCE_DATE` env var (default `2026-06-18` in `scripts/build-schedule-index.mjs`).
