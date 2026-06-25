import { useId, useRef, useState, type KeyboardEvent } from "react"
import { CalendarChevron } from "../calendar-chevron"
import { FontAwesomeIcon } from "../../font-awesome-icon"
import { Button } from "../../ui/button"
import { Checkbox } from "../../ui/checkbox"
import { Input } from "../../ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import { cn } from "../../ui/utils"
import { APP_MODAL_LAYER_Z } from "../../../lib/slot-requests-calendar/constants"
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
import { ScopeTriggerSemantics, scopeFilterCount, scopeTabChrome } from "./scope-trigger-semantics"

const TABS: { id: ScopeDimension; label: string; priority: number }[] = [
  { id: "location", label: "Location", priority: 1 },
  { id: "discipline", label: "Discipline", priority: 2 },
  { id: "locationGroup", label: "Location group", priority: 3 },
  { id: "program", label: "Program", priority: 4 },
  { id: "school", label: "School", priority: 5 },
  { id: "status", label: "Status", priority: 6 },
].sort((a, b) => a.priority - b.priority)

const TAB_ORDER = TABS.map((t) => t.id)

/** Wide enough for dimension tabs; clamped to Radix viewport-available width. */
const SCOPE_POPOVER_WIDTH_CLASS =
  "w-[min(42rem,var(--radix-popover-content-available-width,calc(100vw-2rem)))] max-w-[calc(100vw-2rem)]"
/** 14px — shadcn `text-sm` / globals minimum for buttons and `small`. */
const SCOPE_POPOVER_TEXT = "text-sm font-['Roboto'] leading-normal"
const SCOPE_POPOVER_MUTED = "text-sm font-['Roboto'] leading-normal text-muted-foreground"

interface ScopeControlProps {
  rows: SlotRequestRow[]
  scope: CalendarScope
  onScopeChange: (scope: CalendarScope) => void
  variant?: "default" | "toolbar"
  /** Popover horizontal alignment to the trigger — use start when the trigger is left-aligned. */
  popoverAlign?: "start" | "center" | "end"
}

function scopeOptionLabel(value: string, schedulesContext: boolean): string {
  if (schedulesContext) return formatScheduleScopeStatusLabel(value)
  if (value === "Request Pending") return "Pending"
  return value
}

