"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { updateCustomerProfile } from "@/app/admin/customers/actions"
import { isPaidOrderStatus, type CustomerOrderRow, type CustomerProfile } from "@/lib/customers"
import { orderStatusLabel } from "@/lib/admin-orders"
import { formatNGN } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Props = {
  profile: CustomerProfile | null
  email: string
  orders: CustomerOrderRow[]
  isSelf?: boolean
}

export function AdminCustomerDetail({ profile, email, orders, isSelf }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [notes, setNotes] = useState(profile?.notes ?? "")
  const [role, setRole] = useState<"customer" | "admin">(profile?.role ?? "customer")
  const [pending, startTransition] = useTransition()

  const totalSpent = orders
    .filter((order) => isPaidOrderStatus(order.status))
    .reduce((sum, order) => sum + Number(order.total || 0), 0)

  const onSave = () => {
    if (!profile) return
    startTransition(async () => {
      const result = await updateCustomerProfile({
        customerId: profile.id,
        full_name: fullName,
        phone,
        notes,
        role,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Customer updated")
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest">Profile</h2>
            <Badge variant="outline">
              {profile ? (role === "admin" ? "Admin" : "Customer") : "Guest"}
            </Badge>
          </div>

          {profile ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Full name</Label>
                <Input
                  id="customer-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input id="customer-email" value={email} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as "customer" | "admin")}
                  disabled={isSelf}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf ? (
                  <p className="text-xs text-muted-foreground">
                    You cannot change your own role here.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-notes">Admin notes</Label>
                <Textarea
                  id="customer-notes"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Internal notes about this customer"
                />
              </div>
              <Button type="button" onClick={onSave} disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span> {email}
              </p>
              <p className="text-muted-foreground">
                This shopper checked out as a guest and has no account yet. Profile editing
                becomes available after they sign up with the same email.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Orders</dt>
              <dd className="font-medium tabular-nums">{orders.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Total spent</dt>
              <dd className="font-medium tabular-nums">{formatNGN(totalSpent)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Member since</dt>
              <dd>
                {profile
                  ? new Date(profile.created_at).toLocaleDateString("en-NG")
                  : "Guest checkout"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Orders</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No orders for this customer yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <p className="font-medium">
                      {order.order_number || order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("en-NG")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatNGN(Number(order.total))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${order.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
