import { useMemo, useState, type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { CalendarChevron } from "./calendar-chevron"
import { FontAwesomeIcon } from "../font-awesome-icon"
import type { CalendarModel } from "./useCalendarModel"
import { DETAIL_MODAL_SHELL } from "./detail-modal-shell"
import {
  DETAIL_EYEBROW,
  DETAIL_FIELD_LABEL,
  DETAIL_FIELD_META,
  DETAIL_FIELD_VALUE,
  DETAIL_FOOTNOTE,
  DETAIL_LEAD,
  DETAIL_LIST_PRIMARY,
  DETAIL_LIST_SECONDARY,
  DETAIL_PILL,
  DETAIL_SECTION_HEADING,
  DETAIL_SECTION_LABEL,
  DETAIL_STAT_STRIP,
  DETAIL_STAT_STRIP_HINT,
  DETAIL_STAT_STRIP_VALUE,
  DETAIL_STATUS_CHIP,
  DETAIL_TERTIARY_ACTION,
  DETAIL_TITLE,
} from "./detail-modal-typography"
import type { ScheduleRecord } from "../../lib/schedules/types"
import {
  resolveScheduleDetailBundle,
  SLOT_MEMBER_STATUS_LABEL,
  studentDisciplineLine,
  type ScheduleDetailBundle,
  type ScheduleSlotMember,
  type SlotMemberStatus,
} from "../../lib/schedules/schedule-detail-content"
import { ScheduleBarRhythmInfographic } from "./schedule-bar-infographics"
import {
  scheduleRhythmContextHint,
  scheduleRhythmSectionLabel,
} from "../../lib/schedules/schedule-bar-rhythm"
import { cn } from "../ui/utils"

const MEMBER_STATUS_CLASS: Record<SlotMemberStatus, string> = {
  compliant: "text-emerald-700 bg-emerald-50 border-emerald-200",
  not_compliant: "text-red-800 bg-red-50 border-red-200",
  not_invited: "text-rose-800 bg-rose-50 border-rose-200",
  action_needed: "text-amber-900 bg-amber-50 border-amber-200",
  not_started: "text-muted-foreground bg-muted/40 border-border",
  not_applicable: "text-muted-foreground bg-muted/40 border-border",
}

function StatusPill({
  children,
  variant = "neutral",
}: {
  children: ReactNode
  variant?: "neutral" | "type" | "confirmed" | "compliant" | "risk"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5",
        DETAIL_PILL,
        variant === "neutral" && "border-border bg-muted/30 text-foreground",
        variant === "type" && "border-border bg-background text-foreground",
        variant === "confirmed" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        variant === "compliant" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        variant === "risk" && "border-amber-200 bg-amber-50 text-amber-900",
      )}
    >
      {children}
    </span>
  )
}

function pillVariant(label: string): "neutral" | "type" | "confirmed" | "compliant" | "risk" {
  if (label === "Confirmed" || label === "Compliant") return label === "Confirmed" ? "confirmed" : "compliant"
  if (label === "Not Compliant" || label === "Not confirmed") return "risk"
  if (label === "Group" || label === "Individual") return "type"
  return "neutral"
}

function Fact({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-1 py-3", className)}>
      <dt className={cn(DETAIL_FIELD_LABEL, "pt-0.5")}>{label}</dt>
      <dd className="min-w-0 space-y-1">{children}</dd>
    </div>
  )
}

