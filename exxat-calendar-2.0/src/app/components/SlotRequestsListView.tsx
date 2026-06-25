import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "./font-awesome-icon";
import { type SlotRequest, type SlotStatus } from "../lib/mock/slot-requests";
import { getSlotRequestRows } from "../lib/mock/slot-requests-datasets"
import { applyUsabilityRowOverrides } from "../lib/mock/usability-fixture-alignment";
import {
  productDatasetFromUrl,
  syncCanonicalProductUrl,
} from "../lib/decision-workflow/product-route";
import { useCalendarModel } from "./calendar/useCalendarModel";
import { SlotRequestsCalendarWorkspace } from "./SlotRequestsCalendarWorkspace";
import { SlotRequestsViewToolbar } from "./slot-requests-view-toolbar";
import { isDebugMedStarScenario } from "../lib/decision-workflow/debug-scenario";
import {
  MedStarDataProvider,
  useMedStarData,
  MEDSTAR_CALENDAR_FOCUS_DATE,
} from "../lib/medstar-data/medstar-data-context";
import { MedStarRealProvider } from "../lib/medstar-real/medstar-real-context";
import { WorkflowPrototypeProvider } from "./calendar/usability-prototype/workflow-prototype-context";

export type { SlotRequest, SlotStatus };
export { getSlotRequestRows };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SlotStatus }) {
  const styles: Record<SlotStatus, string> = {
    "Request Pending": "bg-amber-100 text-amber-800 border border-amber-200",
    "Approved":        "bg-green-100 text-green-800 border border-green-200",
    "Review":          "bg-blue-100  text-blue-800  border border-blue-200",
    "Declined":        "bg-red-100   text-red-800   border border-red-200",
    "Canceled":        "bg-gray-100  text-gray-600  border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-['Roboto'] whitespace-nowrap ${styles[status]}`}>
      {status}
    </span>
  );
}

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

