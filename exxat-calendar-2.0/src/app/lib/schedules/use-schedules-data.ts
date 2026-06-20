import { useEffect, useState } from "react"
import { publicAssetUrl } from "../app-base-path"
import type { ScheduleRecord, SchedulesByMonth, SchedulesManifest } from "./types"

export interface SchedulesDataState {
  status: "loading" | "ready" | "error"
  manifest: SchedulesManifest | null
  schedules: ScheduleRecord[]
  byMonth: SchedulesByMonth
  error: string | null
}

const INITIAL: SchedulesDataState = {
  status: "loading",
  manifest: null,
  schedules: [],
  byMonth: {},
  error: null,
}

let cache: SchedulesDataState | null = null
let cacheKey: string | null = null
let inflight: Promise<SchedulesDataState> | null = null

async function loadSchedulesData(): Promise<SchedulesDataState> {
  const manifestRes = await fetch(publicAssetUrl("mapple/manifest.json"))
  if (!manifestRes.ok) {
    throw new Error("Failed to load schedule manifest")
  }
  const manifest = (await manifestRes.json()) as SchedulesManifest
  const key = `${manifest.version}:${manifest.generatedAt}:${manifest.scheduleCount}`

  if (cache?.status === "ready" && cacheKey === key) return cache
  if (inflight && cacheKey === key) return inflight

  cacheKey = key
  inflight = (async () => {
    try {
      const [schedulesRes, monthRes] = await Promise.all([
        fetch(publicAssetUrl("mapple/schedules.json")),
        fetch(publicAssetUrl("mapple/schedules-by-month.json")),
      ])

      if (!schedulesRes.ok || !monthRes.ok) {
        throw new Error("Failed to load schedule data files")
      }

      const schedules = (await schedulesRes.json()) as ScheduleRecord[]
      const byMonth = (await monthRes.json()) as SchedulesByMonth

      if (schedules.length !== manifest.scheduleCount) {
        throw new Error(
          `Schedule count mismatch: manifest ${manifest.scheduleCount}, loaded ${schedules.length}`,
        )
      }

      const ready: SchedulesDataState = {
        status: "ready",
        manifest,
        schedules,
        byMonth,
        error: null,
      }
      cache = ready
      return ready
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      cache = null
      cacheKey = null
      return { status: "error", manifest: null, schedules: [], byMonth: {}, error: message }
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function useSchedulesData(): SchedulesDataState {
  const [state, setState] = useState<SchedulesDataState>(cache ?? INITIAL)

  useEffect(() => {
    let cancelled = false
    if (cache?.status === "ready") {
      setState(cache)
      return
    }
    loadSchedulesData().then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
