# Project data

Source Excel workbooks for the Exxat One Site with Calendar prototype.

- **Mapple_Health_Schedule_Dummy_Data.xlsx** — authoritative schedule dataset
- **Mapple_Health_Slot_Request_Dummy_Data.xlsx** — slot request dataset

Regenerate app indexes from the schedule workbook:

```bash
cd exxat-calendar-2.0
npm run build:schedule-index
```
