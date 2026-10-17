"use client"

import { useEffect, useMemo, useState, type SVGProps } from "react"
import { Heart, Scale } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/context/StoreContext"
import type { Product } from "@/lib/supabase"
import { absoluteUrl } from "@/lib/seo"
import { cn } from "@/lib/utils"

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 8.5h2.25V5.75H14c-1.93 0-3.5 1.57-3.5 3.5V11H8.25v2.75H10.5V21h2.75v-7.25h2.1L15.75 11H13.25V9.25c0-.41.34-.75.75-.75Z" />
    </svg>
  )
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.74 4h2.36l-5.16 5.9L21.5 20h-5.3l-4.15-5.42L7.3 20H4.93l5.52-6.31L2.75 4h5.43l3.75 4.97L17.74 4Zm-.83 14.4h1.31L7.32 5.52H5.92l10.99 12.88Z" />
    </svg>
  )
}

function PinterestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 3C7.4 3 4.5 6.12 4.5 10.02c0 2.9 1.63 4.55 2.62 4.55.41 0 .64-.1.74-.4.05-.15.2-.72.26-.95.08-.3.05-.4-.18-.66-.4-.48-.66-1.1-.66-1.98 0-2.55 1.91-4.83 4.97-4.83 2.71 0 4.2 1.65 4.2 3.86 0 2.9-1.28 5.35-3.19 5.35-.99 0-1.74-.82-1.5-1.83.29-1.2.84-2.5.84-3.37 0-.78-.42-1.43-1.28-1.43-1.02 0-1.83 1.05-1.83 2.46 0 .9.3 1.5.3 1.5l-1.22 5.16c-.36 1.53-.05 3.41-.03 3.6.02.1.14.13.2.05.08-.12 1.17-1.45 1.54-2.79.1-.38.59-2.3.59-2.3.29.56 1.14 1.05 2.04 1.05 2.69 0 4.51-2.45 4.51-5.73C18.52 5.75 15.66 3 12.04 3Z" />
    </svg>
  )
}

function WhatsAppShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.47 14.38c-.29-.14-1.7-.84-1.96-.93-.26-.1-.45-.14-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43s1.02 2.82 1.17 3.01c.14.19 2.01 3.07 4.87 4.31.68.29 1.21.47 1.62.6.68.21 1.3.18 1.79.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.11-.26-.18-.55-.32ZM12.05 21.78h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97 1-3.62-.24-.37a9.77 9.77 0 0 1-1.5-5.2 9.82 9.82 0 0 1 9.82-9.8 9.75 9.75 0 0 1 6.94 2.88 9.76 9.76 0 0 1 2.87 6.94 9.82 9.82 0 0 1-9.82 9.78Zm8.36-18.14A11.75 11.75 0 0 0 12.04 0C5.45 0 .1 5.35.1 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.26-1.64a11.9 11.9 0 0 0 5.78 1.47h.01c6.59 0 11.94-5.35 11.94-11.94 0-3.19-1.24-6.19-3.5-8.45Z" />
    </svg>
  )
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 7.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5ZM5.5 9.25h2.88V19H5.5V9.25Zm5.13 0h2.76v1.33h.04c.38-.73 1.32-1.5 2.72-1.5 2.91 0 3.45 1.91 3.45 4.4V19h-2.88v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.58V19h-2.88V9.25Z" />
    </svg>
  )
}

const WISHLIST_KEY = "teeshogs_wishlist"

type ProductShareBarProps = {
  product: Product
  className?: string
}

export function ProductShareBar({ product, className }: ProductShareBarProps) {
  const { addToCompare, compareList } = useStore()
  const [wishlisted, setWishlisted] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    setShareUrl(typeof window !== "undefined" ? window.location.href : absoluteUrl(`/product/${product.slug}`))
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]") as string[]
      setWishlisted(stored.includes(product.id))
    } catch {
      setWishlisted(false)
    }
  }, [product.id, product.slug])

  const inCompare = compareList.some((item) => item.id === product.id)

  const shareLinks = useMemo(() => {
    const url = encodeURIComponent(shareUrl || absoluteUrl(`/product/${product.slug}`))
    const text = encodeURIComponent(product.name)
    return [
      {
        label: "Share on Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        icon: FacebookIcon,
      },
      {
        label: "Share on X",
        href: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
        icon: XIcon,
      },
      {
        label: "Share on Pinterest",
        href: `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`,
        icon: PinterestIcon,
      },
      {
        label: "Share on WhatsApp",
        href: `https://wa.me/?text=${text}%20${url}`,
        icon: WhatsAppShareIcon,
      },
      {
        label: "Share on LinkedIn",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        icon: LinkedInIcon,
      },
    ] as const
  }, [product.name, product.slug, shareUrl])

  const toggleWishlist = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]") as string[]
      const next = wishlisted
        ? stored.filter((id) => id !== product.id)
        : Array.from(new Set([...stored, product.id]))
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next))
      setWishlisted(!wishlisted)
      toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist")
    } catch {
      toast.error("Could not update wishlist")
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {shareLinks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="inline-flex size-9 items-center justify-center rounded-none border border-border text-foreground/80 transition-colors hover:border-foreground hover:text-foreground"
          >
            <item.icon className="size-3.5" />
          </a>
        ))}
      </div>

      <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          onClick={toggleWishlist}
          className="inline-flex size-9 items-center justify-center rounded-none border border-border text-foreground/80 transition-colors hover:border-foreground hover:text-foreground"
        >
          <Heart className={cn("size-4", wishlisted && "fill-foreground text-foreground")} />
        </button>
        <button
          type="button"
          aria-label={inCompare ? "Already in compare" : "Add to compare"}
          aria-pressed={inCompare}
          onClick={() => addToCompare(product)}
          className="inline-flex size-9 items-center justify-center rounded-none border border-border text-foreground/80 transition-colors hover:border-foreground hover:text-foreground"
        >
          <Scale className={cn("size-4", inCompare && "text-foreground")} />
        </button>
      </div>
    </div>
  )
}
