import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TabBar } from "./TabBar"
import { FontAwesomeIcon } from "./font-awesome-icon"
import { SchedulesListView } from "./SchedulesListView"
import { useSchedulesData } from "../lib/schedules/use-schedules-data"
import {
  buildRecentActivities,
  computeKpis,
  computeMonthBarChart,
  computeOnboardingDonut,
  computeScheduleStatusDonut,
  filterByDisciplines,
  scheduleIdSet,
} from "../lib/schedules/aggregations"
import type { ScheduleStatus } from "../lib/schedules/types"

const SCHEDULE_STATUS_COLORS: Record<string, string> = {
  Confirmed: "#22C55E",
  "Not Confirmed": "#F59E0B",
  "To be Scheduled": "#6B7280",
  Cancelled: "#EF4444",
}

const ONBOARDING_COLORS: Record<string, string> = {
  Compliant: "#22C55E",
  "Some action needed": "#EF4444",
  "Not started": "#F59E0B",
}

const ACTIVITY_STATUS_COLORS: Record<ScheduleStatus, string> = {
  Confirmed: "#22C55E",
  "To be Scheduled": "#6B7280",
  "Not Confirmed": "#F59E0B",
  Cancelled: "#EF4444",
}

interface SchedulesPageProps {
  currentPath: string
  onNavigate: (href: string) => void
}

function DataLoadingPanel() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-[#3F51B5] border-t-transparent animate-spin" />
        <p className="text-sm font-['Roboto'] text-gray-500">Loading schedules…</p>
      </div>
    </div>
  )
}

