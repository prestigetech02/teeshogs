"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/supabase"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import {
  normalizeComparePrice,
  productFormSchema,
  resolveAdminImageSrc,
  shopCategories,
  shopColors,
  shopSizes,
  slugifyProductName,
  type ProductFormValues,
} from "@/lib/admin-products"
import type { CatalogOption } from "@/lib/admin-catalog-options"
import { slugifyAttributeName } from "@/lib/attributes"
import { normalizeHex, resolveColorHex, type ColorHexMap } from "@/lib/colors"
import {
  deleteProductImageObject,
  PRODUCT_IMAGE_ACCEPT,
  uploadProductImageFiles,
} from "@/lib/product-images"
import {
  draftsFromVariants,
  type VariantDraft,
} from "@/lib/product-variants"
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ProductFormProps = {
  mode: "create" | "edit"
  product?: Product
  categories?: CatalogOption[]
  brands?: CatalogOption[]
  sizes?: string[]
  colors?: string[]
  colorHexByName?: ColorHexMap
  colorAttributeId?: string | null
}

export function ProductForm({
  mode,
  product,
  categories: categoryOptions,
  brands: brandOptions = [],
  sizes: sizeOptions,
  colors: colorOptions,
  colorHexByName,
  colorAttributeId: initialColorAttributeId = null,
}: ProductFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [slugLocked, setSlugLocked] = useState(mode === "edit")
  const [imageDraft, setImageDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hasVariants, setHasVariants] = useState(Boolean(product?.has_variants))
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>(() =>
    draftsFromVariants(product?.variants ?? [])
  )
  const [colorAttributeId, setColorAttributeId] = useState<string | null>(
    initialColorAttributeId
  )
  const [availableColors, setAvailableColors] = useState(() =>
    colorOptions && colorOptions.length > 0 ? colorOptions : [...shopColors]
  )
  const [hexByName, setHexByName] = useState<ColorHexMap>(() => ({
    ...(colorHexByName ?? {}),
  }))
  const [newColorName, setNewColorName] = useState("")
  const [newColorHex, setNewColorHex] = useState("#808080")
  const [creatingColor, setCreatingColor] = useState(false)

  const categories =
    categoryOptions && categoryOptions.length > 0
      ? categoryOptions
      : shopCategories.map((item) => ({ label: item.label, value: item.value }))

  const availableSizes =
    sizeOptions && sizeOptions.length > 0 ? sizeOptions : [...shopSizes]

  useEffect(() => {
    setColorAttributeId(initialColorAttributeId)
  }, [initialColorAttributeId])

  useEffect(() => {
    setAvailableColors(
      colorOptions && colorOptions.length > 0 ? colorOptions : [...shopColors]
    )
    setHexByName({ ...(colorHexByName ?? {}) })
  }, [colorOptions, colorHexByName])

  const defaults = useMemo<ProductFormValues>(
    () => ({
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      compare_price: product?.compare_price ?? null,
      category: product?.category ?? categories[0]?.value ?? "dresses",
      subcategory: product?.subcategory ?? "",
      brand_id: product?.brand_id ?? "",
      images: product?.images ?? [],
      sizes: product?.sizes ?? [],
      colors: product?.colors ?? [],
      sku: product?.sku ?? "",
      stock: product?.stock ?? 0,
      featured: product?.featured ?? false,
      new_arrival: product?.new_arrival ?? false,
      sale: product?.sale ?? false,
    }),
    [categories, product]
  )

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaults,
  })

  const images = form.watch("images")
  const sizes = form.watch("sizes")
  const colors = form.watch("colors")
  const nameValue = form.watch("name")

  useEffect(() => {
    if (slugLocked) return
    form.setValue("slug", slugifyProductName(nameValue || ""), {
      shouldValidate: true,
    })
  }, [form, nameValue, slugLocked])

  const toggleListValue = (
    field: "sizes" | "colors",
    value: string,
    checked: boolean
  ) => {
    const current = form.getValues(field)
    const next = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value)
    form.setValue(field, next, { shouldDirty: true })
  }

  const ensureColorAttributeId = async (
    supabase: ReturnType<typeof createSupabaseBrowserClient>
  ) => {
    if (colorAttributeId) return colorAttributeId

    const { data: existing } = await supabase
      .from("attributes")
      .select("id")
      .eq("slug", "color")
      .maybeSingle()

    if (existing?.id) {
      setColorAttributeId(existing.id as string)
      return existing.id as string
    }

    const { data: created, error } = await supabase
      .from("attributes")
      .insert({
        name: "Color",
        slug: "color",
        type: "color",
        order_by: "custom",
        description: "Product color options",
      })
      .select("id")
      .single()

    if (error || !created?.id) {
      throw new Error(error?.message || "Could not create color attribute")
    }

    setColorAttributeId(created.id as string)
    return created.id as string
  }

  const createColorOption = async () => {
    const name = newColorName.trim()
    if (!name) {
      toast.error("Enter a color name")
      return
    }

    const hex = normalizeHex(newColorHex)
    if (!hex) {
      toast.error("Pick a valid color")
      return
    }

    const duplicate = availableColors.find(
      (color) => color.toLowerCase() === name.toLowerCase()
    )
    if (duplicate) {
      toggleListValue("colors", duplicate, true)
      toast.message(`“${duplicate}” already exists — selected for this product`)
      setNewColorName("")
      return
    }

    setCreatingColor(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const attributeId = await ensureColorAttributeId(supabase)
      const slug = slugifyAttributeName(name) || `color-${Date.now()}`

      const { data: existingTerms } = await supabase
        .from("attribute_terms")
        .select("sort_order")
        .eq("attribute_id", attributeId)
        .order("sort_order", { ascending: false })
        .limit(1)

      const nextOrder =
        Number((existingTerms?.[0] as { sort_order?: number } | undefined)?.sort_order || 0) +
        10

      const { data, error } = await supabase
        .from("attribute_terms")
        .insert({
          attribute_id: attributeId,
          name,
          slug,
          sort_order: nextOrder,
          hex,
        })
        .select("id, name, hex")
        .single()

      if (error) throw error

      const savedName = (data?.name as string) || name
      setAvailableColors((current) => [...current, savedName])
      setHexByName((current) => ({ ...current, [savedName]: hex }))
      toggleListValue("colors", savedName, true)
      setNewColorName("")
      setNewColorHex("#808080")
      toast.success(`Color “${savedName}” added`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add color")
    } finally {
      setCreatingColor(false)
    }
  }

  const addImage = () => {
    const next = imageDraft.trim()
    if (!next) return
    const current = form.getValues("images")
    if (current.includes(next)) {
      toast.error("That image is already in the list")
      return
    }
    form.setValue("images", [...current, next], { shouldDirty: true })
    setImageDraft("")
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    const current = [...form.getValues("images")]
    const target = index + direction
    if (target < 0 || target >= current.length) return
    ;[current[index], current[target]] = [current[target], current[index]]
    form.setValue("images", current, { shouldDirty: true })
  }

  const removeImage = async (index: number) => {
    const current = form.getValues("images")
    const removed = current[index]
    const next = current.filter((_, i) => i !== index)
    form.setValue("images", next, { shouldDirty: true })

    if (!removed) return
    try {
      const supabase = createSupabaseBrowserClient()
      await deleteProductImageObject(supabase, removed)
    } catch {
      toast.error("Image removed from product, but Storage delete failed")
    }
  }

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setUploading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const files = Array.from(fileList)
      const uploaded = await uploadProductImageFiles(supabase, files)
      const current = form.getValues("images")
      const merged = [...current]
      for (const path of uploaded) {
        if (!merged.includes(path)) merged.push(path)
      }
      form.setValue("images", merged, { shouldDirty: true })
      toast.success(uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const slug = values.slug.trim()

      let slugQuery = supabase.from("products").select("id").eq("slug", slug)
      if (mode === "edit" && product) {
        slugQuery = slugQuery.neq("id", product.id)
      }
      const { data: existingSlug, error: slugError } = await slugQuery.maybeSingle()
      if (slugError) throw slugError
      if (existingSlug) {
        form.setError("slug", { message: "This slug is already in use" })
        throw new Error("Slug already exists")
      }

      const payload = {
        name: values.name.trim(),
        slug,
        description: values.description.trim(),
        price: values.price,
        compare_price: normalizeComparePrice(values.compare_price),
        category: values.category,
        subcategory: values.subcategory?.trim() || null,
        brand_id: values.brand_id?.trim() || null,
        images: values.images,
        sizes: values.sizes,
        colors: values.colors,
        sku: values.sku?.trim() || null,
        stock: hasVariants
          ? variantDrafts.reduce((sum, draft) => sum + (Number(draft.stock) || 0), 0)
          : values.stock,
        featured: values.featured,
        new_arrival: values.new_arrival,
        sale: values.sale,
        has_variants: hasVariants,
      }

      if (hasVariants) {
        if (variantDrafts.length === 0) {
          throw new Error("Add at least one variation, or turn variations off")
        }
        if (variantDrafts.some((draft) => !draft.price || draft.price <= 0)) {
          throw new Error("Each variation needs a price greater than 0")
        }
      }

      let productId = product?.id

      if (mode === "create") {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single()
        if (error) throw error
        productId = data.id
      } else if (product) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id)
        if (error) throw error
      }

      if (!productId) throw new Error("Missing product id")

      if (hasVariants) {
        const rows = variantDrafts.map((draft, index) => ({
          product_id: productId,
          size: draft.size || "",
          color: draft.color || "",
          price: draft.price,
          compare_price: draft.compare_price,
          stock: draft.stock,
          sku: draft.sku.trim() || null,
          image: draft.image?.trim() || null,
          sort_order: index,
        }))

        const { error: deleteError } = await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", productId)
        if (deleteError) throw deleteError

        const { error: insertError } = await supabase.from("product_variants").insert(rows)
        if (insertError) throw insertError
      } else {
        const { error: deleteError } = await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", productId)
        if (deleteError) throw deleteError
      }

      if (mode === "create") {
        toast.success("Product created")
        router.push(`/admin/products/${productId}`)
        router.refresh()
      } else {
        toast.success("Product updated")
        router.refresh()
      }
    } catch (error) {
      if (!(error instanceof Error && error.message === "Slug already exists")) {
        toast.error(error instanceof Error ? error.message : "Could not save product")
      }
    } finally {
      setSaving(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6 rounded-lg border border-border bg-background p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="slug">Slug</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={slugLocked}
                    onCheckedChange={(checked) => setSlugLocked(checked === true)}
                  />
                  Lock slug
                </label>
              </div>
              <Input
                id="slug"
                {...form.register("slug")}
                readOnly={!slugLocked && mode === "create"}
                className={!slugLocked && mode === "create" ? "bg-muted" : undefined}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={5} {...form.register("description")} />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{hasVariants ? "Base price (NGN)" : "Price (NGN)"}</Label>
              <Input id="price" type="number" step="0.01" min="0" {...form.register("price")} />
              {hasVariants && (
                <p className="text-xs text-muted-foreground">
                  Used as the default when generating variation prices.
                </p>
              )}
              {form.formState.errors.price && (
                <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="compare_price">Compare at price</Label>
              <Input
                id="compare_price"
                type="number"
                step="0.01"
                min="0"
                {...form.register("compare_price")}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) =>
                  form.setValue("category", value, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Brand</Label>
              <Select
                value={form.watch("brand_id") || "__none__"}
                onValueChange={(value) =>
                  form.setValue("brand_id", value === "__none__" ? "" : value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No brand</SelectItem>
                  {brandOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {brandOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No active brands yet. Add one under Products → Brands.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input id="subcategory" placeholder="e.g. maxi, blazers" {...form.register("subcategory")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">{hasVariants ? "Base SKU" : "SKU"}</Label>
              <Input id="sku" placeholder="e.g. TPH-DRS-001" {...form.register("sku")} />
              {hasVariants && (
                <p className="text-xs text-muted-foreground">
                  Optional product SKU. Variations can still have their own SKUs.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">{hasVariants ? "Fallback stock" : "Stock"}</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                {...form.register("stock")}
                disabled={hasVariants}
              />
              {hasVariants && (
                <p className="text-xs text-muted-foreground">
                  Stock is managed per variation when variations are enabled.
                </p>
              )}
              {form.formState.errors.stock && (
                <p className="text-xs text-destructive">{form.formState.errors.stock.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const active = sizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleListValue("sizes", size, !active)}
                    className={cn(
                      "min-w-10 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            {availableSizes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No size terms yet. Add them under Products → Attributes → size.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label>Colors</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Select existing colors, or create a new one with a name and color picker. Shoppers
                see the swatch and name on the product page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => {
                const checked = colors.includes(color)
                const hex = resolveColorHex(color, hexByName)
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => toggleListValue("colors", color, !checked)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm transition-colors",
                      checked
                        ? "border-foreground bg-muted"
                        : "border-border hover:border-foreground/50"
                    )}
                  >
                    <span
                      className="size-5 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: hex }}
                    />
                    {color}
                  </button>
                )
              })}
            </div>
            {availableColors.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No colors yet — create one below.
              </p>
            )}
            <div className="rounded-md border border-dashed border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Add a new color</p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[10rem] flex-1 space-y-1.5">
                  <Label htmlFor="new-color-name" className="text-xs">
                    Color name
                  </Label>
                  <Input
                    id="new-color-name"
                    value={newColorName}
                    onChange={(event) => setNewColorName(event.target.value)}
                    placeholder="e.g. Dusty Rose"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        void createColorOption()
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-color-hex" className="text-xs">
                    Swatch
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="new-color-hex"
                      type="color"
                      value={normalizeHex(newColorHex) || "#808080"}
                      onChange={(event) => setNewColorHex(event.target.value)}
                      className="h-10 w-14 cursor-pointer p-1"
                      title="Pick color"
                    />
                    <Input
                      value={newColorHex}
                      onChange={(event) => setNewColorHex(event.target.value)}
                      placeholder="#808080"
                      className="w-[7.5rem] font-mono text-xs uppercase"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={creatingColor}
                  onClick={() => void createColorOption()}
                >
                  <Plus className="size-4" />
                  {creatingColor ? "Adding…" : "Add color"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border border-border bg-background p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest">Flags</h2>
            <label className="flex items-center justify-between gap-3 text-sm">
              Featured
              <Switch
                checked={form.watch("featured")}
                onCheckedChange={(checked) => form.setValue("featured", checked, { shouldDirty: true })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              New arrival
              <Switch
                checked={form.watch("new_arrival")}
                onCheckedChange={(checked) =>
                  form.setValue("new_arrival", checked, { shouldDirty: true })
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              On sale
              <Switch
                checked={form.watch("sale")}
                onCheckedChange={(checked) => form.setValue("sale", checked, { shouldDirty: true })}
              />
            </label>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-background p-5">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest">Images</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload to Supabase Storage (JPEG/PNG/WebP/GIF, max 5MB). Reorder for gallery order.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              multiple
              className="hidden"
              onChange={(event) => void handleFilesSelected(event.target.files)}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {uploading ? "Uploading..." : "Upload images"}
            </Button>

            <div className="flex gap-2">
              <Input
                value={imageDraft}
                onChange={(event) => setImageDraft(event.target.value)}
                placeholder="Or path / URL (dress-1.webp)"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addImage()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addImage}>
                <Plus className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {images.length === 0 ? (
                <p className="text-sm text-muted-foreground">No images yet.</p>
              ) : (
                images.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="flex items-center gap-2 rounded-md border border-border p-2"
                  >
                    <div className="size-12 overflow-hidden rounded bg-muted">
                      <img
                        src={resolveAdminImageSrc(image)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-xs">{image}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => void removeImage(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductVariantsEditor
        enabled={hasVariants}
        onEnabledChange={setHasVariants}
        drafts={variantDrafts}
        onChange={setVariantDrafts}
        sizes={sizes}
        colors={colors}
        productImages={images}
        basePrice={Number(form.watch("price")) || 0}
        baseStock={Number(form.watch("stock")) || 0}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
        {mode === "edit" && product && (
          <Button type="button" variant="ghost" asChild>
            <Link href={`/product/${product.slug}`} target="_blank">
              View on store
            </Link>
          </Button>
        )}
      </div>
    </form>
  )
}
