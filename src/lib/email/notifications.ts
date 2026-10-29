import { absoluteUrl } from "@/lib/seo"
import { formatNGN } from "@/lib/money"
import type { OrderRow } from "@/lib/orders"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { emailLayout, escapeHtml, formatNairaEmail } from "@/lib/email/layout"
import { getAdminNotifyEmail, sendEmailSafe } from "@/lib/email/zeptomail"
import { orderStatusLabel } from "@/lib/admin-orders"

export type OrderEmailItem = {
  name: string
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
  line_total: number
}

export async function getOrderItems(orderId: string) {
  const admin = createSupabaseAdminClient()
  const { data } = await admin
    .from("order_items")
    .select("name, size, color, quantity, unit_price, line_total")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
  return (data || []) as OrderEmailItem[]
}

function itemMeta(item: OrderEmailItem) {
  return [item.size, item.color].filter(Boolean).join(" · ")
}

function orderItemsHtml(items: OrderEmailItem[]) {
  if (!items.length) return "<p style=\"margin:0;color:#71717a;\">No line items.</p>"
  const rows = items
    .map((item) => {
      const meta = itemMeta(item)
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
          <strong style="color:#18181b;">${escapeHtml(item.name)}</strong>
          <div style="font-size:12px;color:#71717a;">
            ${escapeHtml(meta || "Standard")} · Qty ${item.quantity}
            · ${escapeHtml(formatNairaEmail(item.unit_price))} each
          </div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;white-space:nowrap;vertical-align:top;">
          ${escapeHtml(formatNairaEmail(item.line_total))}
        </td>
      </tr>`
    })
    .join("")
  return `
    <h2 style="margin:24px 0 8px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#18181b;">Items</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
  `
}

function orderItemsText(items: OrderEmailItem[]) {
  if (!items.length) return "No line items."
  return items
    .map((item) => {
      const meta = itemMeta(item)
      return `- ${item.name}${meta ? ` (${meta})` : ""} × ${item.quantity} — ${formatNGN(item.line_total)}`
    })
    .join("\n")
}

function addressHtml(order: OrderRow) {
  return `
    <p style="margin:0;">${escapeHtml(order.customer_name)}</p>
    <p style="margin:4px 0 0;">${escapeHtml(order.address_line1)}</p>
    ${order.address_line2 ? `<p style="margin:4px 0 0;">${escapeHtml(order.address_line2)}</p>` : ""}
    <p style="margin:4px 0 0;">${escapeHtml(order.city)}, ${escapeHtml(order.state)}${order.postal_code ? ` ${escapeHtml(order.postal_code)}` : ""}</p>
    <p style="margin:4px 0 0;">${escapeHtml(order.phone)}</p>
  `
}

export async function sendWelcomeEmail(input: { email: string; name: string }) {
  const firstName = input.name.trim().split(/\s+/)[0] || "there"
  const html = emailLayout({
    title: "Welcome to Teeshogs",
    preview: "Your account is ready.",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;">Thanks for joining Teeshogs. Your account is ready — explore new drops, save favourites, and checkout faster next time.</p>
      <p style="margin:24px 0;">
        <a href="${absoluteUrl("/shop")}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:600;">
          Start shopping
        </a>
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;">If you didn’t create this account, you can ignore this email.</p>
    `,
  })

  return sendEmailSafe(
    {
      to: { address: input.email, name: input.name },
      subject: "Welcome to Teeshogs",
      html,
      text: `Hi ${firstName}, welcome to Teeshogs. Shop now: ${absoluteUrl("/shop")}`,
      clientReference: `welcome-${input.email}`,
    },
    "welcome"
  )
}

