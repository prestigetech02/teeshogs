"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { updateOrderStatus } from "@/app/admin/orders/actions"
import {
  CUSTOMER_NOTIFY_STATUSES,
  ORDER_STATUSES,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/admin-orders"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  orderId: string
  currentStatus: string
}

export function AdminOrderStatusForm({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [savedStatus, setSavedStatus] = useState(currentStatus)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setStatus(currentStatus)
    setSavedStatus(currentStatus)
  }, [currentStatus])

  const notifiesCustomer = (CUSTOMER_NOTIFY_STATUSES as readonly string[]).includes(status)

  const onSave = () => {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSavedStatus(result.status)
      toast.success(
        notifiesCustomer
          ? `Status updated to ${orderStatusLabel(result.status)}. Customer notified.`
          : `Status updated to ${orderStatusLabel(result.status)}.`
      )
    })
  }

  return (
    <div className="space-y-3 rounded-lg border p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest">Update status</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Processing, shipped, delivered, and cancelled emails go to the customer via ZeptoMail.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="order-status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="order-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((value: OrderStatus) => (
              <SelectItem key={value} value={value}>
                {orderStatusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        onClick={onSave}
        disabled={pending || status === savedStatus}
        className="w-full"
      >
        {pending ? "Saving…" : "Save status"}
      </Button>
    </div>
  )
}
