"use client"

import { cn } from "@/lib/utils"
import { isLightHex, resolveColorHex, type ColorHexMap } from "@/lib/colors"

type ColorSwatchProps = {
  color: string
  selected?: boolean
  onSelect?: () => void
  colorMap?: ColorHexMap | null
  size?: "sm" | "md" | "lg"
  className?: string
  title?: string
}

const sizeClass = {
  sm: "size-5",
  md: "size-6",
  lg: "size-7",
} as const

export function ColorSwatch({
  color,
  selected = false,
  onSelect,
  colorMap,
  size = "md",
  className,
  title,
}: ColorSwatchProps) {
  const hex = resolveColorHex(color, colorMap)
  const light = isLightHex(hex)

  return (
    <button
      type="button"
      title={title || color}
      aria-label={color}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative shrink-0 rounded-none border transition-transform",
        sizeClass[size],
        selected
          ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
          : "hover:opacity-90",
        light ? "border-border" : "border-black/15",
        className
      )}
      style={{ backgroundColor: hex }}
    />
  )
}

type ColorSwatchGroupProps = {
  colors: string[]
  selected: string
  onSelect: (color: string) => void
  colorMap?: ColorHexMap | null
  size?: "sm" | "md" | "lg"
}

export function ColorSwatchGroup({
  colors,
  selected,
  onSelect,
  colorMap,
  size = "sm",
}: ColorSwatchGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          selected={selected === color}
          onSelect={() => onSelect(color)}
          colorMap={colorMap}
          size={size}
        />
      ))}
    </div>
  )
}
