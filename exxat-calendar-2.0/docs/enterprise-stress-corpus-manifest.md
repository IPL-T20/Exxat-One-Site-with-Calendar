# Enterprise stress corpus — manifest

**Dataset:** `ENTERPRISE_STRESS_SLOT_REQUESTS` in `src/app/lib/mock/slot-requests-enterprise-stress.ts`  
**Load:** `?dataset=enterprise-stress` on Slot Requests (Calendar view recommended)  
**Capacity overrides:** Same module as enterprise — `enterprise-capacity-overrides.ts` (tags `[STRESS-*]` or `[ENT-*]`)

## Corpus profile (build-time)

| Metric | Target | Notes |
|--------|--------|-------|
| Total rows | ≥ 250 | **366** generated rows |
| Unique schools | ≥ 30 | **39** in `STRESS_SCHOOL_POOL` |
| Gold partner rows | 10–15% | ~**10%** (`partnerCategory === "Gold Partner"`) |
| Facilities | 6 | Union, MWHC, Franklin, SMMC, Rehab, Good Samaritan |
| Hot units | 8+ | 7E IMCU, 9E Med Surg/Tele, NICU, 2G ICU, 5E Oncology, 4H ICU, Behavioral Health, 5C Orthopedics |

## Scenario index

| Tag | Rows | Stresses |
|-----|------|----------|
| `STRESS-T-TRUE-COMP-FRI-55` | 55 | **50+ cluster**, true footprint competition (Fri · Day 12h) |
| `STRESS-T-TRUE-COMP-TTH-52` | 52 | **50+ cluster**, second pile (Tue/Thu · Day 12h) |
| `STRESS-T-CLUSTER-25-NICU` | 25 | **20+ cluster**, near-cap NICU |
| `STRESS-T-FALSE-SHIFT-DAY/NIGHT` | 20 | **False overlap** — same dates, different shift |
| `STRESS-T-FALSE-WEEKDAY-MWF/TTH` | 24 | **False overlap** — same shift, different weekdays |
| `STRESS-C-OVERBOOKED` | 16 | **Overbooked** approved + queue on 2G ICU (cap 6) |
| `STRESS-C-NEAR-CAP-NICU` | 28 | **Near capacity** (6/6 cap with pending) |
| `STRESS-G-GOLD-VS-NON` | 21 | **Gold vs non-Gold** on 4-cap BH unit |
| `STRESS-G-GOLD-VS-GOLD` | 9 | **Gold vs Gold** same Mon/Wed footprint |
| `STRESS-D-LARGE-VS-SMALL-*` | 31 | **10-slot group** vs 28×1-slot rivals |
| `STRESS-T-LONG-RUN` | 6 | Multi-year spans |
| `STRESS-T-SEQUENTIAL-A/B` | 6 | Back-to-back cohort handoffs |
| `STRESS-SE-FALL-SPIKE` | 40 | **Seasonal** Sep–Nov concentration |
| `STRESS-X-MIXED-STATES` | 24 | Approved / pending / review / declined / canceled |
| `STRESS-FILL-BACKGROUND` | 32 | Open units, multi-discipline spread |

## Ground-truth anchors (DecisionSnapshot)

| Unit | Nursing cap | Primary scenario |
|------|-------------|------------------|
| 7E IMCU | 8 | Fri Day pile 55 + approved baseline 8 slots |
| 9E Med Surg/Tele | 8 | TTh Day pile 52 |
| NICU | 6 | TTh cluster 25 + 6 approved |
| 2G Medical ICU | 6 | 12 approved slots (over) + 14 pending |
| Behavioral Health | 4 | Gold vs Gold / Gold vs non-Gold |
| 5E Medical Oncology | 10 | MWF vs TTh false overlap |
| 4H Burn/Trauma ICU | 6 | Day vs Night false overlap |
| 5C Orthopedics | derived | Large (10) vs small (1) slot fight |

## Validation checklist (after DecisionSnapshot UI wiring)

- [ ] Fri pile merges as **one footprint cluster**, not date-only pile with MWF/TTh
- [ ] Day vs Night on 4H ICU render as **separate cards** with Clear competition
- [ ] MWF vs TTh on 5E Oncology **do not** share competition class
- [ ] Row 7E shows **Exhausted/Overbooked** when forecast > 8
- [ ] Hover on Fri pile lead shows **headroomAfterApproval** negative for most
- [ ] Gold vs Gold BH list sorts ★ rows; headroom column shows single winner
- [ ] Large 10-slot ortho request shows **Contested/Over** vs 28 singles
- [ ] Year view bands show **month × footprint** demand, not isolated chips