function RosterStrip({ bundle }: { bundle: ScheduleDetailBundle }) {
  if (!bundle.isGroup) return null

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center divide-x divide-border overflow-hidden rounded-lg border border-border",
        DETAIL_STAT_STRIP,
      )}
    >
      <div className="px-3 py-2">
        <span className="text-muted-foreground">Students </span>
        <span className={DETAIL_STAT_STRIP_VALUE}>{bundle.studentCount}</span>
        {bundle.unassignedStudentCount > 0 ? (
          <span className={cn("ml-1.5", DETAIL_STAT_STRIP_HINT)}>
            · {bundle.unassignedStudentCount} open
          </span>
        ) : null}
      </div>
      <div className="px-3 py-2">
        <span className="text-muted-foreground">Faculty </span>
        <span className={DETAIL_STAT_STRIP_VALUE}>{bundle.facultyCount}</span>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  onAction,
  onScheduleStudent,
  showScheduleCta,
}: {
  member: ScheduleSlotMember
  onAction: (member: ScheduleSlotMember) => void
  onScheduleStudent: () => void
  showScheduleCta: boolean
}) {
  const unassigned = member.status === "not_invited" && member.role === "student"
  const initial = member.name.trim().charAt(0).toUpperCase() || "?"

  return (
    <div className="group py-2.5">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 text-left rounded-md -mx-1 px-1 py-0.5",
          member.actionable && "hover:bg-muted/40",
        )}
        onClick={() => member.actionable && onAction(member)}
        disabled={!member.actionable}
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate", DETAIL_LIST_PRIMARY)}>{member.name}</span>
          {member.email ? (
            <span className={cn("block truncate", DETAIL_LIST_SECONDARY)}>{member.email}</span>
          ) : null}
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5",
            DETAIL_STATUS_CHIP,
            MEMBER_STATUS_CLASS[member.status],
          )}
        >
          {SLOT_MEMBER_STATUS_LABEL[member.status]}
          {member.actionable && member.status !== "not_invited" ? (
            <CalendarChevron use="affordance" />
          ) : null}
        </span>
      </button>
      {showScheduleCta && unassigned ? (
        <div className="mt-2 pl-11">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onScheduleStudent}>
            Schedule student
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function SlotDetailsSection({
  bundle,
  onMemberAction,
  onScheduleStudent,
}: {
  bundle: ScheduleDetailBundle
  onMemberAction: (member: ScheduleSlotMember) => void
  onScheduleStudent: () => void
}) {
  const students = bundle.slotMembers.filter((m) => m.role === "student")
  const faculty = bundle.slotMembers.filter((m) => m.role === "faculty")

  return (
    <section className="border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className={DETAIL_SECTION_HEADING}>Slot details</h3>
        <button
          type="button"
          className={cn("inline-flex items-center gap-1", DETAIL_TERTIARY_ACTION)}
          onClick={() => onMemberAction(bundle.slotMembers[0])}
        >
          <FontAwesomeIcon name="comments" className="size-3" aria-hidden />
          Messages
        </button>
      </div>

      <div className="max-h-[min(40vh,320px)] overflow-y-auto divide-y divide-border/70">
        {bundle.isGroup && students.length > 0 ? (
          <div className="py-1">
            <p className={cn(DETAIL_SECTION_LABEL, "mb-1.5")}>Students</p>
            {students.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onAction={onMemberAction}
                onScheduleStudent={onScheduleStudent}
                showScheduleCta={bundle.showScheduleStudentCta}
              />
            ))}
          </div>
        ) : null}

        {!bundle.isGroup
          ? students.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onAction={onMemberAction}
                onScheduleStudent={onScheduleStudent}
                showScheduleCta={bundle.showScheduleStudentCta}
              />
            ))
          : null}

        {bundle.isGroup && faculty.length > 0 ? (
          <div className="py-1">
            <p className={cn(DETAIL_SECTION_LABEL, "mb-1.5 pt-2")}>Faculty</p>
            {faculty.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onAction={onMemberAction}
                onScheduleStudent={onScheduleStudent}
                showScheduleCta={false}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ScheduleDetailBody({
  bundle,
  onMemberAction,
  onScheduleStudent,
}: {
  bundle: ScheduleDetailBundle
  onMemberAction: (member: ScheduleSlotMember) => void
  onScheduleStudent: () => void
}) {
  const unassignedIndividual =
    !bundle.isGroup && bundle.assignmentHeadline === "Student to be assigned"

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
        {!bundle.isGroup && bundle.assignmentHeadline ? (
          <div>
            <p className={DETAIL_SECTION_LABEL}>
              {unassignedIndividual ? "Assignment" : "Student"}
            </p>
            <p
              className={cn(
                DETAIL_LEAD,
                "mt-1.5",
                unassignedIndividual ? "text-amber-900" : "text-foreground",
              )}
            >
              {bundle.assignmentHeadline}
            </p>
          </div>
        ) : null}

        <RosterStrip bundle={bundle} />

        <dl className="divide-y divide-border/70">
          <Fact label="Dates">
            <span className={cn(DETAIL_FIELD_VALUE, "tabular-nums")}>{bundle.dateRange}</span>
          </Fact>
          <Fact label="Location">
            <span className={DETAIL_FIELD_VALUE}>{bundle.locationPrimary}</span>
            <span className={DETAIL_FIELD_META}>{bundle.locationHierarchy}</span>
          </Fact>
          {(bundle.scheduleRhythm || bundle.shiftLabel) ? (
            <Fact
              label={
                bundle.scheduleRhythm
                  ? scheduleRhythmSectionLabel(bundle.scheduleRhythm)
                  : "Pattern"
              }
            >
              <div className="space-y-2">
                {bundle.scheduleRhythm ? (
                  <>
                    <ScheduleBarRhythmInfographic
                      rhythm={bundle.scheduleRhythm}
                      variant="default"
                    />
                    <span className={DETAIL_FIELD_META}>
                      {scheduleRhythmContextHint(bundle.scheduleRhythm)}
                    </span>
                  </>
                ) : null}
                {bundle.shiftLabel ? (
                  <span className={DETAIL_FIELD_META}>{bundle.shiftLabel}</span>
                ) : null}
              </div>
            </Fact>
          ) : null}
          <Fact label="Program">
            <span className={DETAIL_FIELD_VALUE}>{bundle.programLabel}</span>
            <span className={DETAIL_FIELD_META}>{studentDisciplineLine(bundle.primary)}</span>
          </Fact>
        </dl>

        {bundle.requirementsPending > 0 ? (
          <p className="border-l-2 border-amber-400 pl-3 text-sm text-amber-900">
            <span className="font-semibold">{bundle.requirementsPending} requirement</span>
            {bundle.requirementsPending === 1 ? "" : "s"} still need attention.
          </p>
        ) : null}

        <SlotDetailsSection
          bundle={bundle}
          onMemberAction={onMemberAction}
          onScheduleStudent={onScheduleStudent}
        />
      </div>
    </div>
  )
}

export function ScheduleDetailModal({
  model,
  scheduleRows,
}: {
  model: CalendarModel
  scheduleRows: ScheduleRecord[]
}) {
  const [opsStatus, setOpsStatus] = useState<string | null>(null)
  const open = Boolean(model.schedulesContext && model.scheduleDetailIds.length > 0)

  const bundle = useMemo(
    () => resolveScheduleDetailBundle(model.scheduleDetailIds, scheduleRows),
    [model.scheduleDetailIds, scheduleRows],
  )

  const close = () => {
    model.setScheduleDetailIds([])
    setOpsStatus(null)
  }

  const handleMemberAction = (member: ScheduleSlotMember) => {
    setOpsStatus(`Opening ${member.name} — mock only.`)
  }

  const handleScheduleStudent = () => {
    setOpsStatus("Schedule student — mock only.")
  }

  const handleViewSchedule = () => {
    setOpsStatus("Opening schedule view — mock only.")
  }

  const complianceIcon =
    bundle?.onboardingStatus === "Compliant"
      ? "thumbsUp"
      : bundle?.onboardingStatus === "Not Compliant"
        ? "thumbsDown"
        : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {bundle ? (
        <DialogContent className={DETAIL_MODAL_SHELL}>
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0 space-y-0 text-left shadow-[inset_3px_0_0_0_hsl(var(--chart-1))]">
            <p className={cn(DETAIL_EYEBROW, "tabular-nums tracking-wide")}>{bundle.referenceLabel}</p>

            <div className="mt-2 flex items-start justify-between gap-4 pr-8">
              <DialogTitle className={cn(DETAIL_TITLE, "pr-0")}>{bundle.schoolTitle}</DialogTitle>
              <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                <FontAwesomeIcon
                  name={bundle.isGroup ? "users" : "user"}
                  className="size-3.5"
                  aria-hidden
                  title={bundle.isGroup ? "Group schedule" : "Individual schedule"}
                />
                {complianceIcon ? (
                  <FontAwesomeIcon
                    name={complianceIcon}
                    className={cn(
                      "size-3.5",
                      bundle.onboardingStatus === "Compliant" ? "text-emerald-600" : "text-red-600",
                    )}
                    aria-hidden
                    title={bundle.onboardingStatus}
                  />
                ) : null}
              </div>
            </div>

            <DialogDescription className="sr-only">
              {bundle.isGroup ? "Group schedule detail" : "Individual schedule detail"} for{" "}
              {bundle.schoolTitle}
            </DialogDescription>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusPill variant={pillVariant(bundle.experienceType)}>{bundle.experienceType}</StatusPill>
              <StatusPill variant={pillVariant(bundle.scheduleStatusLabel)}>
                {bundle.scheduleStatusLabel}
              </StatusPill>
              {bundle.onboardingStatus !== "Not Applicable" ? (
                <StatusPill variant={pillVariant(bundle.onboardingStatus)}>
                  {bundle.onboardingStatus}
                </StatusPill>
              ) : null}
              <StatusPill variant="neutral">
                <span className="font-mono tabular-nums">{bundle.primary.id}</span>
              </StatusPill>
            </div>
          </DialogHeader>

          <ScheduleDetailBody
            bundle={bundle}
            onMemberAction={handleMemberAction}
            onScheduleStudent={handleScheduleStudent}
          />

          <div className="shrink-0 border-t border-border px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={handleViewSchedule}>
                View schedule
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpsStatus("Edit dates — mock only.")}
              >
                Edit dates
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpsStatus("Contact school — mock only.")}
              >
                Contact school
              </Button>
            </div>
            {opsStatus ? (
              <p className={cn("mt-2", DETAIL_FOOTNOTE)} role="status" aria-live="polite">
                {opsStatus}
              </p>
            ) : null}
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
