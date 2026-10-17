"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { resolveProductImageSrc } from "@/lib/product-images"
import { cn } from "@/lib/utils"

type ProductGalleryProps = {
  images: string[]
  alt: string
  /** When set (e.g. selected color/variant image), show it first and focus it. */
  featuredImage?: string | null
}

export function ProductGallery({ images, alt, featuredImage }: ProductGalleryProps) {
  const galleryImages = useMemo(() => {
    const list = [...images.filter(Boolean)]
    if (featuredImage) {
      const without = list.filter((image) => image !== featuredImage)
      list.splice(0, list.length, featuredImage, ...without)
    }
    const unique = Array.from(new Set(list))
    return unique.length > 0 ? unique : ["dress-1.webp"]
  }, [images, featuredImage])

  const [activeIndex, setActiveIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveIndex(0)
    setIsZooming(false)
  }, [galleryImages, featuredImage])

  const activeSrc = resolveProductImageSrc(galleryImages[activeIndex] ?? galleryImages[0])

  const updateZoomOrigin = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    })
  }, [])

  return (
    <div className="flex gap-3 md:gap-4">
      <div className="flex w-16 shrink-0 flex-col gap-2 sm:w-[4.5rem] lg:w-20">
        {galleryImages.map((image, index) => {
          const src = resolveProductImageSrc(image)
          const selected = index === activeIndex
          return (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={selected}
              className={cn(
                "aspect-square overflow-hidden rounded-none border bg-muted transition-all",
                selected
                  ? "border-foreground ring-1 ring-foreground"
                  : "border-border opacity-80 hover:opacity-100"
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          )
        })}
      </div>

      <div
        ref={frameRef}
        className="relative aspect-[3/4] min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-none bg-muted"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={(event) => updateZoomOrigin(event.clientX, event.clientY)}
      >
        <img
          src={activeSrc}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-transform duration-200 ease-out will-change-transform",
            isZooming ? "scale-150" : "scale-100"
          )}
          style={{
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
          draggable={false}
        />
      </div>
    </div>
  )
}
