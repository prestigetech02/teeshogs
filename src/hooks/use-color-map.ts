"use client"

import { useEffect, useState } from "react"
import type { ColorHexMap } from "@/lib/colors"

let cachedColorMap: ColorHexMap | null = null
let inflight: Promise<ColorHexMap> | null = null

async function loadColorMap() {
  if (cachedColorMap) return cachedColorMap
  if (!inflight) {
    inflight = fetch("/api/colors")
      .then(async (res) => {
        const data = (await res.json()) as { colors?: ColorHexMap }
        cachedColorMap = data.colors ?? {}
        return cachedColorMap
      })
      .catch(() => {
        cachedColorMap = {}
        return cachedColorMap
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function useColorMap() {
  const [colorMap, setColorMap] = useState<ColorHexMap>(cachedColorMap ?? {})

  useEffect(() => {
    let cancelled = false
    void loadColorMap().then((map) => {
      if (!cancelled) setColorMap(map)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return colorMap
}
