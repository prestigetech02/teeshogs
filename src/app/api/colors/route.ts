import { NextResponse } from "next/server"
import { getColorHexMap } from "@/lib/catalog-taxonomy"

export async function GET() {
  try {
    const colorMap = await getColorHexMap()
    return NextResponse.json({ colors: colorMap })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load colors"
    return NextResponse.json({ error: message, colors: {} }, { status: 500 })
  }
}
