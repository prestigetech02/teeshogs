"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CreditCard, Eye, Search } from "lucide-react"
import {
  computePaymentStats,
  paymentStatusLabel,
  paymentStatusVariant,
  type PaymentRow,
} from "@/lib/payments"
import { formatNGN } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { isPaidOrderStatus } from "@/lib/customers"

type Props = {
  payments: PaymentRow[]
}

export function AdminPaymentsTable({ payments }: Props) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const stats = useMemo(() => computePaymentStats(payments), [payments])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return payments.filter((payment) => {
      const matchesStatus =
        status === "all" ||
        (status === "successful" && isPaidOrderStatus(payment.status)) ||
        (status === "pending" && payment.status === "pending_payment") ||
        (status === "failed" &&
          (payment.status === "failed" || payment.status === "cancelled"))
      const matchesQuery =
        !needle ||
        payment.order_number.toLowerCase().includes(needle) ||
        payment.email.toLowerCase().includes(needle) ||
        payment.customer_name.toLowerCase().includes(needle) ||
        (payment.paystack_reference || "").toLowerCase().includes(needle) ||
        (payment.payment_channel || "").toLowerCase().includes(needle)
      return matchesStatus && matchesQuery
    })
  }, [payments, query, status])

  const cards = [
    {
      title: "Successful volume",
      value: formatNGN(stats.volumeNgn),
      detail: `${stats.successful} paid transactions`,
    },
    {
      title: "Today",
      value: formatNGN(stats.todayVolumeNgn),
      detail: "Paid since midnight",
    },
    {
      title: "Pending",
      value: String(stats.pending),
      detail: "Awaiting Paystack confirmation",
    },
    {
      title: "Failed / cancelled",
      value: String(stats.failed),
      detail: `Fees recorded: ${formatNGN(stats.feesNgn)}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <CreditCard className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
              <CardDescription className="mt-1">{card.detail}</CardDescription>
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
            placeholder="Search order, email, reference..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="successful">Successful</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed / cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No payments match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <p className="font-medium">{payment.order_number}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {payment.paystack_reference || "No reference"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.paid_at || payment.created_at).toLocaleString("en-NG")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="truncate font-medium">{payment.customer_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{payment.email}</p>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatNGN(Number(payment.paystack_paid_amount ?? payment.total))}
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {payment.payment_channel || payment.payment_method || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusVariant(payment.status)}>
                      {paymentStatusLabel(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        href={`/admin/payments/${payment.id}`}
                        aria-label={`View payment ${payment.order_number}`}
                      >
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
    </div>
  )
}
