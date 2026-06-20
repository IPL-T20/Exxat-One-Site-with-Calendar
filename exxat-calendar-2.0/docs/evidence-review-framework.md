# Evidence Review Framework

**Status:** Governance · Frozen for Round 1 interpretation  
**Authority:** Calendar Approval UX Design Constitution · Usability Prototype Assembly Manifest · Pre-Usability Review  
**Audience:** Product, Design, Research, Engineering leadership  
**Purpose:** Interpret Round 1 results consistently. Prevent premature redesign from isolated participant feedback.

**This document does not authorize changes.** It defines what evidence means and what threshold is required before any change class is considered.

---

## Interpretation rules (apply to every review)

1. **Single-participant behavior is observation, not verdict.** One wrong paraphrase, one “bug” comment, or one skipped screen is a data point — not a go/no-go signal.
2. **Self-reported confidence without task accuracy is weak evidence.** Likert scores alone cannot invalidate an assumption.
3. **Moderator-assisted success does not confirm an assumption.** Cues, hints, or explainers during task invalidate that task’s confirmatory weight.
4. **Post-task debrief recall counts.** Pre-commitment recall (Impact, F7) is stronger than agree/disagree survey responses.
5. **Violations flagged in the Assembly Manifest are expected test targets, not defects.** V1–V9 are hypotheses, not bugs, until this framework’s thresholds are met.
6. **Constitution §D items change only through evidence defined here.** No ad-hoc “quick fixes” between sessions without a completed Post-Session Review.

### Evidence strength ladder

| Tier | Definition | Weight |
|------|------------|--------|
| **S1 — Signal** | One participant, one task, qualitative quote | Log only |
| **S2 — Pattern** | Same failure mode in ≥2/6 participants on the same task | Weakens assumption |
| **S3 — Majority** | ≥4/6 participants fail the same measurable criterion | Weakens strongly; may warrant UI refinement review |
| **S4 — Consensus** | ≥5/6 fail, or ≥4/6 fail in two independent tasks for same root cause | Invalidates assumption for this cycle; triggers change-class review |
| **S5 — Replicated** | S4 finding reproduced in Round 2 with different participant mix OR corroborated by task accuracy + recall + behavior triad | Warrants workflow / Constitution / architecture review per thresholds below |

---

## Change-class thresholds (global)

| Change class | Minimum evidence required | Who decides | What may change |
|--------------|---------------------------|-------------|-----------------|
| **UI refinement** | S3 on a **screen-owned** assumption; fix is local (copy, order, visibility, affordance) and **does not violate Constitution §B** | Design lead + Research lead | Component, copy, default expand/collapse, tooltip, annotation |
| **Workflow refinement** | S4 on a **flow-owned** assumption; UI refinement attempted or ruled out as insufficient in review | Product + Design + Research | Step order, CTA routing, F7/F8 handoff, banner vs modal — **not** removing F3 or approve-from-Detail |
| **Constitution amendment** | S4 in Round 1 **and** S5 in Round 2 **OR** executive product decision with written amendment; must cite failed checklist items | Product leadership + Design leadership | §A truths, §B never-do list, §C invariants |
| **Architecture reconsideration** | Constitution §E bar met: multi-site or ≥12 coordinators, ≥2 rounds, ≥50% task failure on primary jobs, engine corpus contradiction >15% | Executive + Product + Engineering + Research | Calendar-first, cluster model, capacity engine, decision layer split |

**Default action when below S3:** Log finding → tag assumption → tag screen owner → **no build change** before Round 2.

---

## Assumption 1 — Capacity understanding

**Tests:** A1 (busiest-day ratio literacy) · Detail consequence/impact belief (A7) · F8 match (A10, capacity slice)

**Screen owners:** F1 · F3 · F4/F5/F6 · F7/F8

### Confirms
| Code | Evidence |
|------|----------|
| C-CAP-1 | ≥5/6 paraphrase cluster ratio as busiest-day / tightest-day pressure, not total slots or sidebar cap (T8) |
| C-CAP-2 | ≥5/6 correctly state Wed Oct 15 or “busiest day” when explaining approve consequence without moderator hint |
| C-CAP-3 | ≥4/6 cite capacity channel or consequence bar as basis for approve/hold/decline intent |
| C-CAP-4 | After F7 approve, ≥4/6 predict Wed Oct 15 at 10/10 without returning to Detail |

