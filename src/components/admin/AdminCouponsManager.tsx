"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Percent,
  Pencil,
  Plus,
  Search,
  Ticket,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  computeCouponStats,
  couponFormSchema,
  couponTypeLabel,
  couponValueLabel,
  formDateToIso,
  isCouponExpired,
  isoToDatetimeLocal,
  normalizeCouponCode,
  type Coupon,
  type CouponFormValues,
} from "@/lib/coupons"
import { formatNGN } from "@/lib/money"
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

type AdminCouponsManagerProps = {
  initialCoupons: Coupon[]
}

function emptyForm(): CouponFormValues {
  return {
    code: "",
    description: "",
    discount_type: "percent",
    discount_value: 10,
    min_subtotal: 0,
    max_discount: null,
    usage_limit: null,
    starts_at: "",
    ends_at: "",
    is_active: true,
  }
}

export function AdminCouponsManager({ initialCoupons }: AdminCouponsManagerProps) {
  const router = useRouter()
  const [coupons, setCoupons] = useState(initialCoupons)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setCoupons(initialCoupons)
  }, [initialCoupons])

  const stats = useMemo(() => computeCouponStats(coupons), [coupons])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const now = new Date()
    return coupons.filter((coupon) => {
      const matchesQuery =
        !needle ||
        coupon.code.toLowerCase().includes(needle) ||
        coupon.description.toLowerCase().includes(needle)
      const expired = isCouponExpired(coupon, now)
      const matchesStatus =
        status === "all" ||
        (status === "active" && coupon.is_active && !expired) ||
        (status === "inactive" && !coupon.is_active) ||
        (status === "expired" && expired)
      return matchesQuery && matchesStatus
    })
  }, [coupons, query, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [query, status])

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: emptyForm(),
  })

  const discountType = form.watch("discount_type")

  const openCreate = () => {
    setEditing(null)
    form.reset(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon)
    form.reset({
      code: coupon.code,
      description: coupon.description ?? "",
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      min_subtotal: Number(coupon.min_subtotal || 0),
      max_discount: coupon.max_discount == null ? null : Number(coupon.max_discount),
      usage_limit: coupon.usage_limit == null ? null : Number(coupon.usage_limit),
      starts_at: isoToDatetimeLocal(coupon.starts_at),
      ends_at: isoToDatetimeLocal(coupon.ends_at),
      is_active: coupon.is_active,
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const code = normalizeCouponCode(values.code)

      let codeQuery = supabase.from("coupons").select("id").eq("code", code)
      if (editing) codeQuery = codeQuery.neq("id", editing.id)
      const { data: existing, error: codeError } = await codeQuery.maybeSingle()
      if (codeError) throw codeError
      if (existing) {
        form.setError("code", { message: "This code is already in use" })
        throw new Error("Code already exists")
      }

      const payload = {
        code,
        description: values.description?.trim() || "",
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        min_subtotal: values.min_subtotal || 0,
        max_discount:
          values.discount_type === "percent" && values.max_discount
            ? values.max_discount
            : null,
        usage_limit: values.usage_limit || null,
        starts_at: formDateToIso(values.starts_at),
        ends_at: formDateToIso(values.ends_at),
        is_active: values.is_active,
      }

      if (editing) {
        const { data, error } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", editing.id)
          .select("*")
          .single()
        if (error) throw error
        setCoupons((current) =>
          current
            .map((coupon) => (coupon.id === editing.id ? (data as Coupon) : coupon))
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        )
        toast.success("Coupon updated")
      } else {
        const { data, error } = await supabase
          .from("coupons")
          .insert(payload)
          .select("*")
          .single()
        if (error) throw error
        setCoupons((current) => [data as Coupon, ...current])
        toast.success("Coupon created")
      }

      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save coupon")
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!pendingDelete) return
    if (pendingDelete.used_count > 0) {
      toast.error("This coupon has redemptions. Deactivate it instead of deleting.")
      setPendingDelete(null)
      return
    }

    setDeleting(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from("coupons").delete().eq("id", pendingDelete.id)
    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }
    setCoupons((current) => current.filter((coupon) => coupon.id !== pendingDelete.id))
    toast.success(`${pendingDelete.code} deleted`)
    setPendingDelete(null)
    setDeleting(false)
    router.refresh()
  }

  const statCards = [
    {
      title: "Total coupons",
      value: stats.total,
      description: "In the catalog",
      icon: Ticket,
    },
    {
      title: "Active",
      value: stats.active,
      description: "Usable at checkout",
      icon: BadgeCheck,
    },
    {
      title: "Expired",
      value: stats.expired,
      description: "Past end date",
      icon: Percent,
    },
    {
      title: "Redemptions",
      value: stats.redemptions,
      description: "Successful uses",
      icon: Ticket,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Marketing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Coupons</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create percent or fixed discounts customers can apply at checkout.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Add coupon
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
              <CardDescription className="mt-1">{card.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search codes..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Min order</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No coupons match these filters.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((coupon) => {
                const expired = isCouponExpired(coupon)
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold tracking-wide">
                          {coupon.code}
                        </p>
                        {coupon.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {coupon.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{couponTypeLabel(coupon.discount_type)}</TableCell>
                    <TableCell className="font-medium">{couponValueLabel(coupon)}</TableCell>
                    <TableCell className="tabular-nums">
                      {Number(coupon.min_subtotal) > 0
                        ? formatNGN(Number(coupon.min_subtotal))
                        : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {coupon.used_count}
                      {coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          !coupon.is_active || expired ? "secondary" : "outline"
                        }
                      >
                        {!coupon.is_active ? "Inactive" : expired ? "Expired" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${coupon.code}`}
                          onClick={() => openEdit(coupon)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${coupon.code}`}
                          onClick={() => setPendingDelete(coupon)}
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
            <DialogTitle>{editing ? "Edit coupon" : "Add coupon"}</DialogTitle>
            <DialogDescription>
              Discounts apply to the cart subtotal. Shipping is calculated separately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                className="font-mono uppercase"
                placeholder="e.g. WELCOME10"
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-description">Description (optional)</Label>
              <Textarea
                id="coupon-description"
                rows={2}
                placeholder="Internal note or campaign label"
                {...form.register("description")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) =>
                    form.setValue("discount_type", value as "percent" | "fixed", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="fixed">Fixed amount (NGN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {discountType === "percent" ? "Percent off" : "Amount off (NGN)"}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min={0}
                  step={discountType === "percent" ? 1 : 0.01}
                  {...form.register("discount_value")}
                />
                {form.formState.errors.discount_value && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.discount_value.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-min">Minimum subtotal (NGN)</Label>
                <Input
                  id="coupon-min"
                  type="number"
                  min={0}
                  step={0.01}
                  {...form.register("min_subtotal")}
                />
              </div>
              {discountType === "percent" ? (
                <div className="space-y-2">
                  <Label htmlFor="coupon-max">Max discount (NGN, optional)</Label>
                  <Input
                    id="coupon-max"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="No cap"
                    {...form.register("max_discount")}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="coupon-usage">Usage limit (optional)</Label>
                  <Input
                    id="coupon-usage"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Unlimited"
                    {...form.register("usage_limit")}
                  />
                </div>
              )}
            </div>

            {discountType === "percent" ? (
              <div className="space-y-2">
                <Label htmlFor="coupon-usage-percent">Usage limit (optional)</Label>
                <Input
                  id="coupon-usage-percent"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Unlimited"
                  {...form.register("usage_limit")}
                />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-starts">Starts at (optional)</Label>
                <Input
                  id="coupon-starts"
                  type="datetime-local"
                  {...form.register("starts_at")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-ends">Ends at (optional)</Label>
                <Input id="coupon-ends" type="datetime-local" {...form.register("ends_at")} />
                {form.formState.errors.ends_at && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.ends_at.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive coupons cannot be applied at checkout.
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
                {saving ? "Saving..." : editing ? "Save changes" : "Create coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{pendingDelete?.code}</strong>. Coupons that have
              already been redeemed should be deactivated instead.
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
