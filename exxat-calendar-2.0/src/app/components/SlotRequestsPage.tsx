import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import { TabBar } from "./TabBar";
import { FontAwesomeIcon } from "./font-awesome-icon";
import { SlotRequestsListView } from "./SlotRequestsListView";

// ─── Static data ────────────────────────────────────────────────────────────

const requestApprovalData = [
  { month: "Oct '24", approved: 180, pending: 70, inProgress: 28, declined: 12 },
  { month: "Nov '24", approved: 220, pending: 90, inProgress: 35, declined: 18 },
  { month: "Dec '24", approved: 140, pending: 55, inProgress: 22, declined: 9 },
  { month: "Jan '25", approved: 290, pending: 115, inProgress: 44, declined: 20 },
  { month: "Feb '25", approved: 260, pending: 105, inProgress: 40, declined: 17 },
  { month: "Mar '25", approved: 370, pending: 145, inProgress: 58, declined: 24 },
  { month: "Apr '25", approved: 440, pending: 175, inProgress: 68, declined: 29 },
  { month: "May '25", approved: 530, pending: 210, inProgress: 80, declined: 34 },
  { month: "Jun '25", approved: 395, pending: 158, inProgress: 61, declined: 27 },
  { month: "Jul '25", approved: 590, pending: 235, inProgress: 91, declined: 39 },
  { month: "Aug '25", approved: 750, pending: 295, inProgress: 112, declined: 48 },
  { month: "Sep '25", approved: 510, pending: 200, inProgress: 78, declined: 33 },
];

const agingData = [
  { period: "< 7d",    inProgress: 5,  pending: 10 },
  { period: "7-14d",   inProgress: 7,  pending: 14 },
  { period: "14-30d",  inProgress: 11, pending: 24 },
  { period: "30-60d",  inProgress: 16, pending: 84 },
  { period: "61-90d",  inProgress: 9,  pending: 42 },
  { period: "90-180d", inProgress: 5,  pending: 26 },
  { period: ">180d",   inProgress: 3,  pending: 12 },
];

const monthlyInflowData = [
  { month: "Oct '24", slots: 285,  requests: 12 },
  { month: "Nov '24", slots: 342,  requests: 14 },
  { month: "Dec '24", slots: 198,  requests: 9  },
  { month: "Jan '25", slots: 412,  requests: 17 },
  { month: "Feb '25", slots: 378,  requests: 15 },
  { month: "Mar '25", slots: 521,  requests: 21 },
  { month: "Apr '25", slots: 638,  requests: 25 },
  { month: "May '25", slots: 748,  requests: 30 },
  { month: "Jun '25", slots: 572,  requests: 22 },
  { month: "Jul '25", slots: 848,  requests: 35 },
  { month: "Aug '25", slots: 1024, requests: 43 },
  { month: "Sep '25", slots: 698,  requests: 28 },
];

// ─── US Tile Map ─────────────────────────────────────────────────────────────

const STATE_SLOTS: Record<string, number> = {
  ME:3,  NH:4,  VT:2,  MA:14, RI:4,  CT:9,  NY:28,
  PA:24, NJ:19, DE:11, MD:48, DC:31, VA:38, WV:6,
  NC:16, SC:9,  GA:13, FL:21, OH:12, MI:10, IN:7,
  IL:15, WI:6,  MN:8,  IA:5,  MO:10, KY:8,  TN:11,
  AL:7,  MS:5,  AR:5,  LA:7,  TX:19, OK:6,  KS:4,
  NE:4,  SD:2,  ND:2,  MT:2,  WY:2,  CO:9,  UT:5,
  NV:6,  AZ:11, NM:4,  ID:3,  WA:8,  OR:5,  CA:23,
  HI:3,  AK:2,
};

