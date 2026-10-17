import { NextResponse } from "next/server"
import { listFezStates } from "@/lib/fez"
import { NIGERIA_STATES } from "@/lib/nigeria-states"

export async function GET() {
  try {
    const states = await listFezStates()
    if (states.length > 0) {
      return NextResponse.json({
        states: states.map((item) => item.state).filter(Boolean),
        source: "fez",
      })
    }
  } catch {
    // Fall through to static list
  }

  return NextResponse.json({
    states: [...NIGERIA_STATES],
    source: "fallback",
  })
}
