"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resolveAdminImageSrc } from "@/lib/admin-products"
import {
  generateVariantDrafts,
  variantLabel,
  type VariantDraft,
} from "@/lib/product-variants"

type ProductVariantsEditorProps = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  drafts: VariantDraft[]
  onChange: (drafts: VariantDraft[]) => void
  sizes: string[]
  colors: string[]
  productImages: string[]
  basePrice: number
  baseStock: number
}

export function ProductVariantsEditor({
  enabled,
  onEnabledChange,
  drafts,
  onChange,
  sizes,
  colors,
  productImages,
  basePrice,
  baseStock,
}: ProductVariantsEditorProps) {
  const updateDraft = (clientId: string, patch: Partial<VariantDraft>) => {
    onChange(drafts.map((draft) => (draft.clientId === clientId ? { ...draft, ...patch } : draft)))
  }

  const removeDraft = (clientId: string) => {
    onChange(drafts.filter((draft) => draft.clientId !== clientId))
  }

  const generate = () => {
    onChange(
      generateVariantDrafts({
        sizes,
        colors,
        basePrice,
        baseStock,
        existing: drafts,
      })
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest">Variations</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Give each size/color its own price, stock, and optional gallery image.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Enable
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </label>
      </div>

      {enabled && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={generate}>
              Generate from sizes & colors
            </Button>
          </div>

          {drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Select sizes and/or colors, then generate combinations.
            </p>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.clientId}
                  className="grid gap-3 rounded-md border border-border p-3 lg:grid-cols-[minmax(0,1.1fr)_5.5rem_5.5rem_4.5rem_6rem_minmax(0,1fr)_auto]"
                >
                  <div>
                    <Label className="text-xs text-muted-foreground">Variant</Label>
                    <p className="mt-1 text-sm font-medium">
                      {variantLabel(draft.size, draft.color)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(event) =>
                        updateDraft(draft.clientId, { price: Number(event.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Compare</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.compare_price ?? ""}
                      onChange={(event) => {
                        const value = event.target.value
                        updateDraft(draft.clientId, {
                          compare_price: value === "" ? null : Number(value) || 0,
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.stock}
                      onChange={(event) =>
                        updateDraft(draft.clientId, {
                          stock: Math.max(0, Math.floor(Number(event.target.value) || 0)),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">SKU</Label>
                    <Input
                      value={draft.sku}
                      onChange={(event) => updateDraft(draft.clientId, { sku: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Image</Label>
                    <div className="flex items-center gap-2">
                      {draft.image ? (
                        <img
                          src={resolveAdminImageSrc(draft.image)}
                          alt=""
                          className="size-9 shrink-0 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="size-9 shrink-0 rounded-md border border-dashed bg-muted" />
                      )}
                      <Select
                        value={draft.image || "__none__"}
                        onValueChange={(value) =>
                          updateDraft(draft.clientId, {
                            image: value === "__none__" ? null : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-full min-w-0">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No image</SelectItem>
                          {productImages.map((image) => (
                            <SelectItem key={image} value={image}>
                              {image.split("/").pop() || image}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => removeDraft(draft.clientId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {productImages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upload product images above first, then assign one to each color/size variant.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
