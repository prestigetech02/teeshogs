"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Instrument_Serif, Manrope } from "next/font/google"
import { Mail, Clock } from "lucide-react"
import { toast } from "sonner"
import { submitContactMessage } from "@/app/contact/actions"
import {
  contactFormSchema,
  contactSubjects,
  type ContactFormValues,
} from "@/lib/contact"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"
import { defaultWhatsAppMessage, getWhatsAppHref } from "@/lib/whatsapp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import styles from "@/components/about/about.module.css"

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const whatsappHref = getWhatsAppHref(defaultWhatsAppMessage) ?? "https://wa.me/"

const quickLinks = [
  { label: "FAQs", href: "/faqs" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Returns & Exchanges", href: "/returns" },
]

export function ContactPageContent() {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      orderNumber: "",
      message: "",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const result = await submitContactMessage(values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Message sent. We will get back to you soon.")
      form.reset()
    } catch {
      toast.error("Could not send your message. Please email hello@teeshogs.com.")
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <div
      className={cn(
        styles.aboutPage,
        sans.className,
        "bg-[var(--about-sand)] text-[var(--about-ink)]"
      )}
    >
      <section className="border-b border-[var(--about-line)] bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <Breadcrumb>
            <BreadcrumbList className="text-white/60">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-white/60 hover:text-white">
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Contact Us</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1
            className={cn(
              display.className,
              "mt-4 text-4xl tracking-tight text-white sm:text-5xl"
            )}
          >
            Contact Us
          </h1>
        </div>
      </section>

      <section className="bg-white dark:bg-[var(--about-sand)]">
        <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:py-20">
          <div>
            <h2 className={cn(display.className, "text-3xl tracking-tight sm:text-4xl")}>
              We are here for you
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--about-ink)]/80 sm:text-lg">
              Styling advice, order questions, or anything Body Talks. Send a message and our team
              will get back to you soon.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <Mail className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">Email</p>
                  <a
                    href="mailto:hello@teeshogs.com"
                    className="mt-1 inline-block text-base transition-opacity hover:opacity-70"
                  >
                    hello@teeshogs.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <WhatsAppIcon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">WhatsApp</p>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-base transition-opacity hover:opacity-70"
                  >
                    Chat with Teeshogs
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">Response time</p>
                  <p className="mt-1 text-base text-[var(--about-ink)]/80">
                    We usually reply within 1 to 2 business days.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t border-[var(--about-line)] pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">Quick links</p>
              <ul className="mt-4 space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-base text-[var(--about-ink)]/80 transition-colors hover:text-[var(--about-ink)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border border-[var(--about-line)] bg-white p-6 sm:p-8 dark:bg-[var(--about-cream)]">
            <h2 className={cn(display.className, "text-2xl tracking-tight sm:text-3xl")}>
              Send a message
            </h2>
            <p className="mt-2 text-sm text-[var(--about-ink)]/70">
              Fill in the form and we will respond by email.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" autoComplete="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={form.watch("subject") || undefined}
                  onValueChange={(value) =>
                    form.setValue("subject", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="What can we help with?" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactSubjects.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.subject && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.subject.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order number (optional)</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g. TEESHOGS-1042"
                  {...form.register("orderNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  placeholder="Share a few details so we can help faster..."
                  {...form.register("message")}
                />
                {form.formState.errors.message && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.message.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full rounded-none bg-[var(--about-ink)] text-[var(--about-sand)] hover:opacity-90 sm:w-auto sm:px-8"
              >
                {submitting ? "Sending..." : "Send message"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
