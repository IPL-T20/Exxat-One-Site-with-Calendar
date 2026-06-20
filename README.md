# Exxat One Site with Calendar

Full project workspace for the Exxat One Calendar 2.0 prototype — Mapple Health schedules, slot requests, and the React app.

## Contents

| Path | Description |
| --- | --- |
| `data/` | Source Excel datasets (schedules + slot requests) |
| `exxat-calendar-2.0/` | React/Vite application |

## Data files

- `data/Mapple_Health_Schedule_Dummy_Data.xlsx` — schedule source of truth
- `data/Mapple_Health_Slot_Request_Dummy_Data.xlsx` — slot request dataset

## Run the app

```bash
cd exxat-calendar-2.0
npm install
npm run dev
```

Open http://localhost:5176/schedules/list

## Rebuild schedule indexes

```bash
cd exxat-calendar-2.0
npm run build:schedule-index
npm run verify:schedule-index
```

The build reads `data/Mapple_Health_Schedule_Dummy_Data.xlsx` from the repo root automatically.

## Deploy to GitHub Pages

```bash
cd exxat-calendar-2.0
npm run deploy:pages
```