### Weakens
| Code | Evidence |
|------|----------|
| W-CAP-1 | 2–3/6 conflate sidebar `approved/cap` with cluster ratio but self-correct after one probe question |
| W-CAP-2 | ≥3/6 read ratio number correctly but cannot name the day grain without scrolling to consequence |
| W-CAP-3 | ≥3/6 distrust Impact numbers yet reach correct decision via VerdictBand alone |
| W-CAP-4 | F8 annotation accepted but participants look at F1 card for ratio confirmation (V4/V5 manifest flags) |

### Invalidates
| Code | Evidence |
|------|----------|
| I-CAP-1 | ≥4/6 consistently paraphrase ratio as total slots, “54 students,” or sidebar cap in T8 and approve reasoning |
| I-CAP-2 | ≥4/6 make incorrect capacity-based decisions (wrong approve/decline) traceable to ratio misunderstanding |
| I-CAP-3 | ≥4/6 cannot state what changed on busiest day after F7 approve when shown F7 summary |
| I-CAP-4 | S4 in Round 1 **and** S4 in Round 2 on I-CAP-1 or I-CAP-2 |

### Warrants
| Level | Condition |
|-------|-----------|
| **UI refinement** | W-CAP-2 at S3 → grain label, consequence bar prominence, ratio paraphrase helper on F1/F3 only |
| **Workflow refinement** | W-CAP-3 at S4 with ≥3/6 wrong final decisions → sequencing of capacity evidence between F3 and Detail (not duplicate math) |
| **Constitution amendment** | I-CAP-* at S5 → reconsider §A §19 busiest-day ratio as primary surface signal |
| **Architecture reconsideration** | I-CAP-* at S5 plus engine/corpus proof that active-day grain is wrong >15% fixtures |

---

## Assumption 2 — Competition understanding

**Tests:** A2 (cluster = linked decisions) · A4 (F3 enables correct choice)

**Screen owners:** F1 · F3

### Confirms
| Code | Evidence |
|------|----------|
| C-COM-1 | ≥5/6 describe cluster as linked / competing / shared-capacity decisions, not “grouped by date” or availability bucket |
| C-COM-2 | ≥5/6 name ≥2 schools competing after 30s in F3 without moderator hint |
| C-COM-3 | ≥4/6 open cluster to compare before committing; do not seek approve on F1 |
| C-COM-4 | ≥4/6 choose Hopkins as first open row when following suggested path (T2/T3) |

### Weakens
| Code | Evidence |
|------|----------|
| W-COM-1 | 2–3/6 use “group” language but demonstrate correct compare behavior |
| W-COM-2 | ≥3/6 miss competition count in F3 header but identify competitors in triage rows |
| W-COM-3 | ≥3/6 open single school from F1 skipping F3 once, succeed on second attempt after self-correction |

### Invalidates
| Code | Evidence |
|------|----------|
| I-COM-1 | ≥4/6 treat cluster as arbitrary pile; express surprise that schools affect each other |
| I-COM-2 | ≥4/6 attempt approve from F1 or expect approve in F3 (Constitution §B violation expected by user) |
| I-COM-3 | ≥4/6 cannot name any competitor after full F3 exposure |
| I-COM-4 | S4 on I-COM-1 or I-COM-2 in two rounds |

### Warrants
| Level | Condition |
|-------|-----------|
| **UI refinement** | W-COM-2 at S3 → F3 competition line copy, triage row emphasis (no F3 approve) |
| **Workflow refinement** | I-COM-3 at S3 with wrong-first-open ≥4/6 → F1→F3 affordance, not remove F3 |
| **Constitution amendment** | I-COM-1 at S5 → §A §7 cluster definition or §C aggregation rules |
| **Architecture reconsideration** | I-COM-* at S5 plus corpus proof cluster semantics wrong >15% enterprise fixtures |

---

## Assumption 3 — Sequencing understanding

**Tests:** A3 (↪ / decide first) · A6 (F4 not broken) · Top-5 learning #1 (Hopkins before Towson)

**Screen owners:** F1 · F3 · F4

### Confirms
| Code | Evidence |
|------|----------|
| C-SEQ-1 | ≥5/6 open Hopkins before Towson without moderator hint (T3) |
| C-SEQ-2 | ≥5/6 interpret F4 disabled Approve as policy/sequence, not bug |
| C-SEQ-3 | ≥4/6 discover **Open Johns Hopkins →** unaided within 60s on F4 |
| C-SEQ-4 | ≥4/6 articulate “partner / sequence / decide first” rationale in debrief |

### Weakens
| Code | Evidence |
|------|----------|
| W-SEQ-1 | 2–3/6 open Towson first but recover via F4 without moderator hint |
| W-SEQ-2 | ≥3/6 click disabled Approve once then find Open Hopkins |
| W-SEQ-3 | ≥3/6 need F3 sequence context to understand F4; succeed after F3 |
| W-SEQ-4 | ↪ surrogate on F1 not noticed; F3 “Review first” sufficient for recovery |

