# Project data

Source Excel workbooks for the Exxat One Site with Calendar prototype.

- **Mapple_Health_Schedule_Dummy_Data.xlsx** — authoritative schedule dataset
- **Mapple_Health_Slot_Request_Dummy_Data.xlsx** — authoritative slot request dataset

## Location hierarchy (XLSX → calendar sidebar)

**Pick location and department directly from these workbook columns:**

| UI level | Slot request column | Schedule column |
| --- | --- | --- |
| **Location** (master — expand to see departments) | `Location (Level 1)` | `Location` |
| **Department** (child under location) | `Department/Unit (Level 2)` | `Department` |
| **Unit** (optional detail in lists) | `Department/Unit (Level 3)` | `Unit` |

Example: `Mapple Behavioral Health Center` (location) → `Behavioral Health` (department).

`Behavioral Health` is a **department** value in `Department/Unit (Level 2)`, not a location. The location is `Mapple Behavioral Health Center`.

Regenerate app indexes:

```bash
cd exxat-calendar-2.0
npm run build:schedule-index
npm run build:slot-request-index
```
