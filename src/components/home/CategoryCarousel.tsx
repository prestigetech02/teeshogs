"use client"

import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export type CategoryCard = {
  name: string
  slug: string
  image: string
}

type CategoryCarouselProps = {
  categories: CategoryCard[]
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false,
        dragFree: true,
      }}
      className="relative w-full"
    >
      <CarouselContent className="-ml-4">
        {categories.map((category) => (
          <CarouselItem
            key={category.slug}
            className="basis-[70%] pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
          >
            <Link
              href={`/shop?category=${category.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-muted"
            >
              <img
                src={`/${category.image}`}
                alt={category.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <span className="text-center text-lg font-semibold uppercase tracking-widest text-white sm:text-xl">
                  {category.name}
                </span>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious
        variant="secondary"
        className="left-2 z-10 size-10 border-0 bg-background/90 shadow-md backdrop-blur-sm disabled:opacity-40"
      />
      <CarouselNext
        variant="secondary"
        className="right-2 z-10 size-10 border-0 bg-background/90 shadow-md backdrop-blur-sm disabled:opacity-40"
      />
    </Carousel>
  )
}