### Invalidates
| Code | Evidence |
|------|----------|
| I-SEQ-1 | ≥4/6 call F4 broken; abandon task or request admin help |
| I-SEQ-2 | ≥4/6 never find Open Hopkins unaided; fail T3 |
| I-SEQ-3 | ≥4/6 approve Towson first believing it is correct path |
| I-SEQ-4 | S4 on I-SEQ-1 or I-SEQ-2 in two rounds |

### Warrants
| Level | Condition |
|-------|-----------|
| **UI refinement** | W-SEQ-2 at S3 → F4 blocker link prominence, disabled tooltip copy |
| **Workflow refinement** | I-SEQ-2 at S3 → F7-Continue / F3 strip routing only; **not** enable Approve on F4 |
| **Constitution amendment** | I-SEQ-* at S5 challenging §A §11 decide-only in Detail with sequence gate |
| **Architecture reconsideration** | I-SEQ-* at S5 plus evidence policy engine must precede calendar entirely |

---

## Assumption 4 — Decision confidence (approve path)

**Tests:** A5 (VerdictBand <3s) · A7 (impact trust) · A8 (ack read) · Top-5 #3, #5

**Screen owners:** F4/F5/F6

### Confirms
| Code | Evidence |
|------|----------|
| C-DEC-1 | ≥5/6 state approve/hold/decline posture from VerdictBand without scrolling (F5/F6) |
| C-DEC-2 | ≥4/6 recall ≥1 Impact row after approve intent (Duke/Towson effect) |
| C-DEC-3 | Ack checked ≥3s after reading Impact in ≥4/6 sessions; not first click |
| C-DEC-4 | Decision-confidence Likert ≥4 in ≥4/6 post-session |
| C-DEC-5 | ≥4/6 cite three channels (Capacity / Policy / Ops) as distinct |

### Weakens
| Code | Evidence |
|------|----------|
| W-DEC-1 | ≥3/6 scroll to Impact before stating posture but answer correctly |
| W-DEC-2 | ≥3/6 perceive VerdictBand + Suggested + Consequence as redundant yet decide correctly |
| W-DEC-3 | ≥3/6 check ack quickly but pass recall when probed in debrief |
| W-DEC-4 | Users trust band over Impact when numbers conflict (manifest V1/V4) |

### Invalidates
| Code | Evidence |
|------|----------|
| I-DEC-1 | ≥4/6 cannot state Can I approve from VerdictBand within 3s on F5 |
| I-DEC-2 | ≥4/6 blind ack with zero peer recall across sessions |
| I-DEC-3 | ≥4/6 express they do not believe Impact / consequence before approving |
| I-DEC-4 | ≥4/6 return to lenses or audit seeking “real answer” before commit |
| I-DEC-5 | S4 on I-DEC-1 or I-DEC-2 in two rounds |

### Warrants
| Level | Condition |
|-------|-----------|
| **UI refinement** | W-DEC-2 at S3 → reduce copy duplication within Detail sections only |
| **Workflow refinement** | I-DEC-2 at S4 → ack gate timing or Impact position; not move approve to F3 |
| **Constitution amendment** | I-DEC-* at S5 → §A §14–15 Detail/F7 decision split |
| **Architecture reconsideration** | I-DEC-* at S5 with queue-first outperforming calendar on T4 accuracy + time |

---

## Assumption 5 — Negative-path confidence

**Tests:** A9 (F7 completes hold/decline) · Top-5 #4 · Decision Workspace vs Approval Workspace verdict

**Screen owners:** F7/F8 (hold · decline · continue)

### Confirms
| Code | Evidence |
|------|----------|
| C-NEG-1 | ≥4/6 name one peer or capacity effect after hold/decline from F7 without returning to Detail |
| C-NEG-2 | ≥5/6 after hold state capacity unchanged unprompted |
| C-NEG-3 | ≥4/6 after decline name who benefits (e.g. Duke headroom improved) |
| C-NEG-4 | ≥4/6 do not return to Detail asking “what happened?” after F7 close |
| C-NEG-5 | Product described as “decision” not “approval” by ≥4/6 in debrief |

### Weakens
| Code | Evidence |
|------|----------|
| W-NEG-1 | ≥3/6 need F7 Impact read aloud to answer peer effect; answer correct when probed |
| W-NEG-2 | ≥3/6 expect hold to free capacity before F7; corrected by F7 copy |
| W-NEG-3 | F8 annotation sufficient but calendar surface distrusted (V5) |
| W-NEG-4 | Continue banner dismissed without read; sequencing still correct via F4 |

