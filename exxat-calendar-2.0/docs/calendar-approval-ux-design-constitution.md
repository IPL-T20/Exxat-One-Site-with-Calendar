# Calendar Approval UX Design Constitution

**Status:** Governance · Frozen for design cycle  
**Authority:** Accepted operating model, frame specs (F1, F3, F4/F5/F6, F7/F8), pre-usability review  
**Audience:** Product, Design, Engineering, Research  
**Purpose:** Prevent wireframes, components, interactions, copy, and prototype decisions from drifting away from the accepted operating model.

This document is **not** a design artifact. It is the **source of truth** for what may and may not change without evidence.

---

## SECTION A — Non-Negotiable Product Truths

### Experience paradigm

1. **Calendar-first.** The calendar is the home workspace. Coordinators navigate time; intelligence embeds in the calendar—it does not replace it.
2. **Month is the primary working surface.** Month view is where coordinators notice pressure, open clusters, and return after decisions.
3. **Zoom ladder:** Year → Month → Week → Day. Each level answers a different time-grain question. Month is default for approval work.
4. **Progressive disclosure.** Each layer answers one primary question. Deeper layers add new information or higher resolution—not duplicate prose.

### Competition and clustering

5. **Competition is based on shared capacity consumption, not visual overlap.** Two requests compete when they draw from the same capacity pool on at least one shared active day.
6. **Capacity is evaluated at the active-day level.** The atomic contest is capacity pool × active day × seat. Pressure surfaces on the **busiest day** in the commitment window.
7. **Clusters represent linked decisions, not grouped requests.** A cluster is a review group: requests that share schedule footprint and shared capacity coupling. Clusters are **not** availability buckets, shift groups, or visual pile convenience.
8. **Visual aggregation may change by zoom; semantic competition does not.** Cards may merge or split at zoom levels without changing who competes.

### Cognitive responsibility map

| Layer | Frame(s) | Role | Primary questions |
|-------|----------|------|-------------------|
| **Notice** | F1 (F2 Hover optional) | Where is pressure? What deserves investigation? | |
| **Understand** | F3 Intermediary | Why here? Why linked? Who competes? Who first? | |
| **Decide** | F4 / F5 / F6 Detail | Can I commit? Why? What if I approve? | |
| **Outcome + Context Refresh** | F7 Outcome · F8 Calendar | What did I do? What changed? What now? Did it land? | |

9. **F1 = Notice.** Calendar surface orients; it does not commit.
10. **F3 = Understand.** Compare linked decisions; no approve action.
11. **F4 / F5 / F6 = Decide.** Commitment intent; approve only here.
12. **F7 / F8 = Outcome + Context Refresh.** Post-decision closure and environmental truth.

### Decision Workspace, not Approval Workspace

13. **The product supports confident decision-making across all outcomes:** approve, hold, decline, and review another request first—not only confident approval.
14. **Detail optimizes pre-commitment for the approve path** (verdict, consequence preview, impact table).
15. **F7 / F8 complete hold, decline, and deferral confidence** (outcome summary, inverse/status-quo impact, calendar refresh). Negative-path consequence does not belong in Detail.

### Commitment model

16. **Every approval is a commitment:** a promise of placement capacity on specific active days, under published offerings, partner obligations, and operational reality.
17. **Three independent evaluation lenses converge into decision posture:** Capacity · Policy · Operations. They must never merge into one opaque score.
18. **Decision status (posture rail)** ≠ **request status (card fill).** Posture communicates what the coordinator should do; request status communicates workflow state.
19. **Busiest-day ratio** `{load}/{cap}` with grain label is the canonical cluster pressure signal—not total slots, not sidebar discipline cap alone.

### Flow contract

20. **Frozen path:** F1 Month → F3 Intermediary (Step 1 of 2) → F4/F5/F6 Detail (Step 2 of 2) → F7 Outcome → F8 Refresh.
21. **Predictability guarantees:** Same modal shell F3/F4/F5/F6; scroll preserved on back; approve only in Detail.

### Global layout tokens (frozen)

| Token | Value |
|-------|-------|
| Sidebar | 280px |
| KPI strip | 72px |
| Toolbar | 48px |
| Date header | 56px |
| Posture rail | 3px |
| Hover card | 300px |
| Modal (F3/Detail) | 1216 × min(920, 80vh), px 32 |
| Outcome modal (F7) | 720px |

### Posture colors (frozen)

| Posture | Color |
|---------|-------|
| Ready | Green |
| Risk | Amber |
| Hold | Blue |
| Blocked | Red |
| Decide first | Violet |

---

## SECTION B — Things Future Designers Must Never Do

### Clustering and competition

- Reintroduce **overlap-based clustering** (visual bar overlap as competition proxy).
- Treat clusters as **availability buckets**, shift groups, or discipline groups.
- Show **school names on cluster cards** (footprint identity only on surface).
- Allow **approve from F1 or F3**—commitment happens only in Detail.

