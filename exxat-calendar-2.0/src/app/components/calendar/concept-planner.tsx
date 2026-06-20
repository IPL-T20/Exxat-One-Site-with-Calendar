/** Concept B — Planner Timeline: capacity-first, utilization, Float / Resource Guru style. */
import { xOfDate } from "../../lib/slot-requests-calendar/calendar-timeline"
import { disciplineTimelinePlacements } from "../../lib/slot-requests-calendar/calendar-mode"
import {
  DISCIPLINE_ROW_H,
  HEADER_DAY_H,
  HEALTH_COLOR,
  SIDEBAR_W,
} from "../../lib/slot-requests-calendar/constants"
import type { CalendarModel } from "./useCalendarModel"
import {
  CapacityBar,
  ConflictShading,
  DateHeader,
  HoverCard,
  TimelineBar,
  TimelineMonthColumnLayer,
} from "./calendar-shared"

const PLANNER_UTIL_H = 28

const PLANNER_LOC_H = 56
const PLANNER_DISC_H = 44

export function ConceptPlannerTimeline({ model }: { model: CalendarModel }) {
  const {
    locations,
    conflicts,
    expanded,
    toggleLocation,
    mode,
    layers,
    zoom,
    ppd,
    monthPxW,
    timelineW,
    todayX,
    todayMarkerX,
    liveNow,
    calendarToday,
    grid,
    scrollRef,
    sideShadow,
    currentPeriodHighlight,
    navigatorPeriodHighlight,
    focusPeriodClip,
    isViewingToday,
    periodAnchor,
    selectedId,
    setSelectedId,
    hover,
    setHover,
  } = model

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto isolate">
      <div className="relative" style={{ minWidth: SIDEBAR_W + timelineW }}>
        {/* Utilization summary band */}
        <div
          className="sticky top-0 z-[35] flex border-b border-border bg-muted/30"
          style={{ height: 28 }}
        >
          <div
            className="sticky left-0 z-40 flex items-center px-3 border-r border-border bg-muted/30 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            style={{ width: SIDEBAR_W, boxShadow: sideShadow }}
          >
            Utilization
          </div>
          <div className="relative flex-shrink-0" style={{ width: timelineW, height: 28 }}>
            {locations.map((loc) => {
              if (!loc.earliest || !loc.latest) return null
              const left = xOfDate(loc.earliest, zoom, ppd, monthPxW)
              const w = Math.max(
                12,
                xOfDate(loc.latest, zoom, ppd, monthPxW) - left + ppd,
              )
              return (
                <div
                  key={loc.id}
                  className="absolute top-1 bottom-1 rounded-full opacity-40"
                  style={{
                    left,
                    width: w,
                    background: `linear-gradient(90deg, ${HEALTH_COLOR[loc.health]} 0%, ${HEALTH_COLOR[loc.health]} ${loc.utilizationPct}%, transparent ${loc.utilizationPct}%)`,
                  }}
                  title={`${loc.name}: ${loc.utilizationPct}%`}
                  aria-hidden
                />
              )
            })}
          </div>
        </div>

        <DateHeader
          grid={grid}
          timelineW={timelineW}
          todayX={todayX}
          todayMarkerX={todayMarkerX}
          liveNow={liveNow}
          calendarToday={calendarToday}
          sidebarLabel="Resource · Capacity"
          sidebarW={SIDEBAR_W}
          headerH={HEADER_DAY_H}
          sideShadow={sideShadow}
          zoom={zoom}
          ppd={ppd}
          monthPxW={monthPxW}
          currentPeriod={currentPeriodHighlight}
          navigatorPeriod={navigatorPeriodHighlight}
          periodAnchor={periodAnchor}
          isViewingToday={isViewingToday}
          stickyTop={PLANNER_UTIL_H}
        />

        <TimelineMonthColumnLayer
          bands={grid.tintBands}
          dividerCols={grid.dividerCols}
          sidebarW={SIDEBAR_W}
          timelineW={timelineW}
          top={PLANNER_UTIL_H}
          headerH={HEADER_DAY_H}
          todayX={todayX}
          zoom={zoom}
          currentPeriod={currentPeriodHighlight}
          navigatorPeriod={navigatorPeriodHighlight}
          focusPeriodMode={layers.focusPeriod}
        />

        <div className="relative z-[2]">
        {locations.map((location) => {
          const isOpen = expanded.has(location.id)
          const utilPct = location.utilizationPct

          return (
            <div key={location.id}>
              <div className="flex" style={{ height: PLANNER_LOC_H }}>
                <button
                  type="button"
                  className="sticky left-0 z-20 flex flex-col justify-center gap-1 px-3 text-left border-r border-b border-border flex-shrink-0"
                  style={{
                    width: SIDEBAR_W,
                    boxShadow: sideShadow,
                    height: PLANNER_LOC_H,
                    background: `linear-gradient(90deg, color-mix(in oklch, ${HEALTH_COLOR[location.health]} 12%, var(--card)) 0%, var(--card) 100%)`,
                  }}
                  onClick={() => toggleLocation(location.id)}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-semibold truncate">{location.name}</span>
                    <span
                      className="text-sm font-bold tabular-nums flex-shrink-0"
                      style={{ color: HEALTH_COLOR[location.health] }}
                    >
                      {utilPct}%
                    </span>
                  </div>
                  <CapacityBar
                    used={location.approvedSlots}
                    capacity={location.capacity}
                    health={location.health}
                    size="lg"
                  />
                </button>

                <div
                  className="relative border-b border-border flex-shrink-0"
                  style={{ width: timelineW, height: PLANNER_LOC_H }}
                >
                  {layers.capacity && (
                    <div
                      className="absolute inset-y-2 left-0 right-0 mx-1 rounded-md overflow-hidden"
                      style={{
                        background: `linear-gradient(to right, color-mix(in oklch, var(--chart-2) 6%, transparent) ${utilPct}%, color-mix(in oklch, var(--destructive) 10%, transparent) ${utilPct}%)`,
                      }}
                      aria-hidden
                    />
                  )}
                  <div
                    className="absolute inset-y-3 rounded-md border border-dashed border-border/60 pointer-events-none"
                    style={{
                      left: location.earliest
                        ? xOfDate(location.earliest, zoom, ppd, monthPxW)
                        : 0,
                      width: location.earliest && location.latest
                        ? xOfDate(location.latest, zoom, ppd, monthPxW) -
                          xOfDate(location.earliest, zoom, ppd, monthPxW) +
                          ppd * 2
                        : timelineW * 0.3,
                    }}
                    aria-label="Availability window"
                  />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-primary/40" style={{ left: todayMarkerX }} aria-hidden />
                </div>
              </div>

              {isOpen &&
                location.disciplines.map((disc) => {
                  const discUtil = Math.round((disc.approvedSlots / Math.max(1, disc.capacity)) * 100)
                  return (
                    <div key={disc.id} className="flex" style={{ height: PLANNER_DISC_H }}>
                      <div
                        className="sticky left-0 z-10 flex items-center gap-2 pl-6 pr-3 border-r border-b border-border bg-card flex-shrink-0"
                        style={{ width: SIDEBAR_W, boxShadow: sideShadow, height: PLANNER_DISC_H }}
                      >
                        <div
                          className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${HEALTH_COLOR[discUtil >= 100 ? "critical" : discUtil >= 70 ? "warning" : "healthy"]} 20%, transparent)`,
                            color: HEALTH_COLOR[discUtil >= 100 ? "critical" : discUtil >= 70 ? "warning" : "healthy"],
                          }}
                        >
                          {discUtil}%
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium truncate">{disc.name}</div>
                          <div className="text-[10px] text-muted-foreground tabular-nums">
                            {disc.approvedSlots}/{disc.capacity} booked
                          </div>
                        </div>
                      </div>

                      <div
                        className="relative border-b border-border flex-shrink-0 bg-transparent"
                        style={{ width: timelineW, height: PLANNER_DISC_H }}
                      >
                        {layers.capacity && (
                          <div
                            className="absolute inset-x-0 top-2 bottom-2 pointer-events-none rounded-md"
                            style={{
                              background: `linear-gradient(to right, color-mix(in oklch, var(--chart-2) 10%, transparent) ${discUtil}%, color-mix(in oklch, var(--destructive) 14%, transparent) ${discUtil}%)`,
                            }}
                            aria-hidden
                          />
                        )}
                        {layers.conflicts && (
                          <ConflictShading
                            conflicts={conflicts}
                            disciplineId={disc.id}
                            zoom={zoom}
                            ppd={ppd}
                            monthPxW={monthPxW}
                            variant="bold"
                          />
                        )}
                        {zoom !== "year" &&
                          disciplineTimelinePlacements(
                            disc,
                            mode,
                            layers,
                            model.scheduleBarsByDiscipline,
                          ).map((p) => (
                            <TimelineBar
                              key={p.id}
                              placement={p}
                              mode={mode}
                              zoom={zoom}
                              ppd={ppd}
                              monthPxW={monthPxW}
                              focusPeriodClip={focusPeriodClip}
                              selected={selectedId === p.id}
                              variant="pill"
                              onSelect={setSelectedId}
                              onHover={(pl, el) =>
                                setHover({ placement: pl, rect: el.getBoundingClientRect() })
                              }
                              onLeave={() => setHover(null)}
                            />
                          ))}
                        <div className="absolute top-0 bottom-0 w-px bg-primary/25" style={{ left: todayMarkerX }} aria-hidden />
                      </div>
                    </div>
                  )
                })}
            </div>
          )
        })}
        </div>
      </div>

      {hover && <HoverCard placement={hover.placement} mode={mode} anchor={hover.rect} />}
    </div>
  )
}
