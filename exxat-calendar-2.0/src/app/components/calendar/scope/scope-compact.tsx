import { useRef, useState } from "react"
import { FontAwesomeIcon } from "../../font-awesome-icon"
import {
  extractScheduleScopeFacets,
  formatScheduleScopeStatusLabel,
  formatScheduleScopeSummary,
} from "../../../lib/schedules/schedule-scope-data"
import {
  extractScopeFacets,
  formatScopeSummary,
  SCOPE_DIMENSION_KEY,
  toggleScopeValue,
  clearScope,
} from "../../../lib/slot-requests-calendar/scope-data"
import type { CalendarScope, ScopeDimension, SlotRequestRow } from "../../../lib/slot-requests-calendar/types"
import { ScopeDropdownPortal } from "./scope-dropdown-portal"

const TABS: { id: ScopeDimension; label: string; priority: number }[] = [
  { id: "location", label: "Location", priority: 1 },
  { id: "discipline", label: "Discipline", priority: 2 },
  { id: "locationGroup", label: "Location group", priority: 3 },
  { id: "program", label: "Program", priority: 4 },
  { id: "school", label: "School", priority: 5 },
  { id: "status", label: "Status", priority: 6 },
].sort((a, b) => a.priority - b.priority)

interface ScopeControlProps {
  rows: SlotRequestRow[]
  scope: CalendarScope
  onScopeChange: (scope: CalendarScope) => void
  variant?: "default" | "toolbar"
  schedulesContext?: boolean
}

export function ScopeCompactControl({
  rows,
  scope,
  onScopeChange,
  variant = "default",
  schedulesContext = false,
}: ScopeControlProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ScopeDimension>("location")
  const [query, setQuery] = useState("")
  const anchorRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const facets = schedulesContext ? extractScheduleScopeFacets(rows) : extractScopeFacets(rows)
  const summary = schedulesContext
    ? formatScheduleScopeSummary(scope)
    : formatScopeSummary(scope)
  const hasFilter =
    scope.locations.size +
      scope.disciplines.size +
      scope.programs.size +
      scope.schools.size +
      scope.statuses.size +
      scope.locationGroups.size >
    0

  const tabValues: Record<ScopeDimension, string[]> = {
    location: facets.locations,
    discipline: facets.disciplines,
    program: facets.programs,
    school: facets.schools,
    status: facets.statuses,
    locationGroup: facets.locationGroups,
  }

  const filtered = tabValues[tab].filter((v) =>
    v.toLowerCase().includes(query.toLowerCase()),
  )

  const applyToggle = (dimension: ScopeDimension, value: string) => {
    onScopeChange(toggleScopeValue(scope, dimension, value))
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={
          variant === "toolbar"
            ? `inline-flex items-center gap-1.5 h-8 max-w-[min(100vw-8rem,20rem)] px-3 text-xs rounded border font-['Roboto'] transition-colors ${
                hasFilter
                  ? "border-[#3F51B5]/35 bg-[#3F51B5]/[0.06] text-gray-900 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`
            : `inline-flex items-center gap-1.5 max-w-[260px] px-2 py-1 text-xs rounded-md border transition-colors ${
                hasFilter
                  ? "border-border bg-muted/40 text-foreground"
                  : "border-border/70 bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`
        }
        aria-label={`Scope: ${summary}`}
      >
        {variant === "toolbar" ? (
          <>
            <FontAwesomeIcon
              name="filter"
              className={`size-3 flex-shrink-0 ${hasFilter ? "text-[#3F51B5]" : "text-gray-400"}`}
              aria-hidden
            />
            <span className="truncate font-medium">{summary}</span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground flex-shrink-0">Scope:</span>
            <span className="truncate font-medium text-foreground">{summary}</span>
          </>
        )}
        <FontAwesomeIcon name="chevronDown" className="size-2.5 flex-shrink-0 opacity-60" aria-hidden />
      </button>

      <ScopeDropdownPortal
        open={open}
        anchorRef={anchorRef}
        panelRef={panelRef}
        measureRef={tabBarRef}
        onClose={() => setOpen(false)}
        fitContent
        minWidth={352}
        align={variant === "toolbar" ? "end" : "start"}
      >
        <div ref={tabBarRef} className="flex w-max border-b border-border flex-shrink-0">
          {TABS.map(({ id, label }) => {
            const active = scope[SCOPE_DIMENSION_KEY[id]].size
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id)
                  setQuery("")
                }}
                className={`px-2.5 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === id
                    ? "border-[#3F51B5] text-[#3F51B5]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {active > 0 && (
                  <span className="ml-1 rounded-full bg-[#3F51B5] text-white px-1.5 text-[9px] tabular-nums">
                    {active}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-2 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-background">
            <FontAwesomeIcon name="search" className="size-3 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${TABS.find((t) => t.id === tab)?.label.toLowerCase()}…`}
              className="flex-1 text-xs bg-transparent outline-none min-w-0"
            />
          </div>
        </div>

        <ul className="overflow-y-auto p-1 flex-1 min-h-0" role="listbox" aria-multiselectable>
          {filtered.map((value) => {
            const checked = scope[SCOPE_DIMENSION_KEY[tab]].has(value)
            return (
              <li key={value}>
                <label className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => applyToggle(tab, value)}
                    className="mt-0.5 rounded border-border"
                  />
                  <span className="leading-snug break-words">
                    {schedulesContext
                      ? formatScheduleScopeStatusLabel(value)
                      : value === "Request Pending"
                        ? "Pending"
                        : value}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-between gap-2 p-2 border-t border-border bg-muted/30 flex-shrink-0">
          <button
            type="button"
            className="text-[11px] text-[#3F51B5] hover:underline"
            onClick={() => onScopeChange(clearScope(scope))}
          >
            Reset scope
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs font-medium rounded-md bg-[#3F51B5] text-white"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      </ScopeDropdownPortal>
    </>
  )
}