### Capacity and duplication

- **Duplicate capacity calculations** in multiple layers (sidebar grid + verdict + lens + second consequence).
- Show **sidebar discipline cap** as equivalent to **cluster busiest-day ratio** without grain distinction.
- Merge Capacity, Policy, and Ops into a **single composite score or badge**.
- Present capacity as **request-total** instead of **active-day / busiest-day** grain.

### Status and identity

- **Mix decision status (posture rail) with request status (card fill)** on the same visual channel.
- Move **Request ID** into primary header or decision workflow—audit only.
- Surface **full submission field grids, comments threads, or history timelines** above impact in Detail.

### Layer violations

- Put **approval actions into F3** (compare is understand-only).
- Add **compare lists or triage tables into Detail** (decide-only).
- Require **F7 blocking modal for navigation-only** “review another first” (banner/strip only).
- **Celebrate only approve** in F7—hold, decline, and continue must have parallel structural weight.

### Copy and interaction anti-patterns

- Use **competitor jargon** instead of plain effect verbs (Would block · Would tighten · No change).
- Label clusters as **“grouped requests”** in user-facing copy.
- Default-expand **lenses, submission, or audit** in Detail on load.
- Introduce **second modal** for approve confirm when inline ack suffices.
- **Redesign calendar-first**, cluster model, or workflow in response to single-session usability noise.

---

## SECTION C — Required UX Invariants

Apply to every future screen, wireframe, prototype, and implementation.

### What must remain visible

| Layer | Must be visible |
|-------|-----------------|
| **F1** | Footprint identity (schedule lane); busiest-day ratio on clusters; posture rail; need-decision pressure; ↪ / ★ surrogates when sequence or partner applies |
| **F3** | Step 1 of 2; busiest-day ratio; competition count; sequence line; triage rows with school names; suggested CTA only |
| **Detail** | VerdictBand (sticky); decision sentence; three channels; actions; suggested; consequence (approve path); impact table; ack when risk/impact |
| **F7** | Outcome type; school; consequence summary; impact block; next action; calendar delta line |
| **F8** | Post-decision calendar state; posture rail update or explicit unchanged; ratio/count deltas where applicable |

### What must remain hidden (by default)

| Layer | Hidden until explicit expand |
|-------|------------------------------|
| **F1** | School names on clusters; full competitor lists; approve/decline |
| **F3** | Submission details; audit; lenses |
| **Detail** | Capacity / Policy / Ops lenses; submission; audit; Request ID in header |
| **F7** | Lenses; re-decision controls; submission grids |
| **All** | Engine internals; pool keys; footprint keys in primary UI |

### What must aggregate

- **Cluster card:** linked requests sharing footprint + capacity coupling; busiest-day load/cap; need-decision count; school count (number, not names).
- **F3 header:** competition framing (“N schools competing for M slots on shared days”).
- **F1 KPI:** portfolio-level need-decision counts (may differ grain from cluster ratio—must not imply equivalence).

### What must never aggregate

- **Decision posture across unrelated footprints** into one badge.
- **Capacity across non-shared active days** into one number without grain label.
- **Policy, Ops, and Capacity** into one verdict channel.
- **Approve consequences with hold/decline consequences** in the same pre-commitment block in Detail.

### Cross-zoom consistency

- **Semantic competition set** unchanged across Year / Month / Week / Day.
- **Posture rail meaning** unchanged across zoom levels.
- **Busiest-day grain label** present whenever ratio shown.
- **Decision status vs request status** distinction at every zoom.
- **Cluster = linked decisions** language consistent in tooltips, headers, and research scripts.

---

## SECTION D — Validation-Only Items

The following may change **only after usability evidence**. Do not “fix” in wireframes or prototype before Round 1 (and defined threshold for Round 2).

### P0 — Must validate

| ID | Assumption | Owner |
|----|------------|-------|
| A1 | Busiest-day ratio `54/10` paraphrased correctly (not sidebar cap, not “54 slots”) | F1 |
| A3 | ↪ / Decide first drives Hopkins-before-Towson without moderator hint | F1 → F4 |
| A5 | VerdictBand answers “Can I approve?” in &lt;3s without scroll | Detail |
| A6 | F4 disabled Approve read as sequence block, not broken UI | F4 |
| A9 | F7 completes hold/decline confidence without Detail additions | F7/F8 |

### P1 — Important

| ID | Assumption | Owner |
|----|------------|-------|
| A2 | Cluster understood as linked decisions, not grouped requests | F1 → F3 |
| A4 | F3 compare enables correct first-row choice | F3 |
| A7 | Consequence + Impact believed (not redundant with VerdictBand) | Detail |
| A8 | Ack checkbox read deliberately, not muscle-memory | Detail |
| A10 | F8 calendar refresh matches outcome mental model | F7/F8 |

### P2 — Nice to learn