export function ScopeCompactControl({
  rows,
  scope,
  onScopeChange,
  variant = "default",
  schedulesContext = false,
  popoverAlign,
}: ScopeControlProps & { schedulesContext?: boolean }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ScopeDimension>("location")
  const [query, setQuery] = useState("")
  const tabListRef = useRef<HTMLDivElement>(null)
  const baseId = useId()

  const facets = schedulesContext ? extractScheduleScopeFacets(rows) : extractScopeFacets(rows)
  const summary = schedulesContext
    ? formatScheduleScopeSummary(scope)
    : formatScopeSummary(scope)
  const filterCount = scopeFilterCount(scope)
  const activeTabMeta = TABS.find((t) => t.id === tab) ?? TABS[0]

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

  const selectTab = (id: ScopeDimension) => {
    setTab(id)
    setQuery("")
  }

  const focusTab = (id: ScopeDimension) => {
    tabListRef.current
      ?.querySelector<HTMLButtonElement>(`[data-scope-tab="${id}"]`)
      ?.focus()
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentId: ScopeDimension) => {
    const index = TAB_ORDER.indexOf(currentId)
    if (index < 0) return

    let nextIndex: number | null = null
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % TAB_ORDER.length
        break
      case "ArrowLeft":
        nextIndex = (index - 1 + TAB_ORDER.length) % TAB_ORDER.length
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = TAB_ORDER.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const nextId = TAB_ORDER[nextIndex]
    selectTab(nextId)
    focusTab(nextId)
  }

  const triggerLabel = `Scope: ${summary}`
  const searchLabel = `Search ${activeTabMeta.label.toLowerCase()}`
  const tabPanelId = `${baseId}-panel`
  const tabListId = `${baseId}-tabs`
  const contentAlign = popoverAlign ?? (variant === "toolbar" ? "end" : "start")

  const triggerContent =
    variant === "toolbar" ? (
      <>
        <ScopeTriggerSemantics scope={scope} />
        <span className="truncate">{summary}</span>
        {filterCount > 0 ? (
          <span className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-primary/10 px-1 text-xs font-semibold tabular-nums text-primary">
            {filterCount}
          </span>
        ) : null}
        <CalendarChevron use="disclosure" open={open} />
      </>
    ) : (
      <>
        <span className="text-muted-foreground shrink-0">Scope:</span>
        <ScopeTriggerSemantics scope={scope} size="sm" />
        <span className="truncate font-medium">{summary}</span>
        <CalendarChevron use="disclosure" open={open} className="shrink-0" />
      </>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "gap-1.5 text-foreground font-['Roboto']",
            variant === "toolbar"
              ? "max-w-[min(100vw-8rem,20rem)]"
              : "max-w-[260px] h-auto",
          )}
        >
          {triggerContent}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={contentAlign}
        side="bottom"
        sideOffset={4}
        collisionPadding={16}
        className={cn(
          SCOPE_POPOVER_WIDTH_CLASS,
          "flex max-h-[min(420px,var(--radix-popover-content-available-height,70vh))] flex-col overflow-hidden p-0",
        )}
        style={{ zIndex: APP_MODAL_LAYER_Z }}
        aria-label="Scope filters"
      >
        <div
          ref={tabListRef}
          id={tabListId}
          role="tablist"
          aria-label="Scope dimensions"
          className="flex w-full shrink-0 flex-nowrap overflow-x-auto border-b border-border bg-popover overscroll-x-contain"
        >
          {TABS.map(({ id, label }) => {
            const selected = tab === id
            const activeCount = scope[SCOPE_DIMENSION_KEY[id]].size
            const tabId = `${baseId}-tab-${id}`
            const chrome = scopeTabChrome(id)

            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={tabId}
                data-scope-tab={id}
                aria-selected={selected}
                aria-controls={tabPanelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(id)}
                onKeyDown={(event) => onTabKeyDown(event, id)}
                className={cn(
                  "inline-flex min-h-10 min-w-[4.5rem] flex-1 items-center justify-center gap-1 px-2 py-2 font-medium whitespace-nowrap border-b-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
                  SCOPE_POPOVER_TEXT,
                  selected
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground/70 hover:text-foreground",
                )}
              >
                <FontAwesomeIcon
                  name={chrome.icon}
                  className={cn("size-3 shrink-0", chrome.iconClass)}
                  aria-hidden
                />
                {label}
                {activeCount > 0 ? (
                  <span className="ml-0.5 rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
                    {activeCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div
          id={tabPanelId}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab}`}
          className="flex min-h-0 flex-1 flex-col overflow-hidden bg-popover"
        >
          <div className="shrink-0 border-b border-border p-2">
            <div className="relative">
              <FontAwesomeIcon
                name="search"
                className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`${searchLabel}…`}
                aria-label={searchLabel}
                className={cn("h-9 pl-8", SCOPE_POPOVER_TEXT)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            <fieldset className="min-w-0 border-0 p-0 m-0">
              <legend className="sr-only">{activeTabMeta.label} filters</legend>
              {filtered.length === 0 ? (
                <p className={cn("px-2 py-3", SCOPE_POPOVER_MUTED)} role="status">
                  No matches
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {filtered.map((value) => {
                    const checked = scope[SCOPE_DIMENSION_KEY[tab]].has(value)
                    const optionLabel = scopeOptionLabel(value, schedulesContext)

                    return (
                      <li key={value}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-foreground transition-colors hover:bg-accent",
                            SCOPE_POPOVER_TEXT,
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => applyToggle(tab, value)}
                            className="mt-0.5"
                          />
                          <span className="leading-snug break-words">{optionLabel}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </fieldset>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-t border-border bg-popover p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-['Roboto'] text-primary hover:text-primary"
            onClick={() => onScopeChange(clearScope(scope))}
          >
            Reset scope
          </Button>
          <Button
            type="button"
            size="sm"
            className="font-['Roboto']"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
