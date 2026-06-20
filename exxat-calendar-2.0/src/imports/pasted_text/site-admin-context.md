# EXXAT ONE — NEXT GENERATION SLOT REQUESTS CALENDAR VIEW

Before designing anything, carefully review all attached documents, screenshots, workflows, and reference URLs.

Do not copy layouts.

Use them to understand:

* Site-side workflows
* Placement scheduling
* Capacity planning
* Request management
* Operational decision making
* Scheduling bottlenecks
* Approval workflows
* Timeline management

---

# IMPORTANT CONTEXT

Site = Hospital / Clinic / Healthcare Organization

School = Academic Institution requesting clinical placements

Student = Healthcare learner requiring placement opportunities

This exercise is ONLY focused on Site-side operations.

Ignore:

* Student onboarding
* Jobs workflows
* Profile creation
* Authentication
* Social/network experiences
* Student-side discovery experiences

Focus only on Site Admins, Coordinators, and Site Operations.

---

# PART 1 — HOW TO READ THE ATTACHED DOCUMENTS

Do not use the documents to replicate existing workflows.

Use them to understand operational requirements.

---

## Extract Site Admin Responsibilities

Understand:

* What Site Admins are responsible for
* What decisions they make daily
* What decisions they make weekly
* What decisions they make monthly
* What information they need before approving requests
* What information they need after approving requests

---

## Extract Slot Request Workflows

Understand:

* Request lifecycle
* Pending requests
* Approved requests
* Rejected requests
* Modified requests
* Review process
* Approval process
* Escalation process

Identify where timeline visibility can improve decision making.

---

## Extract Capacity Planning Logic

Understand:

* What defines capacity
* How slots are allocated
* How locations operate
* How disciplines operate
* What causes utilization
* What causes over-utilization
* What causes under-utilization
* What creates scheduling bottlenecks

Treat Capacity as a first-class object.

---

## Extract Scheduling Operations

Understand:

* How schedules are currently managed
* What causes scheduling conflicts
* What causes delays
* What causes operational risk
* What information is buried in forms today
* What information is buried in grid views today

Identify information that should become visible directly on the timeline.

---

## Extract Existing Grid View Insights

Understand:

* Which columns are most important
* Which filters are most frequently used
* Which information users repeatedly search for
* Which information should become visible directly in Calendar View

The goal is NOT to recreate the Grid View.

The goal is to make Calendar View significantly more useful than Grid View.

---

# PART 2 — HOW TO READ THE REFERENCE URLS

Do NOT study visual styling.

Study:

* Information hierarchy
* Timeline structures
* Resource allocation patterns
* Capacity visualization patterns
* Utilization visualization
* Workload management
* Scheduling workflows
* Timeline interactions
* Forecasting patterns
* Conflict management
* Drill-down mechanisms
* Filtering systems

---

## Study Float

Learn:

* Resource allocation
* Capacity planning
* Utilization visibility
* Timeline density

https://www.float.com

---

## Study Resource Guru

Learn:

* Resource scheduling
* Booking systems
* Availability visibility
* Utilization awareness

https://resourceguruapp.com

---

## Study Monday Resource Management

Learn:

* Capacity balancing
* Workload visualization
* Timeline grouping
* Resource allocation

https://www.monday.com/features/resource-management

---

## Study Smartsheet Gantt

Learn:

* Enterprise Gantt structures
* Hierarchical timelines
* Large-scale planning
* Timeline scanning patterns

https://www.smartsheet.com/gantt-chart-software

---

## Study Asana Timeline

Learn:

* Timeline interactions
* Drag interactions
* Resizing interactions
* Planning workflows
* Information density

https://asana.com/features/project-management/project-views/timeline

---

## Study Clinician Nexus

Learn:

* Healthcare placement scheduling
* Rotation management
* Site-school coordination
* Placement visibility

https://www.cliniciannexus.com/solutions/student-manager/

---

## Study NurseGrid

Learn:

* Healthcare workforce scheduling
* Shift visibility
* Scheduling awareness
* Staffing coordination

https://www.nursegrid.com/manager/

---

# PART 3 — PRODUCT VISION

Design a Gantt-inspired Calendar Experience.

This is NOT a traditional calendar.

This is NOT a meeting scheduler.

This is NOT a task management Gantt.

This is NOT a project management timeline.

Design a Healthcare Placement Scheduling and Capacity Planning Command Center.

---

# WHAT PROBLEM ARE WE SOLVING?

Today Site Admins manage placements through:

* Tables
* Filters
* Approval queues
* Forms
* Manual searching

This creates:

* Poor visibility
* Slow approvals
* Capacity uncertainty
* Scheduling conflicts
* Operational inefficiency

We want a calendar experience that allows Site Admins to understand the entire operational state of their organization at a glance.

---

# PRIMARY DESIGN GOAL

The Calendar View should become the primary workspace for Site Admins.

Users should naturally prefer Calendar View over Grid View.

A successful design should allow users to perform most scheduling, planning, approval, and capacity-management activities without leaving the calendar.

---

# CORE QUESTIONS THE CALENDAR MUST ANSWER

Within 10 seconds of opening the calendar, users should understand:

### Requests

* Which requests are pending?
* Which requests require approval?
* Which requests are urgent?
* Which requests may create conflicts?

### Capacity

* Can I accommodate more students?
* Which locations are fully booked?
* Which locations have available capacity?
* Which locations are under-utilized?
* Which locations are over-utilized?

### Scheduling

* What is scheduled?
* What is upcoming?
* What is changing?
* What is ending soon?

### Operations

* What needs attention today?
* What needs attention this week?
* What operational risks exist?

---

# CORE DESIGN PRINCIPLE

The primary object is NOT a task.

The primary object is Capacity.

Traditional calendars visualize time.

This experience must visualize:

* Time
* Capacity
* Utilization
* Demand
* Approvals
* Conflicts

simultaneously.

---

# PLANNING HORIZONS

Support four planning levels.

---

## Year View

Purpose:

Strategic planning.

Help users understand:

* Demand trends
* Capacity trends
* Seasonal patterns
* School demand patterns
* Discipline demand patterns

---

## Month View

Purpose:

Operational planning.

Help users understand:

* Active requests
* Capacity distribution
* Utilization hotspots
* Upcoming demand

This should likely become the default view.

---

## Week View

Purpose:

Scheduling coordination.

Help users understand:

* Upcoming starts
* Upcoming endings
* Pending approvals
* Capacity remaining
* Scheduling conflicts

---

## Day View

Purpose:

Immediate action management.

Help users understand:

* Today's placements
* Today's arrivals
* Urgent approvals
* Schedule changes
* Operational alerts

---

# TIMELINE STRUCTURE

Design the best hierarchy.

Possible examples:

Site
→ Location
→ Discipline
→ Availability
→ Requests

or

Location
→ Discipline
→ Placements

or

Location
→ Discipline
→ Capacity
→ Requests

Recommend the most effective hierarchy.

---

# CAPACITY VISUALIZATION

This is the most important feature.

Directly visualize:

* Available slots
* Used slots
* Remaining slots
* Capacity utilization
* Over-capacity periods
* Under-utilized periods
* Future capacity risk

Users should understand capacity without opening detail screens.

---

# TIMELINE LAYERS

The timeline should support multiple information layers simultaneously:

* Approved placements
* Pending requests
* Reserved capacity
* Utilized capacity
* Available capacity
* Request density
* Scheduling conflicts

without overwhelming the user.

---

# INTERACTIONS

Support:

* Expand / Collapse hierarchy
* Hover insights
* Quick approvals
* Quick review
* Timeline drill-down
* Capacity filtering
* School filtering
* Discipline filtering
* Request filtering
* Drag interactions where appropriate

Minimize navigation away from the calendar.

---

# INNOVATION CHALLENGE

Do not simply recreate an existing Gantt chart.

Explore innovative approaches to:

* Capacity visualization
* Placement scheduling
* Request management
* Timeline density
* Multi-level hierarchy
* Conflict visualization
* Utilization forecasting
* Healthcare-specific planning

The final concept should feel purpose-built for healthcare placement operations rather than adapted from generic project management software.

---

# GENERATE 3 DISTINCT CONCEPTS

## Concept A — Capacity First

Focus on:

* Utilization
* Slot availability
* Capacity forecasting
* Demand management

---

## Concept B — Approval First

Focus on:

* Request management
* Review workflows
* Approvals
* Operational actions

---

## Concept C — Operations Command Center

Focus on:

* Scheduling
* Capacity
* Approvals
* Conflicts
* Forecasting
* Operational alerts

This concept should feel like a healthcare operations control tower.

---

# FINAL DELIVERABLES

For each concept provide:

1. Information Architecture
2. Timeline Hierarchy
3. Capacity Visualization Model
4. Interaction Model
5. Strengths
6. Weaknesses

Then recommend the strongest direction.

The final recommendation should feel as if Float, Resource Guru, Clinician Nexus, and enterprise healthcare scheduling software were combined into a modern healthcare placement scheduling platform built specifically for Exxat One.
