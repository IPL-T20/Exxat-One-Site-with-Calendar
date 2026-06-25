# Mapple schedule data (single source of truth)

**Authoritative schedule file:** `../data/Mapple_Health_Schedule_Dummy_Data.xlsx` (repo root)  
**Authoritative slot request file:** `../data/Mapple_Health_Slot_Request_Dummy_Data.xlsx` (repo root)

## Regenerate runtime indexes

```bash
npm run build:schedule-index
npm run build:slot-request-index
npm run verify:schedule-index
npm run verify:slot-request-index
```

Schedule outputs:

- `public/mapple/manifest.json`
- `public/mapple/schedules.json`
- `public/mapple/schedules-by-month.json`
- `public/mapple/schedules-by-week.json`
- `public/mapple/schedules-by-day.json`

Slot request outputs:

- `public/mapple/slot-requests-manifest.json`
- `public/mapple/slot-requests.json`
- `public/mapple/slot-requests-by-month.json`
- `public/mapple/slot-requests-by-week.json`
- `public/mapple/slot-requests-by-day.json`

## Operational horizon (demo realism)

Site schedules are finalized ~3–4 weeks ahead. After reading the workbook, the build step normalizes every schedule that intersects **reference date → +14 days** so **~98%** are operationally **on-track** (Confirmed + Compliant, or Confirmed + Not Applicable — solid green calendar stripes). ~2% stay as deterministic exceptions so the **At risk** lens still has signal.

Constants: `src/app/lib/schedules/schedules-operational-horizon.ts`  
Reference date: `SCHEDULE_REFERENCE_DATE` env var (default `2026-06-18` in `scripts/build-schedule-index.mjs`).