function DataLoadingPanel({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 bg-white"
      style={{ flex: "1 1 0", minHeight: 0 }}
    >
      <div className="h-8 w-8 rounded-full border-2 border-[#3F51B5] border-t-transparent animate-spin" />
      <p className="text-sm font-['Roboto'] text-gray-500">{label}</p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SlotRequestsListView() {
  return (
    <MedStarDataProvider>
      <SlotRequestsListViewContent />
    </MedStarDataProvider>
  );
}

function SlotRequestsListViewContent() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const datasetId = useMemo(() => productDatasetFromUrl(search), [search]);
  const medstarData = useMedStarData();
  const isDebugMedStar = useMemo(() => isDebugMedStarScenario(search), [search]);
  const isProductWorkflow = !isDebugMedStar;

  const fixtureRows = useMemo(() => getSlotRequestRows(datasetId), [datasetId]);
  const slotRows = isDebugMedStar
    ? fixtureRows
    : medstarData.source === "loading"
      ? []
      : medstarData.allRows;
  const calendarBaseRows = isDebugMedStar
    ? fixtureRows
    : medstarData.source === "loading"
      ? []
      : medstarData.calendarRows;
  const isDataLoading = isProductWorkflow && medstarData.source === "loading";

  const [schoolSearch, setSchoolSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  useEffect(() => {
    if (typeof window === "undefined") return;
    syncCanonicalProductUrl(window.location.pathname, window.location.search);
  }, []);
  const [activeView, setActiveView] = useState<"grid" | "kanban" | "calendar">("calendar");
  const calendarModel = useCalendarModel(
    isProductWorkflow && medstarData.isMedStarLoaded ? medstarData.calendarRows : slotRows,
    {
      kpiRows:
        medstarData.isMedStarLoaded
          ? applyUsabilityRowOverrides(medstarData.allRows, {
              hopkinsApproved: false,
              approvedIds: new Set(),
              declinedIds: new Set(),
              holdIds: new Map(),
            })
          : undefined,
      kpiReferenceDate: medstarData.isMedStarLoaded
        ? MEDSTAR_CALENDAR_FOCUS_DATE
        : undefined,
    },
  );

  const totalItems = slotRows.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const toggleSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const pageRows = slotRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const pageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, 4, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-50" style={{ minHeight: 0 }}>

      <SlotRequestsViewToolbar
        activeView={activeView}
        onViewChange={setActiveView}
        calendarModel={calendarModel}
      />

      {/* ── Filter bar (grid / kanban only — calendar owns Scope control) ─ */}
      {activeView !== "calendar" && (
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-shrink-0 overflow-x-auto">

        {/* School selector + search */}
        <div className="flex items-center gap-0 border border-[#3F51B5] rounded overflow-hidden flex-shrink-0">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Roboto'] text-[#3F51B5] bg-white hover:bg-blue-50 transition-colors border-r border-[#3F51B5] whitespace-nowrap">
            <span>School Name</span>
            <FontAwesomeIcon name="chevronDown" className="w-2.5 h-2.5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white">
            <FontAwesomeIcon name="search" className="w-3 h-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by School Name"
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              className="text-xs font-['Roboto'] text-gray-700 placeholder-gray-400 outline-none w-40 bg-transparent"
            />
          </div>
        </div>

        {/* Filter pills */}
        {[
          { label: "Disciplines",     icon: "tag"      },
          { label: "Programs",        icon: "clipboard" },
          { label: "Location Groups", icon: "mapPin"    },
          { label: "Locations",       icon: "location"  },
          { label: "Status",          icon: "circle"    },
        ].map(({ label, icon }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Roboto'] text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon name={icon as any} className="w-3 h-3 text-gray-400" aria-hidden="true" />
            {label}
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action group: Add Filter | Reset | Export | divider | Configure */}
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Roboto'] text-[#3F51B5] bg-white border border-[#3F51B5] rounded hover:bg-blue-50 transition-colors whitespace-nowrap">
            <FontAwesomeIcon name="plus" className="w-3 h-3" aria-hidden="true" />
            Add Filter
          </button>
          <button className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Reset filters">
            <FontAwesomeIcon name="arrowRotateLeft" className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Export">
            <FontAwesomeIcon name="arrowUpRightFromSquare" className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <div className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden="true" />
          <button className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Configure columns">
            <FontAwesomeIcon name="sliders" className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      )}

      {/* ── View content ──────────────────────────────────────────────────── */}
      {activeView === "calendar" && isDebugMedStar && (
        <MedStarRealProvider enabled>
          <SlotRequestsCalendarWorkspace debugMedStar />
        </MedStarRealProvider>
      )}

      {activeView === "calendar" && isProductWorkflow && isDataLoading && (
        <DataLoadingPanel label="Loading slot requests…" />
      )}

      {activeView === "calendar" && isProductWorkflow && !isDataLoading && (
        <WorkflowPrototypeProvider enabled baseRows={calendarBaseRows}>
          <SlotRequestsCalendarWorkspace />
        </WorkflowPrototypeProvider>
      )}

      {activeView === "kanban" && (
        <div className="flex flex-col items-center justify-center" style={{ flex: "1 1 0", minHeight: 0 }}>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <FontAwesomeIcon name="gripHorizontal" className="w-7 h-7 text-[#3F51B5]" aria-hidden="true" />
          </div>
          <p className="text-sm font-['Roboto'] font-medium text-gray-700 mb-1">Kanban view coming soon</p>
          <p className="text-xs font-['Roboto'] text-gray-400">This view is currently under development.</p>
        </div>
      )}

      {activeView === "grid" && isDataLoading && (
        <DataLoadingPanel label="Loading slot requests…" />
      )}

      {activeView === "grid" && !isDataLoading && (
      <div className="px-4 py-3" style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}>
        <div className="rounded-lg border border-gray-200 shadow-sm bg-white flex flex-col" style={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
          <div style={{ flex: "1 1 0", minHeight: 0, overflow: "auto" }}>
            <table style={{ tableLayout: "auto", minWidth: 2200, width: "max-content", borderCollapse: "separate", borderSpacing: 0 }}>
              {/* Sticky header */}
              <thead className="sticky top-0 z-20" style={{ backgroundColor: "#E8EAF6" }}>
                <tr>
                  {/* ── Fixed left ── */}
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap"
                    style={{ position: "sticky", left: 0, zIndex: 31, backgroundColor: "#E8EAF6", minWidth: 120 }}>
                    REQUEST ID
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap"
                    style={{ position: "sticky", left: 120, zIndex: 31, backgroundColor: "#E8EAF6", minWidth: 180, boxShadow: "4px 0 8px -2px rgba(0,0,0,0.12)" }}>
                    SCHOOL DETAILS
                  </th>
                  {/* ── Scrollable middle ── */}
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap cursor-pointer select-none hover:bg-indigo-100 transition-colors" onClick={toggleSort}>
                    <div className="flex items-center gap-1.5">
                      AVAILABILITY NAME
                      <FontAwesomeIcon name={sortDir === "asc" ? "chevronUp" : "chevronDown"} className="w-2.5 h-2.5 text-gray-500" aria-hidden="true" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">EXPERIENCE TYPE</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">REQUESTED SLOTS</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">PENDING DURATION</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">REQUESTED LOCATION</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">PROGRAM TYPE</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">REQUESTED SHIFTS</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">DAYS OF WEEK</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">REQUESTED DATE</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">REQUESTED BY</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">REQUESTED DURATION</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">APPROVED INFO</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">PROFILE SHARED</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap">PARTNER CATEGORY</th>
                  {/* ── Fixed right ── */}
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-r border-b border-gray-300 whitespace-nowrap"
                    style={{ position: "sticky", right: 108, zIndex: 31, backgroundColor: "#E8EAF6", minWidth: 130, boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.12)" }}>
                    STATUS
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold font-['Roboto'] text-gray-900 uppercase tracking-wide border-b border-gray-300 whitespace-nowrap"
                    style={{ position: "sticky", right: 0, zIndex: 31, backgroundColor: "#E8EAF6", minWidth: 108 }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="bg-white divide-y divide-gray-100">
                {pageRows.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50 transition-colors group">
                    {/* Fixed left */}
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 whitespace-nowrap transition-colors"
                      style={{ position: "sticky", left: 0, zIndex: 10, minWidth: 120, backgroundColor: "#fff", borderRight: "1px solid #E5E7EB", borderBottom: "1px solid #F3F4F6" }}>
                      {row.id}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] transition-colors"
                      style={{ position: "sticky", left: 120, zIndex: 10, minWidth: 180, maxWidth: 180, backgroundColor: "#fff", borderRight: "1px solid #E5E7EB", borderBottom: "1px solid #F3F4F6", boxShadow: "4px 0 8px -2px rgba(0,0,0,0.10)" }}>
                      <span className="text-[#3F51B5] hover:underline cursor-pointer font-medium truncate block" title={row.school}>{row.school}</span>
                    </td>
                    {/* Scrollable */}
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100" style={{ minWidth: 220, maxWidth: 280 }}>
                      <span className="truncate block" title={row.availabilityName}>{row.availabilityName}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">{row.experienceType}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap text-center">{row.requestedSlots}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap text-center">{row.pendingDuration}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100" style={{ minWidth: 200, maxWidth: 260 }}>
                      <span className="truncate block" title={row.requestedLocation}>{row.requestedLocation}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">{row.programType}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">{row.requestedShifts}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">{row.requestedDaysOfWeek || "—"}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">{row.requestedDate}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">{row.requestedBy}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap">{row.requestedDuration}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap text-center">{row.approvedInfo}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100 whitespace-nowrap text-center">{row.studentProfileShared || "—"}</td>
                    <td className="px-3 py-2.5 text-xs font-['Roboto'] text-gray-700 border-r border-gray-100" style={{ minWidth: 140, maxWidth: 160 }}>
                      <span className="truncate block" title={row.partnerCategory}>{row.partnerCategory || "—"}</span>
                    </td>
                    {/* Fixed right */}
                    <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap group-hover:bg-indigo-50 transition-colors"
                      style={{ position: "sticky", right: 108, zIndex: 10, minWidth: 130, backgroundColor: "#fff", borderLeft: "1px solid #E5E7EB", borderBottom: "1px solid #F3F4F6", boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.10)" }}>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap group-hover:bg-indigo-50 transition-colors"
                      style={{ position: "sticky", right: 0, zIndex: 10, minWidth: 108, backgroundColor: "#fff", borderBottom: "1px solid #F3F4F6" }}>
                      <div className="flex items-center gap-2">
                        <button className="px-2.5 py-1 text-[11px] font-['Roboto'] font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-colors">
                          Review
                        </button>
                        <button className="p-1 text-gray-400 hover:text-[#3F51B5] hover:bg-blue-50 rounded transition-colors" aria-label="View comments">
                          <FontAwesomeIcon name="comments" className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {activeView === "grid" && (
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-4 flex-shrink-0">
        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-['Roboto'] whitespace-nowrap">Rows per page</span>
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs font-['Roboto'] text-gray-700 border border-gray-300 rounded px-2 py-1 pr-6 appearance-none bg-white hover:border-gray-400 focus:outline-none focus:border-[#3F51B5] cursor-pointer"
            >
              {ROWS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <FontAwesomeIcon name="chevronDown" className="w-2.5 h-2.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Item count */}
        <span className="text-xs text-gray-500 font-['Roboto'] whitespace-nowrap">
          Page {currentPage} of {totalPages} ({totalItems.toLocaleString()} items)
        </span>

        <div className="flex-1" />

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="First page"
          >
            <FontAwesomeIcon name="anglesLeft" className="w-3 h-3" aria-hidden="true" />
          </button>

          {/* Prev */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <FontAwesomeIcon name="angleLeft" className="w-3 h-3" aria-hidden="true" />
          </button>

          {/* Page numbers */}
          {pageNumbers().map((pg, i) =>
            pg === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400 font-['Roboto']">...</span>
            ) : (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg as number)}
                className={`w-7 h-7 text-xs font-['Roboto'] rounded transition-colors ${
                  currentPage === pg
                    ? "bg-[#3F51B5] text-white font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label={`Page ${pg}`}
                aria-current={currentPage === pg ? "page" : undefined}
              >
                {pg}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <FontAwesomeIcon name="angleRight" className="w-3 h-3" aria-hidden="true" />
          </button>

          {/* Last page */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Last page"
          >
            <FontAwesomeIcon name="anglesRight" className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