// [abbr, col (1-indexed), row (1-indexed)] — 11 cols × 9 rows
const TILE_CELLS: [string, number, number][] = [
  ["ME", 11, 1],
  ["NH", 10, 2], ["VT", 9, 2],
  ["WA", 1, 3], ["MT", 2, 3], ["ND", 3, 3], ["MN", 4, 3], ["WI", 5, 3], ["MI", 6, 3], ["NY", 8, 3], ["MA", 9, 3], ["RI", 10, 3],
  ["OR", 1, 4], ["ID", 2, 4], ["WY", 3, 4], ["SD", 4, 4], ["IA", 5, 4], ["IN", 6, 4], ["OH", 7, 4], ["PA", 8, 4], ["NJ", 9, 4], ["CT", 10, 4], ["DE", 11, 4],
  ["CA", 1, 5], ["NV", 2, 5], ["CO", 3, 5], ["NE", 4, 5], ["MO", 5, 5], ["KY", 6, 5], ["WV", 7, 5], ["VA", 8, 5], ["MD", 9, 5], ["DC", 10, 5],
  ["AZ", 2, 6], ["UT", 3, 6], ["KS", 4, 6], ["AR", 5, 6], ["TN", 6, 6], ["NC", 7, 6], ["SC", 8, 6],
  ["NM", 3, 7], ["TX", 4, 7], ["OK", 5, 7], ["MS", 6, 7], ["AL", 7, 7], ["GA", 8, 7],
  ["LA", 5, 8], ["FL", 8, 8],
  ["HI", 1, 9], ["AK", 2, 9],
];

function getStateColor(v: number): { bg: string; text: string } {
  if (v === 0)  return { bg: "#F3F4F6", text: "#9CA3AF" };
  if (v <= 4)   return { bg: "#EFF6FF", text: "#374151" };
  if (v <= 9)   return { bg: "#DBEAFE", text: "#374151" };
  if (v <= 19)  return { bg: "#BFDBFE", text: "#1E40AF" };
  if (v <= 29)  return { bg: "#93C5FD", text: "#1E40AF" };
  if (v <= 39)  return { bg: "#60A5FA", text: "#1E3A8A" };
  if (v <= 49)  return { bg: "#3B82F6", text: "#ffffff" };
  return        { bg: "#1D4ED8", text: "#ffffff" };
}

// ─── Recent Activities ───────────────────────────────────────────────────────

type ActivityStatus = "approved" | "pending" | "review";

interface Activity {
  status: ActivityStatus;
  description: string;
  discipline: string;
  location: string;
  meta: string;
}

const activities: Activity[] = [
  {
    status: "approved",
    description: "Request for 1 slot from Community College of Baltimore County - Essex Campus approved for the period Nov 25, 2026 - Dec 27, 2025",
    discipline: "Nursing",
    location: "49 - Behavioral Health",
    meta: "Calculated on Jun 4, 2026 by Diana Somoza",
  },
  {
    status: "approved",
    description: "2 slots approved for Towson University - Nursing - Graduate for Dec 3, 2026 - Dec 3, 2026",
    discipline: "Nursing",
    location: "49 - Med-Surg Title",
    meta: "Approved on Jun 4, 2026 by Diana Somoza",
  },
  {
    status: "approved",
    description: "4 slots approved for Towson University - Nursing - Graduate for Oct 16, 2026 - Dec 2, 2026",
    discipline: "Nursing",
    location: "49 - NICU",
    meta: "Approved on Jun 4, 2026 by Diana Somoza",
  },
  {
    status: "approved",
    description: "4 slots approved for Towson University - Nursing - Graduate for Dec 4, 2026",
    discipline: "Nursing",
    location: "49 - Med-Surg",
    meta: "Approved on Jun 4, 2026 by Diana Somoza",
  },
  {
    status: "pending",
    description: "Duke University - With requested 1 slot for Aug 24, 2026 - Dec 4, 2026",
    discipline: "Nursing",
    location: "49 - Psych-IR",
    meta: "Requested on Jun 4, 2026 by System Admin",
  },
  {
    status: "pending",
    description: "Duke University - With requested 4 slots for Oct 24, 2026 - Dec 4, 2026",
    discipline: "Nursing",
    location: "49 - Nursing Department",
    meta: "Requested on Jun 4, 2026 by System Admin",
  },
  {
    status: "pending",
    description: "Duke University - With requested 1 slot for Oct 24, 2026 - Dec 4, 2026",
    discipline: "Nursing",
    location: "49 - Behavioral Health",
    meta: "Requested on Jun 4, 2026 by System Admin",
  },
  {
    status: "review",
    description: "The George Washington University - Nursing - With requested 1 slot for Oct 31, 2026 - Nov 12, 2025",
    discipline: "Nursing",
    location: "48 - Med-Surg",
    meta: "In Review on Jun 4, 2026 by System Admin",
  },
  {
    status: "review",
    description: "The George Washington University - Nursing - With 4 requested slots for Oct 31, 2026 - Nov 22, 2025",
    discipline: "Nursing",
    location: "48 - Emergency Medicine",
    meta: "In Review on Jun 4, 2026 by System Admin",
  },
  {
    status: "review",
    description: "The George Washington University - Nursing - With 4 requested slots for Oct 31, 2026 - Nov 22, 2025",
    discipline: "Nursing",
    location: "48 - Orthopedics",
    meta: "In Review on Jun 4, 2026 by System Admin",
  },
  {
    status: "review",
    description: "The George Washington University - Nursing - With 4 requested slots for Oct 31, 2026",
    discipline: "Nursing",
    location: "48 - Medical Oncology",
    meta: "In Review on Jun 4, 2026 by System Admin",
  },
];

