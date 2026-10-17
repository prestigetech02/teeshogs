"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Eye, Inbox, Search } from "lucide-react"
import {
  computeContactStats,
  contactStatusLabel,
  contactStatusVariant,
  contactSubjectLabel,
  type ContactMessage,
} from "@/lib/contacts"
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
  messages: ContactMessage[]
}

export function AdminContactsTable({ messages }: Props) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const stats = useMemo(() => computeContactStats(messages), [messages])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return messages.filter((message) => {
      const matchesStatus = status === "all" || message.status === status
      const matchesQuery =
        !needle ||
        message.name.toLowerCase().includes(needle) ||
        message.email.toLowerCase().includes(needle) ||
        message.subject.toLowerCase().includes(needle) ||
        message.message.toLowerCase().includes(needle) ||
        (message.order_number || "").toLowerCase().includes(needle) ||
        contactSubjectLabel(message.subject).toLowerCase().includes(needle)
      return matchesStatus && matchesQuery
    })
  }, [messages, query, status])

  const cards = [
    { title: "All messages", value: stats.total, detail: "Contact form submissions" },
    { title: "New", value: stats.newCount, detail: "Unread enquiries" },
    { title: "Replied", value: stats.replied, detail: "Marked as replied" },
    { title: "Archived", value: stats.archived, detail: "Closed threads" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Inbox className="size-4 text-muted-foreground" />
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
            placeholder="Search name, email, subject, message..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No contact messages match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <p className="font-medium">{message.name}</p>
                    <p className="text-xs text-muted-foreground">{message.email}</p>
                    {message.order_number ? (
                      <p className="text-xs text-muted-foreground">
                        Order {message.order_number}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{contactSubjectLabel(message.subject)}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {message.message}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contactStatusVariant(message.status)}>
                      {contactStatusLabel(message.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(message.created_at).toLocaleString("en-NG")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        href={`/admin/contacts/${message.id}`}
                        aria-label={`Open message from ${message.name}`}
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
