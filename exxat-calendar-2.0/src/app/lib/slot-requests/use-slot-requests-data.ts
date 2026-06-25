import { useEffect, useState } from "react"
import { publicAssetUrl } from "../app-base-path"
import type { SlotRequestRecord, SlotRequestsByMonth, SlotRequestsManifest } from "./types"

export interface SlotRequestsDataState {
  status: "loading" | "ready" | "error"
  manifest: SlotRequestsManifest | null
  slotRequests: SlotRequestRecord[]
  byMonth: SlotRequestsByMonth
  error: string | null
}

const INITIAL: SlotRequestsDataState = {
  status: "loading",
  manifest: null,
  slotRequests: [],
  byMonth: {},
  error: null,
}

let cache: SlotRequestsDataState | null = null
let cacheKey: string | null = null
let inflight: Promise<SlotRequestsDataState> | null = null

export async function loadSlotRequestsData(): Promise<SlotRequestsDataState> {
  const manifestRes = await fetch(publicAssetUrl("mapple/slot-requests-manifest.json"))
  if (!manifestRes.ok) {
    throw new Error("Failed to load slot request manifest")
  }
  const manifest = (await manifestRes.json()) as SlotRequestsManifest
  const key = `${manifest.version}:${manifest.generatedAt}:${manifest.slotRequestCount}`

  if (cache?.status === "ready" && cacheKey === key) return cache
  if (inflight && cacheKey === key) return inflight

  cacheKey = key
  inflight = (async () => {
    try {
      const [requestsRes, monthRes] = await Promise.all([
        fetch(publicAssetUrl("mapple/slot-requests.json")),
        fetch(publicAssetUrl("mapple/slot-requests-by-month.json")),
      ])

      if (!requestsRes.ok || !monthRes.ok) {
        throw new Error("Failed to load slot request data files")
      }

      const slotRequests = (await requestsRes.json()) as SlotRequestRecord[]
      const byMonth = (await monthRes.json()) as SlotRequestsByMonth

      if (slotRequests.length !== manifest.slotRequestCount) {
        throw new Error(
          `Slot request count mismatch: manifest ${manifest.slotRequestCount}, loaded ${slotRequests.length}`,
        )
      }

      const ready: SlotRequestsDataState = {
        status: "ready",
        manifest,
        slotRequests,
        byMonth,
        error: null,
      }
      cache = ready
      return ready
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      cache = null
      cacheKey = null
      return {
        status: "error",
        manifest: null,
        slotRequests: [],
        byMonth: {},
        error: message,
      }
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function useSlotRequestsData(): SlotRequestsDataState {
  const [state, setState] = useState<SlotRequestsDataState>(cache ?? INITIAL)

  useEffect(() => {
    let cancelled = false
    if (cache?.status === "ready") {
      setState(cache)
      return
    }
    loadSlotRequestsData().then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
