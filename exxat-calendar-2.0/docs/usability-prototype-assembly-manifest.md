# Usability Prototype Assembly Manifest

**Status:** Assembled · Constitution-governed  
**Dataset:** `?dataset=usability-prototype`  
**Launch:** Slot Requests → Calendar view (auto-opens for usability dataset)  
**Fixture:** MedStar · Behavioral Health · OT · Oct 2026 · R-1041 Hopkins · R-1042 Towson · R-1043 Duke · R-1044 Villanova

---

## Assembly summary

| Frame | Surface | Prototype path | Status |
|-------|---------|----------------|--------|
| F1 | Month calendar | `ConceptCodaTimeline` + cluster card | Assembled · violations flagged |
| F2 | Hover (optional) | `ApprovalHoverCard` | Present · not in critical path |
| F3 | Intermediary compare | `ApprovalClusterModal` | Assembled · violations flagged |
| F4 | Detail · Decide first | `WorkflowDetailModal` · Towson variant | Assembled |
| F5 | Detail · Ready | `WorkflowDetailModal` · Hopkins variant | Assembled |
| F6 | Detail · Approve with risk | `WorkflowDetailModal` · Towson post-Hopkins | Assembled |
| F7 | Outcome confirmation | `WorkflowOutcomeModal` + `WorkflowContinueBanner` | Assembled |
| F8 | Calendar refresh | `F8AnnotationToast` + frame return to F1 | Partial · violations flagged |

---

## Per-frame constitution map

### F1 — Notice

**Constitution sections:** A §1–4, 9, 19–20 · C visible/hidden · B (no approve on surface)

**Assumptions validated:** A1 (ratio literacy) · A2 (cluster = linked decisions) · A3 (↪ / decide first)

**Checklist at risk:**
- [ ] **C** Busiest-day ratio with grain label on cluster
- [ ] **C** Posture rail distinct from request fill
- [ ] **D** Sidebar `approved/cap` vs cluster ratio contradiction (P2 — observe only)

**Flagged violations (do not fix pre-test):**
| Violation | Section B / C | Notes |
|-----------|---------------|-------|
| Cluster ratio may not show `54/10` busiest-day label | C | Engine-derived `totalSlotDemand/cap` on card; grain label incomplete |
| Sidebar shows discipline `8/10` not busiest-day | D | Known tension A1 |
| ↪ / decide-first surrogate may be low salience | A3 | Depends on `buildCardDisplay` density |
| KPI strip grain differs from cluster | C | Portfolio aggregate — constitution allows if not implied equivalent |

---

### F2 — Hover (optional)

**Constitution sections:** A §4, 9 · C hidden rules

**Assumptions validated:** None critical (P2)

**Checklist at risk:** None P0

**Flagged violations:**
| Violation | Notes |
|-----------|-------|
| Hover shows headroom per request | Acceptable surrogate; not in task battery |

---

### F3 — Understand

**Constitution sections:** A §10, 20 · B (no approve) · C visible F3

**Assumptions validated:** A2 · A4 (correct row choice)

**Checklist at risk:**
- [ ] **B** No approve/decline/hold in F3
- [ ] **C** Step 1 of 2 · competition framing · sequence line

**Flagged violations:**
| Violation | Section | Notes |
|-----------|---------|-------|
| Sequence violet line not in header | C | Spec calls for explicit “Decide Johns Hopkins first” line — **missing in prototype**; validate A4 with triage rank + “Review first” chip only |
| Busiest-day `54/10` not in F3 header | C | Header uses engine `totalSlotDemand/cap` |
| Competition line “3 schools competing for 10 slots” | C | Partial — uses `formatClusterPressureLine` |

**Implemented aligned:**
- Eyebrow: `Compare linked decisions · Step 1 of 2`
- Footer CTA: `Open suggested request →`
- No commit actions

---

### F4 / F5 / F6 — Decide

**Constitution sections:** A §11, 13–18, 20–21 · B · C Detail visible/hidden · F Decision Workspace

**Assumptions validated:** A5 (VerdictBand) · A6 (F4 not broken) · A7 (impact trust) · A8 (ack)

**Checklist at risk:**
- [ ] **F** Verdict + consequence + impact + ack
- [ ] **E** Lenses / submission / audit collapsed
- [ ] **B** Request ID audit-only

