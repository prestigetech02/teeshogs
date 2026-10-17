"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function BrandLogo({ className, imageClassName, priority = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center transition-opacity hover:opacity-90", className)}
      aria-label="Teeshogs Clothier home"
    >
      <Image
        src="/teeshogs-logo.jpg"
        alt="Teeshogs Clothier"
        width={280}
        height={72}
        priority={priority}
        className={cn("h-9 w-auto object-contain sm:h-10 md:h-11", imageClassName)}
      />
    </Link>
  )
}