function DisciplineFilter({
  disciplines,
  selected,
  onChange,
}: {
  disciplines: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const options = disciplines.filter((d) => d.toLowerCase().includes(query.toLowerCase()))
  const allSelected = selected.length === 0

  const toggle = (d: string) => {
    if (selected.includes(d)) onChange(selected.filter((x) => x !== d))
    else onChange([...selected, d])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Roboto'] text-gray-700 border border-gray-200 rounded bg-white hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FontAwesomeIcon name="graduationCap" className="w-3 h-3 text-gray-500" aria-hidden="true" />
        Discipline
        {!allSelected && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-50 text-[#3F51B5] rounded text-[10px]">
            {selected.length}
          </span>
        )}
        <FontAwesomeIcon name="chevronDown" className="w-2.5 h-2.5 text-gray-400" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded border border-gray-200 bg-white shadow-lg">
          <div className="px-2 py-2 border-b border-gray-100">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search discipline"
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-['Roboto']"
              aria-label="Search discipline"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1" role="listbox" aria-label="Discipline options">
            {options.map((d) => {
              const checked = selected.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(d)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-['Roboto'] hover:bg-gray-50"
                >
                  <span
                    className={`inline-flex size-3.5 items-center justify-center rounded border ${
                      checked ? "bg-[#3F51B5] border-[#3F51B5]" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <FontAwesomeIcon name="check" className="w-2 h-2 text-white" aria-hidden="true" />
                    )}
                  </span>
                  {d}
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
            <button
              type="button"
              disabled={allSelected}
              onClick={() => onChange([])}
              className="text-[11px] text-gray-500 disabled:opacity-40 font-['Roboto']"
            >
              Clear selection
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange([...disciplines])}
                className="text-[11px] text-[#3F51B5] font-['Roboto']"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] text-[#3F51B5] font-['Roboto']"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  icon,
  iconClass,
  label,
  count,
  schoolCount,
}: {
  icon: string
  iconClass: string
  label: string
  count: number
  schoolCount: number
}) {
  return (
    <div className="flex h-full flex-col rounded border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <FontAwesomeIcon name={icon} className={`w-4 h-4 ${iconClass}`} aria-hidden="true" />
        <span className="text-xs font-medium text-gray-700 font-['Roboto']">{label}</span>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 font-['Roboto'] leading-none">
            {count.toLocaleString()}
          </p>
          <p className="mt-1.5 text-[11px] text-gray-500 font-['Roboto']">
            Across <span className="font-semibold text-gray-700">{schoolCount}</span> Schools
          </p>
        </div>
      </div>
    </div>
  )
}

export function SchedulesPage({ currentPath, onNavigate }: SchedulesPageProps) {
  const data = useSchedulesData()
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
  const [overviewWindow, setOverviewWindow] = useState<"30d" | "all">("30d")

  const tabDefs = [
    { label: "Overview", href: "/schedules" },
    { label: "Schedules List", href: "/schedules/list" },
    { label: "Report", href: "/schedules/report" },
  ]

  const activeTab =
    currentPath === "/schedules/list"
      ? "Schedules List"
      : currentPath === "/schedules/report"
        ? "Report"
        : "Overview"

  const referenceDate = data.manifest?.referenceDate ?? "2026-06-18"
  const disciplines = data.manifest?.disciplines ?? []

  const filteredRows = useMemo(
    () => filterByDisciplines(data.schedules, selectedDisciplines),
    [data.schedules, selectedDisciplines],
  )

  const kpis = useMemo(
    () => computeKpis(filteredRows, referenceDate),
    [filteredRows, referenceDate],
  )

  const scheduleDonut = useMemo(
    () => computeScheduleStatusDonut(filteredRows, referenceDate, overviewWindow),
    [filteredRows, referenceDate, overviewWindow],
  )

  const onboardingDonut = useMemo(
    () => computeOnboardingDonut(filteredRows, referenceDate, overviewWindow),
    [filteredRows, referenceDate, overviewWindow],
  )

  const monthBars = useMemo(
    () =>
      computeMonthBarChart(
        data.byMonth,
        selectedDisciplines.length > 0 ? scheduleIdSet(filteredRows) : null,
        referenceDate,
        12,
      ),
    [data.byMonth, filteredRows, selectedDisciplines.length, referenceDate],
  )

  const activities = useMemo(() => buildRecentActivities(filteredRows, 10), [filteredRows])

  const maxBar = useMemo(() => {
    let m = 0
    for (const p of monthBars) {
      m = Math.max(m, p.approved, p.confirmed, p.compliant)
    }
    return Math.ceil(m / 250) * 250 || 250
  }, [monthBars])

  const renderOverview = () => (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-w-0">
        <div className="flex items-center gap-3 flex-wrap rounded border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700 font-['Roboto']">
            <FontAwesomeIcon name="filter" className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
            Filters:
          </div>
          <DisciplineFilter
            disciplines={disciplines}
            selected={selectedDisciplines}
            onChange={setSelectedDisciplines}
          />
          <button
            type="button"
            onClick={() => setSelectedDisciplines([])}
            disabled={selectedDisciplines.length === 0}
            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-40"
            aria-label="Reset filters"
          >
            <FontAwesomeIcon name="refresh" className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard
            icon="chartLine"
            iconClass="text-blue-600"
            label="Ongoing Schedules"
            count={kpis.ongoing.count}
            schoolCount={kpis.ongoing.schoolCount}
          />
          <KpiCard
            icon="circleCheck"
            iconClass="text-green-600"
            label="Upcoming Confirmed Schedules"
            count={kpis.upcomingConfirmed.count}
            schoolCount={kpis.upcomingConfirmed.schoolCount}
          />
          <KpiCard
            icon="clock"
            iconClass="text-orange-500"
            label="Upcoming Non-Confirmed Schedules"
            count={kpis.upcomingNonConfirmed.count}
            schoolCount={kpis.upcomingNonConfirmed.schoolCount}
          />
        </div>

        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-gray-900 font-['Roboto']">
              Upcoming Schedules Overview
            </h2>
            <TabBar
              tabs={["Next 30 Days", "All Upcoming"]}
              activeTab={overviewWindow === "30d" ? "Next 30 Days" : "All Upcoming"}
              onTabChange={(tab) => setOverviewWindow(tab === "Next 30 Days" ? "30d" : "all")}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="min-h-[320px]">
              <h3 className="text-xs font-semibold text-gray-900 font-['Roboto'] text-center mb-0.5">
                Schedules Overview
              </h3>
              <p className="text-[10px] text-gray-500 font-['Roboto'] text-center mb-2">
                Status of schedules
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={scheduleDonut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={1}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {scheduleDonut.map((entry) => (
                      <Cell key={entry.name} fill={SCHEDULE_STATUS_COLORS[entry.name] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, fontFamily: "Roboto" }}
                    formatter={(value: number) => [value, "Count"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="min-h-[320px]">
              <h3 className="text-xs font-semibold text-gray-900 font-['Roboto'] text-center mb-0.5">
                Student Onboarding Overview
              </h3>
              <p className="text-[10px] text-gray-500 font-['Roboto'] text-center mb-2">
                Status of onboarding requirements for confirmed schedules
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={onboardingDonut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={1}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {onboardingDonut.map((entry) => (
                      <Cell key={entry.name} fill={ONBOARDING_COLORS[entry.name] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, fontFamily: "Roboto" }}
                    formatter={(value: number) => [value, "Count"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon name="barChart" className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 font-['Roboto']">
                Slot Approvals and Confirmation (Based on start month)
              </h3>
            </div>
            <p className="text-[11px] text-gray-600 font-['Roboto']">
              Overview of 12 months based on available data: approved schedules, confirmed
              schedules, and those compliant to start.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthBars} margin={{ top: 8, right: 8, left: -8, bottom: 48 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontFamily: "Roboto", fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 9, fontFamily: "Roboto", fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                domain={[0, maxBar]}
                width={36}
              />
              <Tooltip contentStyle={{ fontSize: 10, fontFamily: "Roboto" }} />
              <Bar dataKey="approved" name="Schedules Approved" fill="#F59E0B" barSize={10} />
              <Bar dataKey="confirmed" name="Schedules Confirmed" fill="#3B82F6" barSize={10} />
              <Bar dataKey="compliant" name="Students Fully Compliant" fill="#22C55E" barSize={10} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Roboto" }} iconSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <aside className="w-[280px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto hidden lg:block">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100 z-10">
          <h3 className="text-sm font-semibold text-gray-900 font-['Roboto']">Recent Activities</h3>
        </div>
        <div className="px-3 py-2 space-y-1">
          {activities.map((a) => (
            <div
              key={a.id}
              className="flex gap-2.5 rounded p-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${ACTIVITY_STATUS_COLORS[a.scheduleStatus]}22` }}
                >
                  <FontAwesomeIcon
                    name="circleCheck"
                    className="w-3 h-3"
                    style={{ color: ACTIVITY_STATUS_COLORS[a.scheduleStatus] }}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-800 font-['Roboto'] leading-snug">{a.description}</p>
                <div className="mt-1 space-y-0.5">
                  {a.discipline && (
                    <p className="text-[10px] text-gray-600 font-['Roboto']">
                      <span className="font-medium">Discipline:</span> {a.discipline}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 font-['Roboto']">
                    <span className="font-medium">Location:</span> {a.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )

  const renderReport = () => (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 font-['Roboto'] mb-1">
          Schedule status by discipline
        </h3>
        <p className="text-[11px] text-gray-600 font-['Roboto'] mb-4">
          Count of schedules per discipline from loaded data
          {selectedDisciplines.length > 0 ? " (filtered)" : ""}.
        </p>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={disciplines.map((d) => {
              const rows = filterByDisciplines(data.schedules, [d])
              return {
                discipline: d.length > 18 ? `${d.slice(0, 16)}…` : d,
                confirmed: rows.filter((r) => r.scheduleStatus === "Confirmed").length,
                other: rows.filter((r) => r.scheduleStatus !== "Confirmed").length,
              }
            })}
            margin={{ top: 8, right: 8, left: -8, bottom: 64 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="discipline"
              tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 9, fontFamily: "Roboto", fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip contentStyle={{ fontSize: 10, fontFamily: "Roboto" }} />
            <Bar dataKey="confirmed" name="Confirmed" stackId="a" fill="#22C55E" />
            <Bar dataKey="other" name="Other statuses" stackId="a" fill="#94A3B8" radius={[2, 2, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Roboto" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  if (data.status === "loading") return <DataLoadingPanel />

  if (data.status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md rounded border border-red-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-gray-900 font-['Roboto'] mb-2">
            Could not load schedule data
          </p>
          <p className="text-xs text-gray-600 font-['Roboto']">{data.error}</p>
          <p className="text-xs text-gray-500 font-['Roboto'] mt-3">
            Run <code className="font-mono">npm run build:schedule-index</code> to generate data
            from the Excel file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 grid grid-cols-3 items-center flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900 font-['Roboto'] whitespace-nowrap">
          Schedules and Onboarding
        </h1>
        <div className="flex justify-center">
          <TabBar
            tabs={["Overview", "Schedules List", "Report"]}
            activeTab={activeTab}
            onTabChange={(label) => {
              const t = tabDefs.find((x) => x.label === label)
              if (t) onNavigate(t.href)
            }}
          />
        </div>
        <div />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeTab === "Overview" && renderOverview()}
        {activeTab === "Schedules List" && (
          <SchedulesListView rows={filteredRows} referenceDate={referenceDate} />
        )}
        {activeTab === "Report" && renderReport()}
      </div>
    </div>
  )
}