### Invalidates
| Code | Evidence |
|------|----------|
| I-NEG-1 | ≥4/6 return to Detail or F3 confused after hold/decline close |
| I-NEG-2 | ≥4/6 believe hold freed capacity or decline auto-approved another school |
| I-NEG-3 | ≥4/6 cannot name any consequence of decline for competitors |
| I-NEG-4 | ≥4/6 describe product as approval-only after hold/decline tasks |
| I-NEG-5 | S4 on I-NEG-1 or I-NEG-3 in two rounds |

### Warrants
| Level | Condition |
|-------|-----------|
| **UI refinement** | W-NEG-2 at S3 → F7 hold status-quo line emphasis only |
| **Workflow refinement** | I-NEG-1 at S3 → F7 routing (return to F3 vs F8 dwell) — **not** add Detail negative preview without S5 |
| **Constitution amendment** | I-NEG-* at S5 → §A §15 negative consequence placement (Detail vs F7) |
| **Architecture reconsideration** | I-NEG-* at S5 with evidence negative paths require separate product surface |

---

## Assumption 6 — Calendar-first usability

**Tests:** T1 scan motivation · return after F7 · F8 as environmental truth (A10) · calendar vs modal disorientation

**Screen owners:** F1 · F8 · global shell

### Confirms
| Code | Evidence |
|------|----------|
| C-CAL-1 | ≥5/6 initiate investigation from F1 cluster without being told where to click |
| C-CAL-2 | ≥4/6 return to same cluster on F8 after F7 without losing orientation |
| C-CAL-3 | ≥4/6 describe calendar as primary workspace unprompted |
| C-CAL-4 | Task time T1→T4 within facilitator baseline (no systemic >25% overrun) |
| C-CAL-5 | ≥4/6 accept F8 annotation as sufficient closure when calendar objects unchanged (V5) |

### Weakens
| Code | Evidence |
|------|----------|
| W-CAL-1 | ≥3/6 want list view for compare but complete calendar tasks successfully |
| W-CAL-2 | ≥3/6 lose scroll position once; recover on second cluster open |
| W-CAL-3 | F8 calendar unchanged causes momentary doubt; F7 summary restores confidence |
| W-CAL-4 | Month-only path sufficient; no demand for Week/Day in Round 1 tasks |

### Invalidates
| Code | Evidence |
|------|----------|
| I-CAL-1 | ≥4/6 fail T1 without facilitator revealing cluster location |
| I-CAL-2 | ≥4/6 express lost/confused after modal close despite F7/F8 |
| I-CAL-3 | ≥4/6 abandon calendar path for grid view to complete T3/T4 |
| I-CAL-4 | ≥50% participants fail primary tasks in calendar path across ≥12 users (§E bar) |
| I-CAL-5 | S4 on I-CAL-1 or I-CAL-3 in two rounds |

### Warrants
| Level | Condition |
|-------|-----------|
| **UI refinement** | W-CAL-2 at S3 → scroll preserve, cluster highlight on F8 |
| **Workflow refinement** | W-CAL-3 at S4 → F8 annotation + return-to-cluster CTA |
| **Constitution amendment** | I-CAL-* at S5 → §A §1–3 calendar-first or Month primary |
| **Architecture reconsideration** | Constitution §E calendar-first bar met |

---

## Round 1 go / no-go (interpretation only)

**Go to Round 2 (no build change required):** ≥4/5 Top-5 learnings at C-* or acceptable W-* per review; no I-* at S4.

**Conditional go:** One I-* at S3 only → log as Round 2 primary probe; still no Constitution change.

**Pause build changes:** Any I-* at S4 in Round 1 → complete Post-Session Review before any UI/workflow ticket.

**Architecture or Constitution path:** Any I-* at S5 or §E bar met → schedule amendment review; not a sprint ticket.

---

## Post-Session Review Template

**Complete within 48 hours of last session. No changes authorized in the review meeting itself.**

### Session metadata

| Field | Value |
|-------|-------|
| Date | |
| Participants (n) | /6 planned |
| Facilitator | |
| Prototype build | `?dataset=usability-prototype` + git SHA |
| Constitution version | Frozen cycle |
| Manifest version | Assembly manifest date |

---

### Step 1 — Raw findings log (no interpretation)

| ID | Participant | Task | Observation (verbatim) | Assumption tag | Tier (S1–S5) |
|----|-------------|------|------------------------|----------------|--------------|
| F-001 | P1 | T3 | | SEQ | S1 |
| | | | | | |

