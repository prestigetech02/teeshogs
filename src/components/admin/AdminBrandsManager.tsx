"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Link2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  brandFormSchema,
  computeBrandStats,
  slugifyBrandName,
  type Brand,
  type BrandFormValues,
} from "@/lib/brands"
import { resolveAdminImageSrc } from "@/lib/admin-products"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
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

type AdminBrandsManagerProps = {
  initialBrands: Brand[]
}

export function AdminBrandsManager({ initialBrands }: AdminBrandsManagerProps) {
  const router = useRouter()
  const [brands, setBrands] = useState(initialBrands)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [saving, setSaving] = useState(false)
  const [slugLocked, setSlugLocked] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Brand | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setBrands(initialBrands)
  }, [initialBrands])

  const stats = useMemo(() => computeBrandStats(brands), [brands])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return brands.filter((brand) => {
      const matchesQuery =
        !needle ||
        brand.name.toLowerCase().includes(needle) ||
        brand.slug.toLowerCase().includes(needle) ||
        brand.description.toLowerCase().includes(needle)
      const matchesStatus =
        status === "all" ||
        (status === "active" && brand.is_active) ||
        (status === "inactive" && !brand.is_active)
      return matchesQuery && matchesStatus
    })
  }, [brands, query, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [query, status])

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      is_active: true,
    },
  })

  const nameValue = form.watch("name")

  useEffect(() => {
    if (slugLocked || editing) return
    form.setValue("slug", slugifyBrandName(nameValue || ""), { shouldValidate: true })
  }, [editing, form, nameValue, slugLocked])

  const openCreate = () => {
    setEditing(null)
    setSlugLocked(false)
    form.reset({
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      is_active: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (brand: Brand) => {
    setEditing(brand)
    setSlugLocked(true)
    form.reset({
      name: brand.name,
      slug: brand.slug,
      description: brand.description ?? "",
      logo: brand.logo ?? "",
      website: brand.website ?? "",
      is_active: brand.is_active,
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const slug = values.slug.trim()

      let slugQuery = supabase.from("brands").select("id").eq("slug", slug)
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
        description: values.description?.trim() || "",
        logo: values.logo?.trim() || null,
        website: values.website?.trim() || null,
        is_active: values.is_active,
      }

      if (editing) {
        const { data, error } = await supabase
          .from("brands")
          .update(payload)
          .eq("id", editing.id)
          .select("*")
          .single()
        if (error) throw error
        setBrands((current) =>
          current.map((brand) =>
            brand.id === editing.id
              ? { ...brand, ...(data as Brand), product_count: brand.product_count }
              : brand
          )
        )
        toast.success("Brand updated")
      } else {
        const { data, error } = await supabase.from("brands").insert(payload).select("*").single()
        if (error) throw error
        setBrands((current) => [{ ...(data as Brand), product_count: 0 }, ...current])
        toast.success("Brand created")
      }

      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save brand")
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from("brands").delete().eq("id", pendingDelete.id)
    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }
    setBrands((current) => current.filter((brand) => brand.id !== pendingDelete.id))
    toast.success(`${pendingDelete.name} deleted`)
    setPendingDelete(null)
    setDeleting(false)
    router.refresh()
  }

  const statCards = [
    {
      title: "Total brands",
      value: stats.total,
      description: "In the catalog",
      icon: Building2,
    },
    {
      title: "Active",
      value: stats.active,
      description: "Visible for assignment",
      icon: BadgeCheck,
    },
    {
      title: "Inactive",
      value: stats.inactive,
      description: "Hidden from assignment",
      icon: Building2,
    },
    {
      title: "Products linked",
      value: stats.productsLinked,
      description: "Assigned to a brand",
      icon: Package,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Brands</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage brands for Teeshogs products.
          </p>
        </div>
        <Button type="button" className="shrink-0 self-start sm:self-auto" onClick={openCreate}>
          <Plus className="size-4" />
          Add brand
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
            placeholder="Search brands..."
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
              <TableHead>Brand</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No brands match these filters.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-semibold uppercase">
                        {brand.logo ? (
                          <img
                            src={resolveAdminImageSrc(brand.logo)}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none"
                            }}
                          />
                        ) : (
                          brand.name.slice(0, 2)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{brand.name}</p>
                        {brand.description ? (
                          <p className="truncate text-xs text-muted-foreground">{brand.description}</p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{brand.slug}</TableCell>
                  <TableCell>
                    <Badge variant={brand.is_active ? "outline" : "secondary"}>
                      {brand.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{brand.product_count ?? 0}</TableCell>
                  <TableCell>
                    {brand.website ? (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Link2 className="size-3.5" />
                        Link
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${brand.name}`}
                        onClick={() => openEdit(brand)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${brand.name}`}
                        onClick={() => setPendingDelete(brand)}
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
            <DialogTitle>{editing ? "Edit brand" : "Add brand"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update brand details for the catalog."
                : "Create a brand you can assign to products."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input id="brand-name" {...form.register("name")} placeholder="e.g. Teeshogs" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="brand-slug">Slug</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setSlugLocked((current) => !current)}
                >
                  {slugLocked ? "Unlock auto-slug" : "Lock slug"}
                </button>
              </div>
              <Input id="brand-slug" {...form.register("slug")} />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-description">Description</Label>
              <Textarea
                id="brand-description"
                rows={3}
                placeholder="Short brand story"
                {...form.register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo path or URL</Label>
              <Input
                id="brand-logo"
                placeholder="Optional image path or https://..."
                {...form.register("logo")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-website">Website</Label>
              <Input
                id="brand-website"
                placeholder="https://example.com"
                {...form.register("website")}
              />
              {form.formState.errors.website && (
                <p className="text-xs text-destructive">{form.formState.errors.website.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive brands stay in the list but are flagged.</p>
              </div>
              <Switch
                checked={form.watch("is_active")}
                onCheckedChange={(checked) => form.setValue("is_active", checked, { shouldDirty: true })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Create brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{pendingDelete?.name}</strong>. Products linked to it
              will keep their other details but lose this brand assignment.
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
