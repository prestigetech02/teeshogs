"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Plus,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { saveHeroSlides } from "@/app/admin/settings/actions"
import {
  SITE_ASSET_ACCEPT,
  resolveSiteImageSrc,
  uploadSiteAssetFile,
} from "@/lib/site-assets"
import {
  HERO_SLIDES_MAX,
  HERO_SLIDES_MIN,
  emptyHeroSlide,
  type HeroSlide,
} from "@/lib/site-settings"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AdminHeroSettingsProps = {
  initialSlides: HeroSlide[]
}

export function AdminHeroSettings({ initialSlides }: AdminHeroSettingsProps) {
  const [slides, setSlides] = useState(initialSlides)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    setSlides(initialSlides)
  }, [initialSlides])

  const updateSlide = (id: string, patch: Partial<HeroSlide>) => {
    setSlides((current) =>
      current.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide))
    )
  }

  const updateCta = (
    id: string,
    which: "primaryCta" | "secondaryCta",
    patch: Partial<HeroSlide["primaryCta"]>
  ) => {
    setSlides((current) =>
      current.map((slide) =>
        slide.id === id ? { ...slide, [which]: { ...slide[which], ...patch } } : slide
      )
    )
  }

  const moveSlide = (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= slides.length) return
    setSlides((current) => {
      const copy = [...current]
      const [item] = copy.splice(index, 1)
      copy.splice(next, 0, item)
      return copy
    })
  }

  const addSlide = () => {
    if (slides.length >= HERO_SLIDES_MAX) {
      toast.error(`You can have at most ${HERO_SLIDES_MAX} slides`)
      return
    }
    setSlides((current) => [...current, emptyHeroSlide()])
  }

  const removeSlide = (id: string) => {
    if (slides.length <= HERO_SLIDES_MIN) {
      toast.error(`Keep at least ${HERO_SLIDES_MIN} slide`)
      return
    }
    setSlides((current) => current.filter((slide) => slide.id !== id))
  }

  const handleUpload = async (slideId: string, files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    setUploadingId(slideId)
    try {
      const supabase = createSupabaseBrowserClient()
      const path = await uploadSiteAssetFile(supabase, file, "hero")
      updateSlide(slideId, {
        image: path,
        imageAlt: (slides.find((s) => s.id === slideId)?.imageAlt || file.name).trim(),
      })
      toast.success("Image uploaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploadingId(null)
      const input = fileInputs.current[slideId]
      if (input) input.value = ""
    }
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const result = await saveHeroSlides(slides)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Hero slides saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure homepage hero slides — images, copy, and CTAs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={addSlide} disabled={slides.length >= HERO_SLIDES_MAX}>
            <Plus className="size-4" />
            Add slide
          </Button>
          <Button type="button" onClick={() => void onSave()} disabled={saving || uploadingId !== null}>
            {saving ? "Saving..." : "Save hero"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {slides.map((slide, index) => {
          const preview = slide.image ? resolveSiteImageSrc(slide.image) : null
          const uploading = uploadingId === slide.id

          return (
            <Card key={slide.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">Slide {index + 1}</CardTitle>
                  <CardDescription>Full-bleed image and text shown together on the homepage.</CardDescription>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Move slide up"
                    disabled={index === 0}
                    onClick={() => moveSlide(index, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Move slide down"
                    disabled={index === slides.length - 1}
                    onClick={() => moveSlide(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Remove slide"
                    disabled={slides.length <= HERO_SLIDES_MIN}
                    onClick={() => removeSlide(slide.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="space-y-3">
                  <div className="aspect-[4/5] overflow-hidden rounded-md border bg-muted">
                    {preview ? (
                      <img src={preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-8" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={(node) => {
                      fileInputs.current[slide.id] = node
                    }}
                    type="file"
                    accept={SITE_ASSET_ACCEPT}
                    className="hidden"
                    onChange={(event) => void handleUpload(slide.id, event.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploading}
                    onClick={() => fileInputs.current[slide.id]?.click()}
                  >
                    <Upload className="size-4" />
                    {uploading ? "Uploading..." : "Upload image"}
                  </Button>
                  <div className="space-y-1.5">
                    <Label htmlFor={`image-${slide.id}`}>Image path / URL</Label>
                    <Input
                      id={`image-${slide.id}`}
                      value={slide.image}
                      onChange={(event) => updateSlide(slide.id, { image: event.target.value })}
                      placeholder="/hero-bg.webp"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`alt-${slide.id}`}>Image alt</Label>
                    <Input
                      id={`alt-${slide.id}`}
                      value={slide.imageAlt}
                      onChange={(event) => updateSlide(slide.id, { imageAlt: event.target.value })}
                      placeholder="Describe the image"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`eyebrow-${slide.id}`}>Eyebrow</Label>
                    <Input
                      id={`eyebrow-${slide.id}`}
                      value={slide.eyebrow}
                      onChange={(event) => updateSlide(slide.id, { eyebrow: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`title-${slide.id}`}>Title line 1</Label>
                    <Input
                      id={`title-${slide.id}`}
                      value={slide.title}
                      onChange={(event) => updateSlide(slide.id, { title: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`title2-${slide.id}`}>Title line 2</Label>
                    <Input
                      id={`title2-${slide.id}`}
                      value={slide.titleLine2 ?? ""}
                      onChange={(event) => updateSlide(slide.id, { titleLine2: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`desc-${slide.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${slide.id}`}
                      rows={3}
                      value={slide.description}
                      onChange={(event) => updateSlide(slide.id, { description: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`p-label-${slide.id}`}>Primary CTA label</Label>
                    <Input
                      id={`p-label-${slide.id}`}
                      value={slide.primaryCta.label}
                      onChange={(event) =>
                        updateCta(slide.id, "primaryCta", { label: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`p-href-${slide.id}`}>Primary CTA link</Label>
                    <Input
                      id={`p-href-${slide.id}`}
                      value={slide.primaryCta.href}
                      onChange={(event) =>
                        updateCta(slide.id, "primaryCta", { href: event.target.value })
                      }
                      placeholder="/shop"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`s-label-${slide.id}`}>Secondary CTA label</Label>
                    <Input
                      id={`s-label-${slide.id}`}
                      value={slide.secondaryCta.label}
                      onChange={(event) =>
                        updateCta(slide.id, "secondaryCta", { label: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`s-href-${slide.id}`}>Secondary CTA link</Label>
                    <Input
                      id={`s-href-${slide.id}`}
                      value={slide.secondaryCta.href}
                      onChange={(event) =>
                        updateCta(slide.id, "secondaryCta", { href: event.target.value })
                      }
                      placeholder="/shop?filter=new"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
