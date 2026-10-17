"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { revalidateStorefrontNav } from "@/app/admin/products/categories/actions"
import {
  categoryFormSchema,
  categoryHasChildren,
  computeCategoryStats,
  flattenCategoriesForDisplay,
  getRootCategories,
  parentNameFor,
  slugifyCategoryName,
  type Category,
  type CategoryFormValues,
} from "@/lib/categories"
import { resolveAdminImageSrc } from "@/lib/admin-products"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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

const PAGE_SIZE = 10

type AdminCategoriesManagerProps = {
  initialCategories: Category[]
}

export function AdminCategoriesManager({ initialCategories }: AdminCategoriesManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [slugLocked, setSlugLocked] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const stats = useMemo(() => computeCategoryStats(categories), [categories])

  const ordered = useMemo(() => flattenCategoriesForDisplay(categories), [categories])

  const parentOptions = useMemo(
    () => getRootCategories(categories, editing?.id),
    [categories, editing?.id]
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return ordered.filter((category) => {
      const parentLabel = parentNameFor(categories, category)?.toLowerCase() ?? ""
      const matchesQuery =
        !needle ||
        category.name.toLowerCase().includes(needle) ||
        category.slug.toLowerCase().includes(needle) ||
        category.description.toLowerCase().includes(needle) ||
        parentLabel.includes(needle)
      const matchesStatus =
        status === "all" ||
        (status === "active" && category.is_active) ||
        (status === "inactive" && !category.is_active)
      return matchesQuery && matchesStatus
    })
  }, [categories, ordered, query, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [query, status])

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parent_id: null,
      sort_order: 0,
      is_active: true,
    },
  })

  const nameValue = form.watch("name")

  useEffect(() => {
    if (slugLocked || editing) return
    form.setValue("slug", slugifyCategoryName(nameValue || ""), { shouldValidate: true })
  }, [editing, form, nameValue, slugLocked])

  const openCreate = () => {
    setEditing(null)
    setSlugLocked(false)
    const nextSort =
      categories.reduce((max, category) => Math.max(max, category.sort_order), 0) + 10
    form.reset({
      name: "",
      slug: "",
      description: "",
      image: "",
      parent_id: null,
      sort_order: nextSort,
      is_active: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setSlugLocked(true)
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      image: category.image ?? "",
      parent_id: category.parent_id ?? null,
      sort_order: category.sort_order ?? 0,
      is_active: category.is_active,
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const slug = values.slug.trim()

      let slugQuery = supabase.from("categories").select("id").eq("slug", slug)
      if (editing) slugQuery = slugQuery.neq("id", editing.id)
      const { data: existing, error: slugError } = await slugQuery.maybeSingle()
      if (slugError) throw slugError
      if (existing) {
        form.setError("slug", { message: "This slug is already in use" })
        throw new Error("Slug already exists")
      }

      const parentId = values.parent_id || null
      if (parentId && editing && categoryHasChildren(categories, editing.id)) {
        throw new Error("Move or remove child categories before nesting this under another")
      }
      if (parentId) {
        const parent = categories.find((category) => category.id === parentId)
        if (!parent) throw new Error("Parent category not found")
        if (parent.parent_id) {
          throw new Error("Only one level of nesting is allowed")
        }
      }

      const payload = {
        name: values.name.trim(),
        slug,
        description: values.description?.trim() || "",
        image: values.image?.trim() || null,
        parent_id: parentId,
        sort_order: values.sort_order,
        is_active: values.is_active,
      }

      if (editing) {
        const previousSlug = editing.slug
        const { data, error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editing.id)
          .select("*")
          .single()
        if (error) throw error

        if (previousSlug !== slug) {
          await supabase.from("products").update({ category: slug }).eq("category", previousSlug)
        }

        setCategories((current) =>
          current
            .map((category) =>
              category.id === editing.id
                ? {
                    ...category,
                    ...(data as Category),
                    product_count: category.product_count,
                  }
                : category
            )
            .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        )
        toast.success("Category updated")
      } else {
        const { data, error } = await supabase
          .from("categories")
          .insert(payload)
          .select("*")
          .single()
        if (error) throw error
        setCategories((current) =>
          [{ ...(data as Category), product_count: 0 }, ...current].sort(
            (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
          )
        )
        toast.success("Category created")
      }

      setDialogOpen(false)
      await revalidateStorefrontNav()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save category")
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!pendingDelete) return
    if (categoryHasChildren(categories, pendingDelete.id)) {
      toast.error("Remove or reassign subcategories before deleting this category.")
      setPendingDelete(null)
      return
    }
    if ((pendingDelete.product_count ?? 0) > 0) {
      toast.error("Reassign or update products in this category before deleting it.")
      setPendingDelete(null)
      return
    }

    setDeleting(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from("categories").delete().eq("id", pendingDelete.id)
    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }
    setCategories((current) => current.filter((category) => category.id !== pendingDelete.id))
    toast.success(`${pendingDelete.name} deleted`)
    setPendingDelete(null)
    setDeleting(false)
    await revalidateStorefrontNav()
    router.refresh()
  }

  const statCards = [
    {
      title: "Total categories",
      value: stats.total,
      description: "In the taxonomy",
      icon: FolderTree,
    },
    {
      title: "Active",
      value: stats.active,
      description: "Shown in Shop menu & filters",
      icon: BadgeCheck,
    },
    {
      title: "Inactive",
      value: stats.inactive,
      description: "Hidden from filters",
      icon: FolderTree,
    },
    {
      title: "Products linked",
      value: stats.productsLinked,
      description: "Using these category slugs",
      icon: Package,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organize dresses, tops, bottoms, and the rest of the Teeshogs taxonomy.
          </p>
        </div>
        <Button type="button" className="shrink-0 self-start sm:self-auto" onClick={openCreate}>
          <Plus className="size-4" />
          Add category
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-2 text-3xl tabular-nums">{card.value}</CardTitle>
              </div>
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                <card.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No categories match these filters.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div
                      className={cn(
                        "flex items-center gap-3",
                        category.parent_id && "pl-6"
                      )}
                    >
                      <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={resolveAdminImageSrc(category.image || "category-dresses.webp")}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null
                            event.currentTarget.src = "/category-dresses.webp"
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{category.name}</p>
                        {category.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {parentNameFor(categories, category) ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{category.slug}</TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "outline" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{category.sort_order}</TableCell>
                  <TableCell className="tabular-nums">{category.product_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => setPendingDelete(category)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {currentPage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this category. Changing the slug also updates matching products."
                : "Create a top-level category or nest it under an existing parent for the Shop menu."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input id="category-name" {...form.register("name")} placeholder="e.g. Dresses" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="category-slug">Slug</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setSlugLocked((current) => !current)}
                >
                  {slugLocked ? "Unlock auto-slug" : "Lock slug"}
                </button>
              </div>
              <Input id="category-slug" {...form.register("slug")} />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Parent category</Label>
              <Select
                value={form.watch("parent_id") || "__none__"}
                onValueChange={(value) =>
                  form.setValue("parent_id", value === "__none__" ? null : value, {
                    shouldDirty: true,
                  })
                }
                disabled={Boolean(editing && categoryHasChildren(categories, editing.id))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Top-level (no parent)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Top-level (no parent)</SelectItem>
                  {parentOptions.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editing && categoryHasChildren(categories, editing.id)
                  ? "This category has subcategories, so it must stay top-level."
                  : "Optional. Nest under a top-level category (one level only)."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                rows={3}
                placeholder="Short category description"
                {...form.register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-image">Image path or URL</Label>
              <Input
                id="category-image"
                placeholder="e.g. category-dresses.webp"
                {...form.register("image")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-sort">Sort order</Label>
              <Input
                id="category-sort"
                type="number"
                min={0}
                step={1}
                {...form.register("sort_order")}
              />
              {form.formState.errors.sort_order && (
                <p className="text-xs text-destructive">{form.formState.errors.sort_order.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive categories stay listed but can be hidden from shop filters later.
                </p>
              </div>
              <Switch
                checked={form.watch("is_active")}
                onCheckedChange={(checked) =>
                  form.setValue("is_active", checked, { shouldDirty: true })
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{pendingDelete?.name}</strong>. Categories with
              subcategories or linked products cannot be deleted until those are reassigned.
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