*Rule: One row per observable behavior. No solutions column.*

---

### Step 2 — Pattern aggregation

| Assumption | C-* codes observed | W-* codes observed | I-* codes observed | Highest tier | n affected |
|------------|-------------------|-------------------|-------------------|--------------|------------|
| Capacity | | | | | /6 |
| Competition | | | | | /6 |
| Sequencing | | | | | /6 |
| Decision confidence | | | | | /6 |
| Negative-path | | | | | /6 |
| Calendar-first | | | | | /6 |

*Rule: Tier rises only when same code appears across participants or tasks per ladder.*

---

### Step 3 — Top-5 learnings scorecard

| # | Learning | Pass (C) | Weak (W) | Fail (I) | Tier | Round 2 probe? |
|---|----------|----------|----------|----------|------|----------------|
| 1 | Hopkins before Towson unaided | /6 | | | | |
| 2 | Ratio paraphrase correct | /6 | | | | |
| 3 | VerdictBand pre-scroll | /6 | | | | |
| 4 | F7 hold/decline peer effect | /6 | | | | |
| 5 | Ack deliberate + recall | /6 | | | | |

---

### Step 4 — Outlier quarantine

List any finding driven by **one participant only**:

| Finding | Why outlier | Action |
|---------|-------------|--------|
| | e.g. domain expert, prior Exxat user, moderator slip | Log S1 only · exclude from pattern tier |

*Rule: Outliers cannot authorize UI, workflow, Constitution, or architecture changes.*

---

### Step 5 — Manifest violation crosswalk

| Manifest flag | Observed? | Confirms violation as problem? | Tier |
|---------------|-----------|----------------------------------|------|
| V1 Ratio grain | | | |
| V3 F3 sequence line | | | |
| V5 F8 no object mutation | | | |
| V2 Sidebar vs cluster | | | |

*Rule: Manifest flag confirmed problematic only if linked I-* or W-* at S3+.*

---

### Step 6 — Change authorization (checkbox)

**Only check boxes supported by Step 2–5 thresholds.**

- [ ] **No change** — all assumptions at C or W below S3 → proceed Round 2 unchanged
- [ ] **UI refinement tickets** — list assumption codes: _______________ (Design lead sign-off)
- [ ] **Workflow refinement tickets** — list assumption codes: _______________ (Product + Research sign-off)
- [ ] **Constitution amendment draft** — list § sections: _______________ (Executive Product sign-off)
- [ ] **Architecture reconsideration brief** — §E evidence attached (Leadership forum)

**Explicitly not authorized (default):**

- [ ] Approve in F3
- [ ] Negative preview in Detail
- [ ] Overlap-based clustering
- [ ] Remove F3 compare step
- [ ] Patch from single-participant quote

---

### Step 7 — Round 2 protocol adjustments (if needed)

| Assumption | Probe added | Moderator script change | Success criterion |
|------------|-------------|-------------------------|-------------------|
| | | | |

*Rule: Round 2 probes test hypotheses; they do not validate fixes.*

---

### Step 8 — Sign-off

| Role | Name | Date | Outcome |
|------|------|------|---------|
| Research lead | | | |
| Design lead | | | |
| Product lead | | | |

**Declared Round 1 interpretation:** ☐ Go Round 2 unchanged ☐ Go Round 2 with probes ☐ Pause for authorized change class only

---

## Anti-patterns (reject in review)

| Statement in debrief | Correct interpretation |
|---------------------|------------------------|
| “P3 hated the disabled button” | S1 until ≥2/6; probe I-SEQ-1 tier |
| “We should add decline preview to Detail” | Constitution §D — requires I-NEG-* at S5 and F7-first fix failed Round 2 |
| “Sidebar cap is confusing — fix it” | V2 known tension — W-CAP only unless I-CAP at S4 |
| “F8 didn’t update — prototype is broken” | V5 flagged — test C-NEG-5 / W-CAL-3, not auto F8 build |
| “Let’s skip F3, they get it from the card” | Constitution §B — needs §E + executive amendment |
| “One coordinator used list view successfully” | Irrelevant to calendar-first I-CAL unless ≥4/6 |

---

## Document chain

```
Constitution (what must not drift)
    ↓
Assembly Manifest (what was built + flagged violations)
    ↓
Pre-Usability Review (P0/P1 assumptions + Top 5)
    ↓
Round 1 sessions (raw evidence)
    ↓
Evidence Review Framework (this document — how to interpret)
    ↓
Post-Session Review (authorized change class, if any)
    ↓
Round 2 OR authorized refinement cycle
```

---

*End of Evidence Review Framework*