export async function sendOrderConfirmationEmail(order: OrderRow) {
  const items = await getOrderItems(order.id)
  const html = emailLayout({
    title: "Order confirmed",
    preview: `Order ${order.order_number} is confirmed.`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(order.customer_name.split(/\s+/)[0] || "there")},</p>
      <p style="margin:0 0 16px;">We’ve received your payment for <strong>${escapeHtml(order.order_number)}</strong>. We’re getting your order ready.</p>
      ${orderItemsHtml(items)}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
        <tr><td style="padding:4px 0;color:#71717a;">Subtotal</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatNairaEmail(order.subtotal))}</td></tr>
        ${
          Number(order.discount_amount) > 0
            ? `<tr><td style="padding:4px 0;color:#71717a;">Discount${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ""}</td><td style="padding:4px 0;text-align:right;">−${escapeHtml(formatNairaEmail(order.discount_amount))}</td></tr>`
            : ""
        }
        <tr><td style="padding:4px 0;color:#71717a;">Shipping</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatNairaEmail(order.shipping_fee))}</td></tr>
        <tr><td style="padding:10px 0 0;font-weight:700;color:#18181b;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;">${escapeHtml(formatNairaEmail(order.total))}</td></tr>
      </table>
      <h2 style="margin:28px 0 8px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#18181b;">Delivery</h2>
      ${
        order.shipping_method === "manual" && order.shipping_zone_name
          ? `<p style="margin:0 0 8px;font-size:13px;color:#71717a;">Zone: <strong style="color:#18181b;">${escapeHtml(order.shipping_zone_name)}</strong></p>`
          : `<p style="margin:0 0 8px;font-size:13px;color:#71717a;">Method: <strong style="color:#18181b;">Fez</strong></p>`
      }
      ${addressHtml(order)}
      ${order.fez_order_no ? `<p style="margin:12px 0 0;font-size:13px;color:#71717a;">Tracking: <strong style="color:#18181b;">${escapeHtml(order.fez_order_no)}</strong></p>` : ""}
    `,
  })

  return sendEmailSafe(
    {
      to: { address: order.email, name: order.customer_name },
      subject: `Order confirmed · ${order.order_number}`,
      html,
      text: [
        `Your Teeshogs order ${order.order_number} is confirmed.`,
        "",
        "Items:",
        orderItemsText(items),
        "",
        `Subtotal: ${formatNGN(order.subtotal)}`,
        `Shipping: ${formatNGN(order.shipping_fee)}`,
        `Total: ${formatNGN(order.total)}`,
      ].join("\n"),
      clientReference: `order-paid-${order.id}`,
    },
    "order-confirmation"
  )
}

export async function sendOrderStatusEmail(order: OrderRow) {
  const status = orderStatusLabel(order.status)
  const items = await getOrderItems(order.id)
  const html = emailLayout({
    title: `Order update: ${status}`,
    preview: `${order.order_number} is now ${status}.`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(order.customer_name.split(/\s+/)[0] || "there")},</p>
      <p style="margin:0 0 16px;">An update on your order <strong>${escapeHtml(order.order_number)}</strong>:</p>
      <p style="margin:0 0 16px;padding:12px 14px;background:#f4f4f5;border:1px solid #e4e4e7;">
        Status: <strong style="text-transform:capitalize;">${escapeHtml(status)}</strong>
      </p>
      ${orderItemsHtml(items)}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
        <tr><td style="padding:4px 0;color:#71717a;">Subtotal</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatNairaEmail(order.subtotal))}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Shipping</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatNairaEmail(order.shipping_fee))}</td></tr>
        <tr><td style="padding:10px 0 0;font-weight:700;color:#18181b;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;">${escapeHtml(formatNairaEmail(order.total))}</td></tr>
      </table>
      ${order.fez_order_no ? `<p style="margin:16px 0 0;">Fez tracking: <strong>${escapeHtml(order.fez_order_no)}</strong></p>` : ""}
      <p style="margin:16px 0 0;color:#71717a;font-size:13px;">Questions? Reply to this email or contact us at hello@teeshogs.com.</p>
    `,
  })

  return sendEmailSafe(
    {
      to: { address: order.email, name: order.customer_name },
      subject: `Order ${order.order_number} · ${status}`,
      html,
      text: [
        `Your order ${order.order_number} is now ${status}.`,
        "",
        "Items:",
        orderItemsText(items),
        "",
        `Total: ${formatNGN(order.total)}`,
      ].join("\n"),
      clientReference: `order-status-${order.id}-${order.status}`,
    },
    "order-status"
  )
}

