"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Eye, Search, Users } from "lucide-react"
import {
  computeCustomerStats,
  customerHref,
  type CustomerListItem,
} from "@/lib/customers"
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

type Props = {
  customers: CustomerListItem[]
}

export function AdminCustomersTable({ customers }: Props) {
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("all")
  const stats = useMemo(() => computeCustomerStats(customers), [customers])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return customers.filter((customer) => {
      const matchesKind =
        kind === "all" ||
        (kind === "registered" && customer.kind === "registered") ||
        (kind === "guest" && customer.kind === "guest") ||
        (kind === "admin" && customer.role === "admin")
      const matchesQuery =
        !needle ||
        customer.full_name.toLowerCase().includes(needle) ||
        customer.email.toLowerCase().includes(needle) ||
        (customer.phone || "").toLowerCase().includes(needle)
      return matchesKind && matchesQuery
    })
  }, [customers, kind, query])

  const cards = [
    { title: "All customers", value: stats.total, detail: "Registered + guests" },
    { title: "Registered", value: stats.registered, detail: "Accounts with profiles" },
    { title: "Guests", value: stats.guests, detail: "Checkout without signup" },
    { title: "With orders", value: stats.withOrders, detail: "At least one order" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Users className="size-4 text-muted-foreground" />
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
            placeholder="Search name, email, phone..."
            className="pl-9"
          />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="guest">Guests</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Last order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No customers match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.key}>
                  <TableCell>
                    <p className="font-medium">{customer.full_name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                    {customer.phone ? (
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.kind === "guest" ? "secondary" : "outline"}>
                      {customer.role === "admin"
                        ? "Admin"
                        : customer.kind === "guest"
                          ? "Guest"
                          : "Customer"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{customer.order_count}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatNGN(customer.total_spent)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.last_order_at
                      ? new Date(customer.last_order_at).toLocaleDateString("en-NG")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        href={customerHref(customer)}
                        aria-label={`View ${customer.full_name}`}
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