const STATUS_COLORS: Record<ActivityStatus, string> = {
  approved: "#3F51B5",
  pending:  "#F97316",
  review:   "#EAB308",
};

// ─── Component ───────────────────────────────────────────────────────────────

interface SlotRequestsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function SlotRequestsPage({ currentPath, onNavigate }: SlotRequestsPageProps) {
  const [disciplineFilter, setDisciplineFilter] = useState(true);

  const tabDefs = [
    { label: "Overview",           href: "/slot-requests" },
    { label: "Slot Requests List", href: "/slot-requests/list" },
    { label: "Reports",            href: "/slot-requests/reports" },
  ];

  const activeTab =
    currentPath === "/slot-requests/list"    ? "Slot Requests List" :
    currentPath === "/slot-requests/reports" ? "Reports" :
    "Overview";

  // ── Overview ──────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="flex flex-1 overflow-hidden">

      {/* Left: scrollable main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-w-0">

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-['Roboto'] text-gray-600 hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors">
            <FontAwesomeIcon name="sliders" className="w-3 h-3 text-gray-400" aria-hidden="true" />
            Filters
          </button>
          {disciplineFilter && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-['Roboto'] text-gray-700">
              <FontAwesomeIcon name="tag" className="w-2.5 h-2.5 text-[#3F51B5]" aria-hidden="true" />
              <span>Discipline</span>
              <button
                onClick={() => setDisciplineFilter(false)}
                className="ml-0.5 text-gray-400 hover:text-gray-600"
                aria-label="Remove Discipline filter"
              >
                <FontAwesomeIcon name="x" className="w-2 h-2" aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            className="p-1 hover:bg-gray-100 rounded text-gray-400 transition-colors"
            aria-label="Refresh filters"
          >
            <FontAwesomeIcon name="refresh" className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        {/* KPI strip */}
        <div className="bg-white rounded border border-gray-200 flex divide-x divide-gray-200 shadow-sm">
          <div className="flex-1 px-4 py-3 min-w-0">
            <p className="text-[11px] text-gray-500 font-['Roboto'] leading-none mb-1.5">Total Requests</p>
            <p className="text-[22px] font-bold text-gray-900 font-['Roboto'] leading-none">83</p>
            <p className="text-[11px] text-gray-400 font-['Roboto'] mt-1.5">271 slots</p>
          </div>
          <div className="flex-1 px-4 py-3 min-w-0">
            <p className="text-[11px] text-gray-500 font-['Roboto'] leading-none mb-1.5">Requests Approved</p>
            <p className="text-[22px] font-bold text-gray-900 font-['Roboto'] leading-none">16</p>
            <p className="text-[11px] text-gray-400 font-['Roboto'] mt-1.5">16 slots total</p>
          </div>
          <div className="flex-1 px-4 py-3 min-w-0">
            <p className="text-[11px] text-gray-500 font-['Roboto'] leading-none mb-1.5">Requests Declined</p>
            <p className="text-[22px] font-bold text-gray-900 font-['Roboto'] leading-none">5</p>
            <p className="text-[11px] text-gray-400 font-['Roboto'] mt-1.5">&nbsp;</p>
          </div>
          <div className="flex-1 px-4 py-3 min-w-0">
            <p className="text-[11px] text-gray-500 font-['Roboto'] leading-none mb-1.5">Request Pending</p>
            <p className="text-[22px] font-bold text-gray-900 font-['Roboto'] leading-none">181</p>
            <button className="flex items-center gap-1 text-[11px] text-[#3F51B5] font-['Roboto'] mt-1.5 hover:underline">
              <FontAwesomeIcon name="map" className="w-2.5 h-2.5" aria-hidden="true" />
              Link All Map
            </button>
          </div>
          <div className="flex-1 px-4 py-3 min-w-0">
            <p className="text-[11px] text-gray-500 font-['Roboto'] leading-none mb-1.5">Review in Progress</p>
            <p className="text-[22px] font-bold text-gray-900 font-['Roboto'] leading-none">1</p>
            <p className="text-[11px] text-gray-400 font-['Roboto'] mt-1.5">1 total slots</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-3">