**Flagged violations:**
| Violation | Section | Notes |
|-----------|---------|-------|
| Lenses are empty `<details>` stubs | C | Collapsed by default — OK; expand shows no panel body |
| Modify panel not wired | P2 | Button present · no inline sub-panel |
| Legacy path (non-usability dataset) still shows Request ID in header | B | Usability path removes ID from header |
| Legacy path duplicates capacity in Detail body | B | Usability path uses `WorkflowDetailSections` only |

**Implemented aligned (usability dataset only):**
- Sticky `WorkflowVerdictBand`
- F4 disabled Approve + Open Hopkins link
- F5/F6 ack gate
- Impact table with Effect verbs
- Hold / Decline reason pickers → F7

---

### F7 — Outcome

**Constitution sections:** A §12, 15 · B (all outcomes · no re-decide) · C F7 visible

**Assumptions validated:** A9 (hold/decline confidence)

**Checklist at risk:**
- [ ] **F** Hold/decline/approve parallel structure
- [ ] **B** No lenses or re-decision

**Flagged violations:**
| Violation | Notes |
|-----------|-------|
| Continue uses banner not modal | Constitution allows banner for review-another-first |
| Outcome impact is fixture copy not live engine | Acceptable for usability — validate comprehension not math |

**Implemented aligned:**
- Approve · Hold · Decline modals (720px)
- Consequence summary + impact block + calendar delta + next action
- Hold status-quo line explicit

---

### F8 — Refresh

**Constitution sections:** A §12 · C F8 · F environmental truth

**Assumptions validated:** A10 (calendar matches outcome)

**Checklist at risk:**
- [ ] **F** Post-decision calendar state visible

**Flagged violations:**
| Violation | Notes |
|-----------|-------|
| Calendar objects do not mutate on approve/decline/hold | **Major** — F8 is annotation + frame indicator only; cluster card fill/rail/count not wired to prototype state |
| Declined rows filtered from F3 only | Partial refresh |
| `clusterPulse` not rendered on card | Continue ↪ pulse missing on surface |
| Ratio `51/10` after decline not reflected on F1 card | Validate A10 with facilitator script + F7 copy |

**Implemented aligned:**
- Ephemeral F8 annotation toast (6s)
- Modal stack closes to calendar on F7 Close
- Frame indicator returns to F1
- Scroll/zoom preserved

---

## Critical path flows (facilitator)

```
F1  Scan month → click BH OT cluster
F3  Compare linked decisions → Open suggested request (Hopkins) OR open Towson (wrong-path test)
F4  Towson · Decide first · Open Johns Hopkins →
F5  Hopkins · Ready · ack · Approve → F7 → Review Towson next
F6  Towson · Approve with risk · ack · Approve → F7
F7  Hold or Decline variant from F5/F6 → F8 annotation
F8  Return to F1 · observe annotation · re-open cluster
```

**URL:** `/slot-requests?dataset=usability-prototype` (switch to Calendar tab if needed)

---

## P0 validation ownership

| Assumption | Frame | Prototype coverage |
|------------|-------|-------------------|
| A1 Ratio literacy | F1 | Partial — flag in session |
| A3 Sequence | F1→F4 | F4 Open Hopkins wired |
| A5 VerdictBand | F4/F5/F6 | Wired |
| A6 F4 not broken | F4 | Disabled + tooltip |
| A9 F7 negative path | F7/F8 | Wired · F8 visual gap flagged |

---

## Files added / touched

| File | Role |
|------|------|
| `lib/mock/usability-prototype-rows.ts` | Frozen fixture |
| `lib/mock/slot-requests-datasets.ts` | `usability-prototype` dataset |
| `usability-prototype/workflow-prototype-context.tsx` | Outcome state |
| `usability-prototype/workflow-verdict-band.tsx` | F4/F5/F6 |
| `usability-prototype/workflow-outcome-modal.tsx` | F7 |
| `usability-prototype/prototype-chrome.tsx` | Frame badge · banner · F8 toast |
| `approval-request-modal.tsx` | Workflow detail branch |
| `SlotRequestsListView.tsx` | Provider + default calendar |
| `SlotRequestsCalendarView.tsx` | F7 layer + F1 frame |

---

## Pre-session checklist

- [ ] Load `?dataset=usability-prototype`
- [ ] Confirm frame indicator shows F1 on load
- [ ] Confirm cluster opens F3
- [ ] Confirm F4 path: Towson before Hopkins
- [ ] Confirm F7 fires on approve / hold / decline
- [ ] Log F8 visual gap in facilitator notes — do not patch before Round 1
- [ ] Constitution checklist printed for observers

---

*Violations flagged here are validation items, not assembly blockers, unless Constitution Section E threshold is met post-test.*