- F7-Continue banner vs F3 strip for “review another first”
- Lens expand rate and trust vs VerdictBand
- ObjectNavigation (◀ n of m ▶) discoverability
- F8 ephemeral annotation read rate
- Sidebar `8/10` vs cluster `54/10` contradiction—facilitator documents; resolution deferred

### Known tensions (observe, do not resolve pre-test)

- Sidebar discipline cap vs cluster busiest-day ratio
- Pressure literacy vs action literacy on F1 cards
- VerdictBand + Suggested + Consequence perceived redundancy

---

## SECTION E — Architecture Change Threshold

No architecture change without meeting the evidence bar for that domain.

### Calendar-first paradigm

| Change | Evidence required |
|--------|-------------------|
| Replace calendar home with queue-first or console-first | **Multi-site study:** ≥2 programs, ≥12 coordinators, replicated finding that calendar-first fails primary tasks in ≥50% sessions; leadership sign-off |
| Demote Month as primary surface | Same as above + task-time regression on T1/T3 |

### Cluster model

| Change | Evidence required |
|--------|-------------------|
| Redefine cluster as overlap, availability, or shift bucket | **Engine + UX joint review;** corpus replay showing current model wrong in &gt;15% enterprise fixtures; usability no-go on A2 in ≥3/6 participants × 2 rounds |
| Show school names on cluster surface | A/B or ≥2 rounds: no regression on A2; cluster scan time not worse |

### Decision model (F1/F3/Detail/F7/F8)

| Change | Evidence required |
|--------|-------------------|
| Approve in F3 or F1 | **Forbidden** unless constitution amended: ≥2 rounds no-go on A5/A9 and executive product amendment |
| Merge Understand + Decide into one modal | ≥2 rounds: F3 skip rate &gt;50%; decision-confidence Likert &lt;3 avg |
| Move negative consequence into Detail | F7/F8 round fails A9 in ≥3/6 **and** F7-first fix validated in pilot before Detail change |

### Capacity model

| Change | Evidence required |
|--------|-------------------|
| Abandon active-day / busiest-day grain | Engine domain sign-off + coordinator paraphrase study: alternative grain improves A1 to ≥5/6 in 2 rounds |
| Single global cap number without grain | A1 failure ≥4/6 in 2 rounds with documented alternative |

### Workflow

| Change | Evidence required |
|--------|-------------------|
| Remove F3 compare step | ≥2 rounds: correct sequence ≥5/6 without F3; no increase in wrong-first-open |
| Add steps to commit path | Task-time increase &gt;25% without decision-confidence gain ≥0.5 Likert |
| Change F7/F8 outcome parity | A9 failure in Round 1—patch F7/F8 first; workflow change only if patch fails Round 2 |

### Default rule

**Single-participant confusion, single-session pushback, or internal stakeholder preference is insufficient** to amend this constitution.

---

## Design Review Checklist (One Page)

**Review type:** ☐ Wireframe ☐ Component ☐ Interaction ☐ Copy ☐ Prototype ☐ Implementation  
**Screen / frame:** _______________ **Reviewer:** _______________ **Date:** _______________

### A. Paradigm (all must pass)

- [ ] Calendar-first; Month primary unless explicitly Year/Week/Day task
- [ ] Zoom change does not alter semantic competition
- [ ] Progressive disclosure: layer answers one primary question

### B. Cognitive role (exactly one primary role per surface)

- [ ] F1/F2 = Notice only (no commit actions)
- [ ] F3 = Understand only (no approve/decline/hold)
- [ ] Detail = Decide only (no compare table; approve/modify/hold/decline here)
- [ ] F7/F8 = Outcome + refresh (no re-decision; all outcomes structurally represented)

### C. Cluster & competition

- [ ] Cluster = linked decisions, not grouped requests or overlap pile
- [ ] No school names on cluster card surface
- [ ] Busiest-day ratio includes grain label; not conflated with sidebar cap

### D. Capacity & lenses

- [ ] Capacity at active-day level; no duplicate cap math across layers
- [ ] Capacity | Policy | Ops remain three channels—never merged
- [ ] Decision status (rail) ≠ request status (fill)

### E. Visibility rules

- [ ] Required visible elements for this layer present (Section C)
- [ ] Lenses / submission / audit collapsed by default in Detail
- [ ] Request ID audit-only (not primary header)

### F. Decision Workspace

- [ ] Approve path: verdict + consequence + impact + ack when required
- [ ] Hold/decline/continue: F7/F8 carry consequence—not Detail duplication
- [ ] “Review another first” = navigation; no false commit

### G. Validation boundary

- [ ] No change to Section D items without research ticket + evidence
- [ ] Known tensions logged as “validate in testing,” not patched in review

### H. Constitution compliance

- [ ] No Section B violations
- [ ] If exception needed: link to evidence ticket and amendment approval

**Result:** ☐ Approved ☐ Approved with logged validation items ☐ Rejected — violates constitution

**Approver:** _______________

---

*End of Calendar Approval UX Design Constitution*
