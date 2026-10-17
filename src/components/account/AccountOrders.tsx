"use client"

import { orderStatusLabel } from "@/lib/admin-orders"
import type { CustomerOrderRow } from "@/lib/customers"
import { formatNGN } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function AccountOrders({ orders }: { orders: CustomerOrderRow[] }) {
  return (
    <section className="rounded-none border border-border">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest">Orders</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Recent orders linked to your account or email.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                You have no orders yet.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="font-medium">{order.order_number || order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("en-NG")}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {orderStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNGN(Number(order.total))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  )
}