export async function sendAdminNewOrderEmail(order: OrderRow) {
  const adminEmail = getAdminNotifyEmail()
  if (!adminEmail) return { skipped: true as const }

  const items = await getOrderItems(order.id)
  const html = emailLayout({
    title: "New paid order",
    preview: `${order.order_number} · ${formatNairaEmail(order.total)}`,
    bodyHtml: `
      <p style="margin:0 0 16px;">A new order has been paid.</p>
      <p style="margin:0 0 8px;"><strong>${escapeHtml(order.order_number)}</strong> · ${escapeHtml(formatNairaEmail(order.total))}</p>
      <p style="margin:0 0 16px;">${escapeHtml(order.customer_name)} · ${escapeHtml(order.email)} · ${escapeHtml(order.phone)}</p>
      ${orderItemsHtml(items)}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
        <tr><td style="padding:4px 0;color:#71717a;">Subtotal</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatNairaEmail(order.subtotal))}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Shipping</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatNairaEmail(order.shipping_fee))}</td></tr>
        <tr><td style="padding:10px 0 0;font-weight:700;color:#18181b;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;">${escapeHtml(formatNairaEmail(order.total))}</td></tr>
      </table>
      ${
        order.shipping_method === "manual" && order.shipping_zone_name
          ? `<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Zone: <strong style="color:#18181b;">${escapeHtml(order.shipping_zone_name)}</strong></p>`
          : ""
      }
      <p style="margin:24px 0 0;">
        <a href="${absoluteUrl(`/admin/orders/${order.id}`)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:600;">
          View in admin
        </a>
      </p>
    `,
  })

  return sendEmailSafe(
    {
      to: { address: adminEmail, name: "Teeshogs Admin" },
      subject: `New order ${order.order_number}`,
      html,
      text: [
        `New paid order ${order.order_number}`,
        `${order.customer_name} · ${order.email} · ${order.phone}`,
        "",
        "Items:",
        orderItemsText(items),
        "",
        `Total: ${formatNGN(order.total)}`,
        absoluteUrl(`/admin/orders/${order.id}`),
      ].join("\n"),
      clientReference: `admin-order-${order.id}`,
    },
    "admin-new-order"
  )
}

export async function sendContactEmails(input: {
  name: string
  email: string
  subject: string
  orderNumber?: string | null
  message: string
}) {
  const adminEmail = getAdminNotifyEmail()
  const customerHtml = emailLayout({
    title: "We received your message",
    preview: "Thanks for contacting Teeshogs.",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(input.name.split(/\s+/)[0] || "there")},</p>
      <p style="margin:0 0 16px;">Thanks for reaching out. We’ve received your message and will get back to you soon.</p>
      <p style="margin:0;padding:12px 14px;background:#f4f4f5;border:1px solid #e4e4e7;white-space:pre-wrap;">${escapeHtml(input.message)}</p>
    `,
  })

  await sendEmailSafe(
    {
      to: { address: input.email, name: input.name },
      subject: "We received your message · Teeshogs",
      html: customerHtml,
      clientReference: `contact-ack-${input.email}`,
    },
    "contact-ack"
  )

  if (adminEmail) {
    const adminHtml = emailLayout({
      title: "New contact message",
      preview: input.subject,
      bodyHtml: `
        <p style="margin:0 0 8px;"><strong>${escapeHtml(input.name)}</strong> · ${escapeHtml(input.email)}</p>
        <p style="margin:0 0 8px;">Subject: ${escapeHtml(input.subject)}</p>
        ${input.orderNumber ? `<p style="margin:0 0 8px;">Order: ${escapeHtml(input.orderNumber)}</p>` : ""}
        <p style="margin:16px 0 0;padding:12px 14px;background:#f4f4f5;border:1px solid #e4e4e7;white-space:pre-wrap;">${escapeHtml(input.message)}</p>
        <p style="margin:24px 0 0;">
          <a href="${absoluteUrl("/admin/contacts")}" style="color:#18181b;">Open contacts</a>
        </p>
      `,
    })

    await sendEmailSafe(
      {
        to: { address: adminEmail, name: "Teeshogs Admin" },
        subject: `Contact: ${input.subject}`,
        html: adminHtml,
        replyTo: { address: input.email, name: input.name },
        clientReference: `contact-admin-${input.email}`,
      },
      "contact-admin"
    )
  }
}
