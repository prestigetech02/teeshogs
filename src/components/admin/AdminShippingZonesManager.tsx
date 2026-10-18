"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BadgeCheck,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
import {
  computeShippingZoneStats,
  shippingZoneFormSchema,
  type ShippingZone,
  type ShippingZoneFormInput,
  type ShippingZoneFormValues,
} from "@/lib/shipping-zones"
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

type AdminShippingZonesManagerProps = {
  initialZones: ShippingZone[]
}

function emptyForm(): ShippingZoneFormValues {
  return {
    name: "",
    fee: 0,
    sort_order: 0,
    is_active: true,
  }
}

export function AdminShippingZonesManager({ initialZones }: AdminShippingZonesManagerProps) {
  const router = useRouter()
  const [zones, setZones] = useState(initialZones)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ShippingZone | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ShippingZone | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setZones(initialZones)
  }, [initialZones])

  const stats = useMemo(() => computeShippingZoneStats(zones), [zones])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return zones
      .filter((zone) => {
        const matchesQuery = !needle || zone.name.toLowerCase().includes(needle)
        const matchesStatus =
          status === "all" ||
          (status === "active" && zone.is_active) ||
          (status === "inactive" && !zone.is_active)
        return matchesQuery && matchesStatus
      })
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order || a.name.localeCompare(b.name)
      )
  }, [zones, query, status])

  const form = useForm<ShippingZoneFormInput, unknown, ShippingZoneFormValues>({
    resolver: zodResolver(shippingZoneFormSchema),
    defaultValues: emptyForm(),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (zone: ShippingZone) => {
    setEditing(zone)
    form.reset({
      name: zone.name,
      fee: Number(zone.fee),
      sort_order: Number(zone.sort_order) || 0,
      is_active: zone.is_active,
    })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const payload = {
        name: values.name.trim(),
        fee: values.fee,
        sort_order: values.sort_order || 0,
        is_active: values.is_active,
      }

      if (editing) {
        const { data, error } = await supabase
          .from("shipping_zones")
          .update(payload)
          .eq("id", editing.id)
          .select("*")
          .single()
        if (error) throw error
        setZones((current) =>
          current.map((zone) => (zone.id === editing.id ? (data as ShippingZone) : zone))
        )
        toast.success("Shipping zone updated")
      } else {
        const { data, error } = await supabase
          .from("shipping_zones")
          .insert(payload)
          .select("*")
          .single()
        if (error) throw error
        setZones((current) => [...current, data as ShippingZone])
        toast.success("Shipping zone created")
      }

      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save zone")
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase
      .from("shipping_zones")
      .delete()
      .eq("id", pendingDelete.id)
    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }
    setZones((current) => current.filter((zone) => zone.id !== pendingDelete.id))
    toast.success("Zone deleted")
    setPendingDelete(null)
    setDeleting(false)
    router.refresh()
  }

  const statCards = [
    {
      title: "Total zones",
      value: stats.total,
      description: "Location groups",
      icon: MapPinned,
    },
    {
      title: "Active",
      value: stats.active,
      description: "Shown at checkout",
      icon: BadgeCheck,
    },
    {
      title: "Inactive",
      value: stats.inactive,
      description: "Hidden from customers",
      icon: Truck,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Commerce</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Shipping</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create flat-rate location groups for manual delivery (e.g. Ikeja / Ogba / Ojota).
            Customers can pick a zone or Fez nationwide at checkout.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Add zone
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
            placeholder="Search zones..."
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
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Locations / group</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No shipping zones yet. Add a group like “Ikeja / Ogba / Ojota”.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNGN(Number(zone.fee))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={zone.is_active ? "default" : "secondary"}>
                      {zone.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{zone.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(zone)}
                        aria-label={`Edit ${zone.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(zone)}
                        aria-label={`Delete ${zone.name}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit shipping zone" : "Add shipping zone"}</DialogTitle>
            <DialogDescription>
              Group nearby areas under one flat delivery fee. Example: Ikeja / Ogba / Ojota.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="zone-name">Locations / group name</Label>
              <Input
                id="zone-name"
                placeholder="Ikeja / Ogba / Ojota"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zone-fee">Delivery fee (₦)</Label>
                <Input
                  id="zone-fee"
                  type="number"
                  min={0}
                  step="100"
                  {...form.register("fee")}
                />
                {form.formState.errors.fee && (
                  <p className="text-sm text-destructive">{form.formState.errors.fee.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-sort">Sort order</Label>
                <Input
                  id="zone-sort"
                  type="number"
                  min={0}
                  step="1"
                  {...form.register("sort_order")}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Active at checkout</p>
                <p className="text-xs text-muted-foreground">Inactive zones are hidden from customers</p>
              </div>
              <Switch
                checked={form.watch("is_active")}
                onCheckedChange={(checked) => form.setValue("is_active", checked)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create zone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shipping zone?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `“${pendingDelete.name}” will be removed from checkout. Past orders keep the zone name snapshot.`
                : null}
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
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
