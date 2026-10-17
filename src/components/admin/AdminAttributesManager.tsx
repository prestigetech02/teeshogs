"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import {
  attributeFormSchema,
  attributeOrderByLabel,
  attributeOrderByOptions,
  attributeTypeLabel,
  attributeTypes,
  slugifyAttributeName,
  sortAttributeTerms,
  type AttributeFormValues,
  type AttributeTerm,
  type ProductAttribute,
} from "@/lib/attributes"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

type AdminAttributesManagerProps = {
  initialAttributes: ProductAttribute[]
}

export function AdminAttributesManager({ initialAttributes }: AdminAttributesManagerProps) {
  const [attributes, setAttributes] = useState(initialAttributes)
  const [query, setQuery] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ProductAttribute | null>(null)
  const [saving, setSaving] = useState(false)
  const [slugLocked, setSlugLocked] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ProductAttribute | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [termsOpen, setTermsOpen] = useState(false)
  const [termsAttribute, setTermsAttribute] = useState<ProductAttribute | null>(null)
  const [termDraft, setTermDraft] = useState("")
  const [termHex, setTermHex] = useState("#808080")
  const [savingTerm, setSavingTerm] = useState(false)

  useEffect(() => {
    setAttributes(initialAttributes)
  }, [initialAttributes])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return attributes
    return attributes.filter(
      (attribute) =>
        attribute.name.toLowerCase().includes(needle) ||
        attribute.slug.toLowerCase().includes(needle) ||
        attribute.terms.some((term) => term.name.toLowerCase().includes(needle))
    )
  }, [attributes, query])

  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "text",
      order_by: "custom",
      description: "",
    },
  })

  const nameValue = form.watch("name")

  useEffect(() => {
    if (slugLocked || editing) return
    form.setValue("slug", slugifyAttributeName(nameValue || ""), { shouldValidate: true })
  }, [editing, form, nameValue, slugLocked])

  const openCreate = () => {
    setEditing(null)
    setSlugLocked(false)
    form.reset({
      name: "",
      slug: "",
      type: "text",
      order_by: "custom",
      description: "",
    })
    setSheetOpen(true)
  }

  const openEdit = (attribute: ProductAttribute) => {
    setEditing(attribute)
    setSlugLocked(true)
    form.reset({
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      order_by: attribute.order_by,
      description: attribute.description ?? "",
    })
    setSheetOpen(true)
  }

  const openTerms = (attribute: ProductAttribute) => {
    setTermsAttribute(attribute)
    setTermDraft("")
    setTermHex("#808080")
    setTermsOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const slug = values.slug.trim()

      let slugQuery = supabase.from("attributes").select("id").eq("slug", slug)
      if (editing) slugQuery = slugQuery.neq("id", editing.id)
      const { data: existing, error: slugError } = await slugQuery.maybeSingle()
      if (slugError) throw slugError
      if (existing) {
        form.setError("slug", { message: "This slug is already in use" })
        throw new Error("Slug already exists")
      }

      const payload = {
        name: values.name.trim(),
        slug,
        type: values.type,
        order_by: values.order_by,
        description: values.description?.trim() || "",
      }

      if (editing) {
        const { data, error } = await supabase
          .from("attributes")
          .update(payload)
          .eq("id", editing.id)
          .select("*")
          .single()
        if (error) throw error

        setAttributes((current) =>
          current.map((attribute) =>
            attribute.id === editing.id
              ? { ...attribute, ...(data as Omit<ProductAttribute, "terms">) }
              : attribute
          )
        )
        toast.success("Attribute updated")
      } else {
        const { data, error } = await supabase
          .from("attributes")
          .insert(payload)
          .select("*")
          .single()
        if (error) throw error

        const created: ProductAttribute = {
          ...(data as Omit<ProductAttribute, "terms">),
          terms: [],
        }
        setAttributes((current) => [created, ...current])
        toast.success("Attribute created")
      }

      setSheetOpen(false)
    } catch (error) {
      if (!(error instanceof Error && error.message === "Slug already exists")) {
        toast.error(error instanceof Error ? error.message : "Could not save attribute")
      }
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from("attributes").delete().eq("id", pendingDelete.id)
    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }
    setAttributes((current) => current.filter((attribute) => attribute.id !== pendingDelete.id))
    if (termsAttribute?.id === pendingDelete.id) {
      setTermsOpen(false)
      setTermsAttribute(null)
    }
    toast.success(`${pendingDelete.name} deleted`)
    setPendingDelete(null)
    setDeleting(false)
  }

  const isColorAttribute =
    termsAttribute?.type === "color" || termsAttribute?.slug === "color"

  const updateTermHex = async (term: AttributeTerm, hex: string) => {
    if (!termsAttribute) return
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("attribute_terms")
      .update({ hex })
      .eq("id", term.id)
      .select("*")
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    const updated = data as AttributeTerm
    setAttributes((current) =>
      current.map((attribute) =>
        attribute.id === termsAttribute.id
          ? {
              ...attribute,
              terms: attribute.terms.map((item) => (item.id === term.id ? updated : item)),
            }
          : attribute
      )
    )
    setTermsAttribute((current) =>
      current
        ? {
            ...current,
            terms: current.terms.map((item) => (item.id === term.id ? updated : item)),
          }
        : current
    )
  }

  const addTerm = async () => {
    if (!termsAttribute) return
    const name = termDraft.trim()
    if (!name) {
      toast.error("Enter a term name")
      return
    }

    setSavingTerm(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const slug = slugifyAttributeName(name)
      const nextOrder =
        termsAttribute.terms.reduce((max, term) => Math.max(max, term.sort_order), 0) + 10

      const { data, error } = await supabase
        .from("attribute_terms")
        .insert({
          attribute_id: termsAttribute.id,
          name,
          slug,
          sort_order: nextOrder,
          hex: isColorAttribute ? termHex : null,
        })
        .select("*")
        .single()
      if (error) throw error

      const term = data as AttributeTerm
      setAttributes((current) =>
        current.map((attribute) =>
          attribute.id === termsAttribute.id
            ? { ...attribute, terms: [...attribute.terms, term] }
            : attribute
        )
      )
      setTermsAttribute((current) =>
        current ? { ...current, terms: [...current.terms, term] } : current
      )
      setTermDraft("")
      setTermHex("#808080")
      toast.success("Term added")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add term")
    } finally {
      setSavingTerm(false)
    }
  }

  const removeTerm = async (term: AttributeTerm) => {
    if (!termsAttribute) return
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from("attribute_terms").delete().eq("id", term.id)
    if (error) {
      toast.error(error.message)
      return
    }

    setAttributes((current) =>
      current.map((attribute) =>
        attribute.id === termsAttribute.id
          ? { ...attribute, terms: attribute.terms.filter((item) => item.id !== term.id) }
          : attribute
      )
    )
    setTermsAttribute((current) =>
      current
        ? { ...current, terms: current.terms.filter((item) => item.id !== term.id) }
        : current
    )
    toast.success("Term removed")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Attributes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Define shared options like color and size for product variations.
          </p>
        </div>
        <Button type="button" className="shrink-0 self-start sm:self-auto" onClick={openCreate}>
          <Plus className="size-4" />
          Add attribute
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search attributes..."
          className="pl-9"
        />
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Order by</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No attributes yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((attribute, index) => {
                const terms = sortAttributeTerms(attribute.terms, attribute.order_by)
                const termPreview = terms.map((term) => term.name).join(", ")
                return (
                  <TableRow
                    key={attribute.id}
                    className={cn(index % 2 === 1 && "bg-muted/30")}
                  >
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                        onClick={() => openEdit(attribute)}
                      >
                        {attribute.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{attribute.slug}</TableCell>
                    <TableCell>{attributeTypeLabel(attribute.type)}</TableCell>
                    <TableCell>{attributeOrderByLabel(attribute.order_by)}</TableCell>
                    <TableCell className="max-w-[18rem] min-w-[12rem] whitespace-normal align-top">
                      <p className="wrap-break-word text-sm whitespace-normal text-muted-foreground">
                        {termPreview || "No terms yet."}
                      </p>
                      <button
                        type="button"
                        className="mt-1 text-sm font-medium text-foreground underline-offset-2 hover:underline"
                        onClick={() => openTerms(attribute)}
                      >
                        Configure terms
                      </button>
                    </TableCell>
                    <TableCell className="w-[1%] whitespace-nowrap text-right align-top">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${attribute.name}`}
                          onClick={() => openEdit(attribute)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${attribute.name}`}
                          onClick={() => setPendingDelete(attribute)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{editing ? "Edit attribute" : "Add attribute"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Update this attribute. Terms are managed separately."
                : "Create an attribute, then configure its terms from the table."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="attribute-name">Name</Label>
              <Input id="attribute-name" placeholder="e.g. color" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="attribute-slug">Slug</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setSlugLocked((current) => !current)}
                >
                  {slugLocked ? "Unlock auto-slug" : "Lock slug"}
                </button>
              </div>
              <Input id="attribute-slug" {...form.register("slug")} />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as AttributeFormValues["type"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attributeTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order by</Label>
              <Select
                value={form.watch("order_by")}
                onValueChange={(value) =>
                  form.setValue("order_by", value as AttributeFormValues["order_by"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attributeOrderByOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attribute-description">Description</Label>
              <Textarea
                id="attribute-description"
                rows={3}
                placeholder="Optional"
                {...form.register("description")}
              />
            </div>

            <SheetFooter className="mt-auto border-t border-border pt-4 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Add attribute"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={termsOpen} onOpenChange={setTermsOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Configure terms</SheetTitle>
            <SheetDescription>
              {termsAttribute
                ? `Terms for “${termsAttribute.name}”. Changes appear in the table immediately.`
                : "Manage attribute terms."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex gap-2">
                <Input
                  value={termDraft}
                  onChange={(event) => setTermDraft(event.target.value)}
                  placeholder={isColorAttribute ? "Color name (e.g. Dusty Rose)" : "New term name"}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      void addTerm()
                    }
                  }}
                />
                <Button type="button" disabled={savingTerm} onClick={() => void addTerm()}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {isColorAttribute && (
                <div className="flex items-center gap-3">
                  <Label htmlFor="term-hex" className="shrink-0 text-xs text-muted-foreground">
                    Swatch
                  </Label>
                  <input
                    id="term-hex"
                    type="color"
                    value={termHex}
                    onChange={(event) => setTermHex(event.target.value.toUpperCase())}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
                    title="Pick color"
                  />
                  <Input
                    value={termHex}
                    onChange={(event) => setTermHex(event.target.value.toUpperCase())}
                    placeholder="#808080"
                    className="font-mono text-xs uppercase"
                  />
                </div>
              )}
            </div>

            <ul className="space-y-2">
              {termsAttribute &&
              sortAttributeTerms(termsAttribute.terms, termsAttribute.order_by).length > 0 ? (
                sortAttributeTerms(termsAttribute.terms, termsAttribute.order_by).map((term) => (
                  <li
                    key={term.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {isColorAttribute && (
                        <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border">
                          <span
                            className="absolute inset-0"
                            style={{ backgroundColor: term.hex || "#D4D4D4" }}
                          />
                          <input
                            type="color"
                            value={term.hex || "#D4D4D4"}
                            onChange={(event) =>
                              void updateTermHex(term, event.target.value.toUpperCase())
                            }
                            className="absolute inset-0 cursor-pointer opacity-0"
                            title={`Edit ${term.name} color`}
                          />
                        </label>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{term.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {term.slug}
                          {isColorAttribute && term.hex ? ` · ${term.hex}` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remove ${term.name}`}
                      onClick={() => void removeTerm(term)}
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No terms yet.</p>
              )}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attribute?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{pendingDelete?.name}</strong> and all of its terms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
