import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import { FontAwesomeIcon } from "./font-awesome-icon"
import { SchedulesListFilterChip } from "./schedules-list-filter-chip"
import { SchedulesViewToolbar, type SchedulesListViewMode } from "./schedules-view-toolbar"
import { SchedulesCalendarWorkspace } from "./SchedulesCalendarWorkspace"
import { useCalendarModel } from "./calendar/useCalendarModel"
import { parseIsoDate } from "../lib/schedules/aggregations"
import {
  defaultZoomForLens,
  filterSchedulesForLens,
  type SchedulesCalendarQuickLens,
} from "../lib/schedules/schedules-calendar-lens"
import {
  formatIsoDurationRange,
  mappleScheduleToSlotRequestRow,
} from "../lib/schedules/schedules-calendar-adapter"
import { buildSchedulesCalendarDataBundle } from "../lib/schedules/schedules-calendar-bundle"
import type { SlotRequestRow } from "../lib/slot-requests-calendar/types"
import type { ExperienceType, OnboardingStatus, ScheduleStatus } from "../lib/schedules/types"
import {
  EMPTY_LIST_FILTERS,
  deriveOffboardingStatus,
  deriveOngoingStatus,
  extractListFilterOptions,
  filterSchedulesListRows,
  formatAvailabilityLabel,
  formatDaysOfWeekDisplay,
  formatScheduleListLocation,
  formatScheduleProgramType,
  formatShiftDisplay,
  ONBOARDING_BADGE_STYLES,
  PHASE_BADGE_STYLES,
  SCHEDULE_STATUS_BADGE_STYLES,
  type PhaseComplianceStatus,
  type ScheduleListFilterState,
  type ScheduleTimingFilter,
} from "../lib/schedules/schedules-list"

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100]

const INDIVIDUAL_TABLE_COLUMNS: { key: string; label: string; width: number; sortable?: boolean }[] = [
  { key: "availability", label: "Availability Name", width: 240, sortable: true },
  { key: "id", label: "Schedule ID", width: 110 },
  { key: "student", label: "Student Details", width: 170 },
  { key: "school", label: "School Name", width: 220 },
  { key: "preceptor", label: "Preceptor", width: 130 },
  { key: "location", label: "Location Name", width: 280 },
  { key: "duration", label: "Schedule Duration", width: 200 },
  { key: "shift", label: "Shift", width: 180 },
  { key: "days", label: "Days of the Week", width: 130 },
  { key: "rotation", label: "Rotation Details", width: 130 },
  { key: "course", label: "Course Details", width: 130 },
  { key: "scheduleStatus", label: "Schedule Status", width: 120 },
  { key: "ongoing", label: "Ongoing Status", width: 130 },
  { key: "offboarding", label: "Offboarding Status", width: 140 },
  { key: "programType", label: "Program Type", width: 200 },
  { key: "onboarding", label: "Onboarding Status", width: 140 },
  { key: "actions", label: "Actions", width: 90 },
]

const TABLE_MIN_WIDTH = INDIVIDUAL_TABLE_COLUMNS.reduce((sum, col) => sum + col.width, 0)

const TABLE_HEAD_BG = "#E8EAF6"
const STICKY_AVAILABILITY_WIDTH =
  INDIVIDUAL_TABLE_COLUMNS.find((c) => c.key === "availability")?.width ?? 240
const STICKY_ONBOARDING_WIDTH =
  INDIVIDUAL_TABLE_COLUMNS.find((c) => c.key === "onboarding")?.width ?? 140
const STICKY_ACTIONS_WIDTH =
  INDIVIDUAL_TABLE_COLUMNS.find((c) => c.key === "actions")?.width ?? 90
const STICKY_RIGHT_ONBOARDING = STICKY_ACTIONS_WIDTH

function stickyLeftCellStyle(width: number, isHeader: boolean): CSSProperties {
  return {
    position: "sticky",
    left: 0,
    top: isHeader ? 0 : undefined,
    zIndex: isHeader ? 32 : 10,
    minWidth: width,
    maxWidth: width,
    width,
    backgroundColor: isHeader ? TABLE_HEAD_BG : "#fff",
    boxShadow: "4px 0 8px -2px rgba(0,0,0,0.12)",
  }
}

