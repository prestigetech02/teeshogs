"use client"

import Link from "next/link"
import { Eye } from "lucide-react"
import type { AdminOrder } from "@/lib/admin-orders"
import { orderStatusLabel } from "@/lib/admin-orders"
import { formatNGN } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid" || status === "processing" || status === "shipped" || status === "delivered") {
    return "default"
  }
  if (status === "failed" || status === "cancelled") return "destructive"
  return "outline"
}

export function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fez</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No orders yet.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("en-NG")}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="truncate font-medium">{order.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{order.email}</p>
                </TableCell>
                <TableCell>{formatNGN(Number(order.total))}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(order.status)} className="capitalize">
                    {orderStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {order.fez_order_no || order.fez_status || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/admin/orders/${order.id}`} aria-label={`View ${order.order_number}`}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