          {/* Slot Requests and Approvals */}
          <div className="bg-white rounded border border-gray-200 p-3.5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-900 font-['Roboto'] leading-snug">
              Slot Requests and Approvals (Next 12 months view)
            </h3>
            <p className="text-[10px] text-gray-500 font-['Roboto'] mt-0.5 mb-2 leading-snug">
              Requested vs. Approved slot counts for the upcoming 12 months (by start month of date)
            </p>
            <ResponsiveContainer width="100%" height={188}>
              <BarChart
                data={requestApprovalData}
                margin={{ top: 2, right: 4, left: -16, bottom: 38 }}
                barSize={9}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 2500]}
                  ticks={[0, 500, 1000, 1500, 2000, 2500]}
                  width={32}
                />
                <Tooltip
                  contentStyle={{ fontSize: 10, fontFamily: "Roboto", padding: "3px 7px" }}
                  itemStyle={{ padding: 0 }}
                />
                <Bar dataKey="approved"   name="Approved"        stackId="a" fill="#22C55E" />
                <Bar dataKey="pending"    name="Request Pending"  stackId="a" fill="#60A5FA" />
                <Bar dataKey="inProgress" name="In Progress"      stackId="a" fill="#FACC15" />
                <Bar dataKey="declined"   name="Declined"         stackId="a" fill="#EF4444" radius={[2, 2, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: "Roboto", paddingTop: 2 }} iconSize={7} iconType="square" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Request Aging Overview */}
          <div className="bg-white rounded border border-gray-200 p-3.5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-900 font-['Roboto'] leading-snug">
              Request Aging Overview
            </h3>
            <p className="text-[10px] text-gray-500 font-['Roboto'] mt-0.5 mb-2 leading-snug">
              How have long requests have been open, segmented by time periods
            </p>
            <ResponsiveContainer width="100%" height={188}>
              <BarChart
                data={agingData}
                margin={{ top: 2, right: 4, left: -16, bottom: 16 }}
                barSize={18}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ fontSize: 10, fontFamily: "Roboto", padding: "3px 7px" }}
                  itemStyle={{ padding: 0 }}
                />
                <Bar dataKey="inProgress" name="Review In Progress" stackId="a" fill="#F97316" />
                <Bar dataKey="pending"    name="Request Pending"    stackId="a" fill="#60A5FA" radius={[2, 2, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: "Roboto", paddingTop: 2 }} iconSize={7} iconType="square" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-3">

          {/* Request Distribution Density — US Tile Map */}
          <div className="bg-white rounded border border-gray-200 p-3.5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 font-['Roboto'] leading-snug">
                  Request Distribution Density
                </h3>
                <p className="text-[10px] text-gray-500 font-['Roboto'] mt-0.5 leading-snug">
                  Geographic distribution and Number of slot
                </p>
              </div>
              <div className="flex items-center gap-1 border border-gray-200 rounded px-2 py-0.5 flex-shrink-0 ml-2">
                <span className="text-[10px] text-gray-500 font-['Roboto']">Year:</span>
                <span className="text-[10px] font-semibold text-gray-700 font-['Roboto']">2026</span>
                <FontAwesomeIcon name="chevronDown" className="w-2.5 h-2.5 text-gray-400" aria-hidden="true" />
              </div>
            </div>

            {/* Tile map */}
            <div className="overflow-x-auto">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(11, 22px)",
                  gridTemplateRows: "repeat(9, 22px)",
                  gap: "2px",
                  width: "fit-content",
                  margin: "0 auto",
                }}
              >
                {TILE_CELLS.map(([abbr, col, row]) => {
                  const v = STATE_SLOTS[abbr] ?? 0;
                  const { bg, text } = getStateColor(v);
                  return (
                    <div
                      key={abbr}
                      style={{ gridColumn: col, gridRow: row, backgroundColor: bg, color: text }}
                      className="flex flex-col items-center justify-center rounded-sm cursor-default hover:opacity-75 transition-opacity"
                      title={`${abbr}: ${v} slots`}
                    >
                      <span style={{ fontSize: "7px", fontFamily: "Roboto", fontWeight: 700, lineHeight: 1 }}>
                        {abbr}
                      </span>
                      <span style={{ fontSize: "7px", fontFamily: "Roboto", lineHeight: 1, marginTop: "1px" }}>
                        {v}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[9px] text-gray-400 font-['Roboto']">0</span>
              {["#EFF6FF","#DBEAFE","#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#1D4ED8"].map((c) => (
                <div key={c} style={{ backgroundColor: c, width: 14, height: 8, borderRadius: 2 }} />
              ))}
              <span className="text-[9px] text-gray-400 font-['Roboto']">50+</span>
            </div>
          </div>

          {/* Monthly Inflow of Requests */}
          <div className="bg-white rounded border border-gray-200 p-3.5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-900 font-['Roboto'] leading-snug">
              Monthly Inflow of Requests (Last 12 months view)
            </h3>
            <p className="text-[10px] text-gray-500 font-['Roboto'] mt-0.5 mb-2 leading-snug">
              Monthly school request volumes and their cumulative slots, last 12 month view
            </p>
            <ResponsiveContainer width="100%" height={188}>
              <ComposedChart
                data={monthlyInflowData}
                margin={{ top: 2, right: 30, left: -16, bottom: 38 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  yAxisId="slots"
                  tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 2400]}
                  ticks={[0, 400, 800, 1200, 1600, 2000, 2400]}
                  width={32}
                />
                <YAxis
                  yAxisId="requests"
                  orientation="right"
                  tick={{ fontSize: 8, fontFamily: "Roboto", fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 50]}
                  ticks={[0, 10, 20, 30, 40, 50]}
                  width={26}
                />
                <Tooltip
                  contentStyle={{ fontSize: 10, fontFamily: "Roboto", padding: "3px 7px" }}
                  itemStyle={{ padding: 0 }}
                />
                <Bar yAxisId="slots" dataKey="slots" name="Slots Count" fill="#93C5FD" barSize={10} />
                <Line yAxisId="requests" type="monotone" dataKey="requests" name="Request Count" stroke="#1D4ED8" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: "Roboto", paddingTop: 2 }} iconSize={7} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right: persistent Recent Activities */}
      <div className="w-[268px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="sticky top-0 bg-white px-3 pt-3 pb-2 border-b border-gray-100 z-10">
          <h3 className="text-xs font-semibold text-gray-900 font-['Roboto']">Recent Activities</h3>
          <p className="text-[10px] text-gray-500 font-['Roboto'] mt-0.5">Track slot request changes</p>
        </div>

        <div className="px-3">
          {activities.map((a, i) => (
            <div key={i} className="flex gap-2.5 py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: STATUS_COLORS[a.status] }}
                >
                  <FontAwesomeIcon name="fileLines" className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-800 font-['Roboto'] leading-snug">
                  {a.description}
                </p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] text-gray-600 font-['Roboto']">
                    <span className="font-medium">Discipline:</span> {a.discipline}
                  </p>
                  <p className="text-[10px] text-gray-600 font-['Roboto']">
                    <span className="font-medium">Location:</span> {a.location}
                  </p>
                </div>
                <p className="text-[9px] text-gray-400 font-['Roboto'] mt-1 leading-snug">
                  {a.meta}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── List & Reports ─────────────────────────────────────────────────────────
  const renderList = () => <SlotRequestsListView />;

  const renderReports = () => (
    <div className="p-6 flex-1">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <FontAwesomeIcon name="fileChartColumn" className="w-14 h-14 text-gray-300 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-base font-semibold text-gray-900 font-['Roboto'] mb-2">Reports</h3>
        <p className="text-sm text-gray-500 font-['Roboto']">Comprehensive reports and analytics</p>
      </div>
    </div>
  );

  // ── Page frame ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* Compact page header: title left, tabs centered */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 grid grid-cols-3 items-center flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900 font-['Roboto'] whitespace-nowrap">
          Slot Requests Management
        </h1>
        <div className="flex justify-center">
          <TabBar
            tabs={["Overview", "Slot Requests List", "Reports"]}
            activeTab={activeTab}
            onTabChange={(label) => {
              const t = tabDefs.find((x) => x.label === label);
              if (t) onNavigate(t.href);
            }}
          />
        </div>
        <div />
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "Overview"           && renderOverview()}
        {activeTab === "Slot Requests List" && renderList()}
        {activeTab === "Reports"            && renderReports()}
      </div>
    </div>
  );
}