function stickyRightCellStyle(
  width: number,
  right: number,
  isHeader: boolean,
  withShadow = true,
): CSSProperties {
  return {
    position: "sticky",
    right,
    top: isHeader ? 0 : undefined,
    zIndex: isHeader ? 32 : 10,
    minWidth: width,
    maxWidth: width,
    width,
    backgroundColor: isHeader ? TABLE_HEAD_BG : "#fff",
    ...(withShadow ? { boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.12)" } : {}),
  }
}

function stickyHeaderStyle(colKey: string, width: number): CSSProperties | undefined {
  if (colKey === "availability") return stickyLeftCellStyle(width, true)
  if (colKey === "onboarding") {
    return stickyRightCellStyle(width, STICKY_RIGHT_ONBOARDING, true)
  }
  if (colKey === "actions") return stickyRightCellStyle(width, 0, true, false)
  return undefined
}

function stickyBodyStyle(colKey: string, width: number): CSSProperties | undefined {
  if (colKey === "availability") return stickyLeftCellStyle(width, false)
  if (colKey === "onboarding") {
    return stickyRightCellStyle(width, STICKY_RIGHT_ONBOARDING, false)
  }
  if (colKey === "actions") return stickyRightCellStyle(width, 0, false, false)
  return undefined
}

const STICKY_BODY_CELL_CLASS = "group-hover:bg-indigo-50/60 transition-colors"

const FILTER_CHIP_DEFS: {
  key: keyof ScheduleListFilterState
  label: string
  icon: "tag" | "clipboard" | "graduationCap" | "mapPin" | "location" | "circle" | "circleCheck"
  optionsKey: keyof ReturnType<typeof extractListFilterOptions>
}[] = [
  { key: "disciplines", label: "Disciplines", icon: "tag", optionsKey: "disciplines" },
  { key: "programs", label: "Programs", icon: "clipboard", optionsKey: "programs" },
  { key: "schools", label: "Schools", icon: "graduationCap", optionsKey: "schools" },
  { key: "locationGroups", label: "Location Groups", icon: "mapPin", optionsKey: "locationGroups" },
  { key: "locations", label: "Locations", icon: "location", optionsKey: "locations" },
  { key: "scheduleStatuses", label: "Schedule Status", icon: "circle", optionsKey: "scheduleStatuses" },
  { key: "onboardingStatuses", label: "Onboarding Status", icon: "circleCheck", optionsKey: "onboardingStatuses" },
]

function OnboardingBadge({ status }: { status: OnboardingStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium font-['Roboto'] whitespace-nowrap ${ONBOARDING_BADGE_STYLES[status]}`}
    >
      {status}
      {status === "Compliant" && (
        <FontAwesomeIcon name="eye" className="w-3 h-3" aria-hidden="true" />
      )}
    </span>
  )
}

function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-['Roboto'] whitespace-nowrap ${SCHEDULE_STATUS_BADGE_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

function PhaseStatusBadge({ status }: { status: PhaseComplianceStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-['Roboto'] whitespace-nowrap ${PHASE_BADGE_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

interface SchedulesListViewProps {
  rows: ScheduleRecord[]
  referenceDate: string
}

export function SchedulesListView({ rows, referenceDate }: SchedulesListViewProps) {
  const [activeView, setActiveView] = useState<SchedulesListViewMode>("grid")
  const [experienceType, setExperienceType] = useState<ExperienceType>("Individual")
  const [timingFilter, setTimingFilter] = useState<ScheduleTimingFilter>("all")
  const [studentSearch, setStudentSearch] = useState("")
  const [listFilters, setListFilters] = useState<ScheduleListFilterState>(EMPTY_LIST_FILTERS)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [quickLens, setQuickLens] = useState<SchedulesCalendarQuickLens>("today")
  const [calendarPeriodAnchor, setCalendarPeriodAnchor] = useState<Date>(() =>
    parseIsoDate(referenceDate),
  )

  const filterSourceRows = useMemo(
    () =>
      activeView === "grid"
        ? rows.filter((r) => r.experienceType === experienceType)
        : rows,
    [rows, experienceType, activeView],
  )

  const filterOptions = useMemo(
    () => extractListFilterOptions(filterSourceRows),
    [filterSourceRows],
  )

  const filtered = useMemo(() => {
    const list = filterSchedulesListRows(rows, {
      referenceDate,
      experienceType: activeView === "grid" ? experienceType : undefined,
      timing: timingFilter,
      studentSearch,
      filters: listFilters,
    })
    return [...list].sort((a, b) => {
      const cmp = formatAvailabilityLabel(a).localeCompare(formatAvailabilityLabel(b))
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [rows, referenceDate, activeView, experienceType, timingFilter, studentSearch, listFilters, sortDir])

  const calendarSlotRows = useMemo(
    () => filtered.map(mappleScheduleToSlotRequestRow),
    [filtered],
  )

  const focusDate = useMemo(() => parseIsoDate(referenceDate), [referenceDate])

  const buildSchedulesBundle = useCallback(
    (scopedRows: SlotRequestRow[]) => {
      const ids = new Set(scopedRows.map((r) => r.id))
      const scoped = filterSchedulesForLens(
        filtered.filter((s) => ids.has(s.id)),
        quickLens,
        referenceDate,
        calendarPeriodAnchor,
      )
      return buildSchedulesCalendarDataBundle(scoped)
    },
    [filtered, quickLens, referenceDate, calendarPeriodAnchor],
  )

  const calendarModel = useCalendarModel(calendarSlotRows, {
    buildBundle: buildSchedulesBundle,
    kpiReferenceDate: focusDate,
    schedulesContext: true,
  })

  const applyQuickLens = useCallback(
    (lens: SchedulesCalendarQuickLens) => {
      setQuickLens(lens)
      calendarModel.setZoom(defaultZoomForLens(lens))
      if (lens === "today") {
        calendarModel.scrollToToday()
      }
      if (lens === "capacity") {
        calendarModel.toggleAll()
      }
    },
    [calendarModel],
  )

  useEffect(() => {
    if (activeView !== "calendar") return
    setQuickLens("today")
    calendarModel.setZoom("day")
    calendarModel.scrollToToday()
    // Only when switching into calendar view
    // eslint-disable-next-line react-hooks/exhaustive-deps -- calendarModel methods are stable enough for view entry
  }, [activeView])

  const setFilterKey = <K extends keyof ScheduleListFilterState>(
    key: K,
    value: ScheduleListFilterState[K],
  ) => {
    setListFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const resetAllFilters = () => {
    setStudentSearch("")
    setTimingFilter("all")
    setListFilters(EMPTY_LIST_FILTERS)
    setCurrentPage(1)
  }

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const pageRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const pageNumbers = (): (number | "...")[] => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    return [1, 2, 3, 4, "...", totalPages]
  }

  const resetPage = () => setCurrentPage(1)

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50 min-h-0">
      <SchedulesViewToolbar
        activeView={activeView}
        onViewChange={setActiveView}
        calendarModel={calendarModel}
        timingFilter={timingFilter}
        onTimingChange={(timing) => {
          setTimingFilter(timing)
          resetPage()
        }}
        experienceType={experienceType}
        onExperienceTypeChange={(type) => {
          setExperienceType(type)
          resetPage()
        }}
        quickLens={quickLens}
        onQuickLensChange={applyQuickLens}
      />

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-0 border border-[#3F51B5] rounded overflow-hidden flex-shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Roboto'] text-[#3F51B5] bg-white hover:bg-blue-50 transition-colors border-r border-[#3F51B5] whitespace-nowrap"
          >
            <span>Student Name</span>
            <FontAwesomeIcon name="chevronDown" className="w-2.5 h-2.5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white">
            <FontAwesomeIcon
              name="search"
              className="w-3 h-3 text-gray-400 flex-shrink-0"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by Student Name"
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                resetPage()
              }}
              className="text-xs font-['Roboto'] text-gray-700 placeholder-gray-400 outline-none w-44 bg-transparent"
              aria-label="Search by student name"
            />
          </div>
        </div>

        {FILTER_CHIP_DEFS.map(({ key, label, icon, optionsKey }) => (
          <SchedulesListFilterChip
            key={key}
            label={label}
            icon={icon}
            options={filterOptions[optionsKey]}
            selected={listFilters[key] as string[]}
            onChange={(next) => setFilterKey(key, next as ScheduleListFilterState[typeof key])}
          />
        ))}

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Roboto'] text-[#3F51B5] bg-white border border-[#3F51B5] rounded hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon name="plus" className="w-3 h-3" aria-hidden="true" />
            Add Filter
          </button>
          <button
            type="button"
            onClick={resetAllFilters}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors min-h-6 min-w-6"
            aria-label="Reset filters"
          >
            <FontAwesomeIcon name="arrowRotateLeft" className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors min-h-6 min-w-6"
            aria-label="Export"
          >
            <FontAwesomeIcon name="arrowUpRightFromSquare" className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <div className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden="true" />
          <button
            type="button"
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors min-h-6 min-w-6"
            aria-label="Configure columns"
          >
            <FontAwesomeIcon name="sliders" className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {activeView === "calendar" ? (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <SchedulesCalendarWorkspace
            model={calendarModel}
            focusDate={focusDate}
            referenceDate={referenceDate}
            scheduleRows={filtered}
            quickLens={quickLens}
            onQuickLensChange={applyQuickLens}
            onPeriodAnchorChange={setCalendarPeriodAnchor}
          />
        </div>
      ) : (
        <>
      {/* Table */}
      <div className="flex-1 px-4 py-3 min-h-0 overflow-hidden">
        <div className="rounded-lg border border-gray-200 shadow-sm bg-white flex flex-col h-full min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <table
              className="w-full"
              style={{
                minWidth: TABLE_MIN_WIDTH,
                tableLayout: "fixed",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <colgroup>
                {INDIVIDUAL_TABLE_COLUMNS.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-20" style={{ backgroundColor: TABLE_HEAD_BG }}>
                <tr>
                  {INDIVIDUAL_TABLE_COLUMNS.map((col, index) => (
                    <th
                      key={col.key}
                      style={stickyHeaderStyle(col.key, col.width)}
                      className={`px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-b border-gray-300 whitespace-nowrap ${
                        index < INDIVIDUAL_TABLE_COLUMNS.length - 1 ? "border-r" : ""
                      }`}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                          className="inline-flex items-center gap-1.5 hover:text-[#3F51B5]"
                        >
                          {col.label}
                          <FontAwesomeIcon
                            name={sortDir === "asc" ? "chevronUp" : "chevronDown"}
                            className="w-2.5 h-2.5 text-gray-500"
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={INDIVIDUAL_TABLE_COLUMNS.length}
                      className="px-3 py-12 text-center text-sm text-gray-500 font-['Roboto']"
                    >
                      No schedules match the current filters.
                    </td>
                  </tr>
                ) : (
                pageRows.map((row) => {
                  const availability = formatAvailabilityLabel(row)
                  const locationLabel = formatScheduleListLocation(row)
                  const durationLabel = formatIsoDurationRange(row.startDate, row.endDate)
                  const programType = formatScheduleProgramType(row)
                  const ongoingStatus = deriveOngoingStatus(row, referenceDate)
                  const offboardingStatus = deriveOffboardingStatus(row, referenceDate)
                  return (
                    <tr key={row.id} className="hover:bg-indigo-50/60 transition-colors group">
                      <td
                        className={`px-3 py-2.5 text-xs font-['Roboto'] border-r border-gray-100 ${STICKY_BODY_CELL_CLASS}`}
                        style={stickyBodyStyle("availability", STICKY_AVAILABILITY_WIDTH)}
                      >
                        {availability === "NA" ? (
                          <span className="text-gray-500">NA</span>
                        ) : (
                          <button
                            type="button"
                            className="text-[#3F51B5] hover:underline text-left truncate block max-w-full"
                            title={availability}
                          >
                            {availability}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-mono tabular-nums text-gray-700 border-r border-gray-100 whitespace-nowrap">
                        {row.id}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] border-r border-gray-100">
                        {row.studentName ? (
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="text-[#3F51B5] hover:underline font-medium truncate block max-w-full text-left"
                              title={row.studentName}
                            >
                              {row.studentName}
                            </button>
                            {row.studentEmail && (
                              <p className="text-[11px] text-gray-500 truncate mt-0.5" title={row.studentEmail}>
                                {row.studentEmail}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="px-2.5 py-1 text-[11px] font-['Roboto'] text-gray-600 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100 transition-colors whitespace-nowrap"
                          >
                            Schedule student
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100">
                        <span className="line-clamp-2" title={row.school}>
                          {row.school}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100">
                        <span className="truncate block" title={row.preceptorName ?? undefined}>
                          {row.preceptorName ?? ""}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100">
                        <span className="line-clamp-2" title={locationLabel}>
                          {locationLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">
                        {durationLabel}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100">
                        <span className="truncate block" title={row.shift ?? undefined}>
                          {formatShiftDisplay(row.shift)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">
                        {formatDaysOfWeekDisplay(row.daysOfWeek)}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-500 border-r border-gray-100">
                        {/* Rotation details not present in Mapple Excel export */}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-500 border-r border-gray-100">
                        {/* Course details not present in Mapple Excel export */}
                      </td>
                      <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap">
                        <ScheduleStatusBadge status={row.scheduleStatus} />
                      </td>
                      <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap">
                        <PhaseStatusBadge status={ongoingStatus} />
                      </td>
                      <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap">
                        <PhaseStatusBadge status={offboardingStatus} />
                      </td>
                      <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100">
                        <span className="line-clamp-2" title={programType}>
                          {programType}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2.5 border-r border-gray-100 whitespace-nowrap ${STICKY_BODY_CELL_CLASS}`}
                        style={stickyBodyStyle("onboarding", STICKY_ONBOARDING_WIDTH)}
                      >
                        <OnboardingBadge status={row.onboardingStatus} />
                      </td>
                      <td
                        className={`px-3 py-2.5 whitespace-nowrap ${STICKY_BODY_CELL_CLASS}`}
                        style={stickyBodyStyle("actions", STICKY_ACTIONS_WIDTH)}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 rounded text-gray-500 hover:text-[#3F51B5] hover:bg-blue-50 transition-colors min-h-6 min-w-6"
                            aria-label={`Edit schedule ${row.id}`}
                          >
                            <FontAwesomeIcon name="penToSquare" className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded text-gray-500 hover:text-[#3F51B5] hover:bg-blue-50 transition-colors min-h-6 min-w-6"
                            aria-label={`Comments for schedule ${row.id}`}
                          >
                            <FontAwesomeIcon name="comments" className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-['Roboto'] whitespace-nowrap">Rows per page</span>
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                resetPage()
              }}
              className="text-xs font-['Roboto'] text-gray-700 border border-gray-300 rounded px-2 py-1 pr-6 appearance-none bg-white hover:border-gray-400 focus:outline-none focus:border-[#3F51B5] cursor-pointer"
              aria-label="Rows per page"
            >
              {ROWS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <FontAwesomeIcon
              name="chevronDown"
              className="w-2.5 h-2.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        <span className="text-xs text-gray-500 font-['Roboto'] whitespace-nowrap">
          Page {currentPage} of {totalPages} ({totalItems.toLocaleString()} items)
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-6 min-w-6"
            aria-label="First page"
          >
            <FontAwesomeIcon name="anglesLeft" className="w-3 h-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-6 min-w-6"
            aria-label="Previous page"
          >
            <FontAwesomeIcon name="angleLeft" className="w-3 h-3" aria-hidden="true" />
          </button>

          {pageNumbers().map((pg, i) =>
            pg === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400 font-['Roboto']">
                ...
              </span>
            ) : (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg as number)}
                className={`w-7 h-7 text-xs font-['Roboto'] rounded transition-colors min-h-6 min-w-6 ${
                  currentPage === pg
                    ? "bg-[#3F51B5] text-white font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label={`Page ${pg}`}
                aria-current={currentPage === pg ? "page" : undefined}
              >
                {pg}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-6 min-w-6"
            aria-label="Next page"
          >
            <FontAwesomeIcon name="angleRight" className="w-3 h-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-6 min-w-6"
            aria-label="Last page"
          >
            <FontAwesomeIcon name="anglesRight" className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
