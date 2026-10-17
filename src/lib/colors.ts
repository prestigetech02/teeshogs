/** Fallback hex when an attribute term has no stored value yet. */
const FALLBACK_COLOR_HEX: Record<string, string> = {
  Black: "#1A1A1A",
  White: "#F5F5F5",
  Ivory: "#FFFFF0",
  Cream: "#FFFDD0",
  "Midnight Black": "#0D0D0D",
  Midnight: "#0A0A2E",
  "Dusty Rose": "#C8A2A2",
  Blush: "#FFB6C1",
  Camel: "#C19A6B",
  Navy: "#000080",
  Charcoal: "#36454F",
  Olive: "#808000",
  Sage: "#B2AC88",
  "Sage Green": "#8F9779",
  Terracotta: "#E2725B",
  Champagne: "#F7E7CE",
  "Deep Burgundy": "#800020",
  Burgundy: "#800020",
  "Forest Green": "#228B22",
  Oatmeal: "#E3CDB0",
  Cognac: "#9F4E24",
  "Cobalt Blue": "#0047AB",
  Rust: "#B7410E",
  Graphite: "#474B4E",
  Nude: "#F2D5B5",
  Emerald: "#50C878",
  Green: "#008000",
  Red: "#C41E3A",
  Blue: "#2563EB",
  Pink: "#EC4899",
  Beige: "#F5F5DC",
  Grey: "#6B7280",
  Gray: "#6B7280",
  Brown: "#8B4513",
  Yellow: "#EAB308",
  Orange: "#EA580C",
  Purple: "#7C3AED",
}

export type ColorHexMap = Record<string, string>

export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash) && !/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    return null
  }
  if (withHash.length === 4) {
    const [, r, g, b] = withHash
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return withHash.toUpperCase()
}

export function isLightHex(hex: string) {
  const normalized = normalizeHex(hex)
  if (!normalized) return false
  const r = Number.parseInt(normalized.slice(1, 3), 16)
  const g = Number.parseInt(normalized.slice(3, 5), 16)
  const b = Number.parseInt(normalized.slice(5, 7), 16)
  // Perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 > 186
}

export function resolveColorHex(colorName: string, map?: ColorHexMap | null) {
  const fromMap = map?.[colorName]
  const normalized = normalizeHex(fromMap)
  if (normalized) return normalized

  const fallback = FALLBACK_COLOR_HEX[colorName]
  if (fallback) return fallback

  // Accept raw hex stored as the "color" name
  const asHex = normalizeHex(colorName)
  if (asHex) return asHex

  return "#D4D4D4"
}

export function buildColorHexMap(
  terms: Array<{ name: string; hex?: string | null }>
): ColorHexMap {
  const map: ColorHexMap = {}
  for (const term of terms) {
    const hex = normalizeHex(term.hex)
    if (hex) map[term.name] = hex
  }
  return map
}
