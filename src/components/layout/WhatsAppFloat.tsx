"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import { Send, X } from "lucide-react"
import { toast } from "sonner"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"
import { getWhatsAppHref, getWhatsAppNumber } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  from: "teeshogs" | "user"
  text: string
}

const welcomeMessages: ChatMessage[] = [
  {
    id: "welcome-1",
    from: "teeshogs",
    text: "Hi there! Welcome to Teeshogs.",
  },
  {
    id: "welcome-2",
    from: "teeshogs",
    text: "How can we help you today? Type your message and tap send to continue on WhatsApp.",
  },
]

type WhatsAppFloatProps = {
  className?: string
}

export function WhatsAppFloat({ className }: WhatsAppFloatProps) {
  const hasNumber = Boolean(getWhatsAppNumber())
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(welcomeMessages)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [open, messages])

  if (!hasNumber) return null

  const sendToWhatsApp = () => {
    const text = draft.trim()
    if (!text) {
      toast.error("Type a message first")
      return
    }

    const href = getWhatsAppHref(text)
    if (!href) {
      toast.error("WhatsApp is not configured yet")
      return
    }

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        from: "user",
        text,
      },
    ])
    setDraft("")
    window.open(href, "_blank", "noopener,noreferrer")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendToWhatsApp()
    }
  }

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6",
        className
      )}
    >
      {open && (
        <div
          className="flex h-[min(32rem,calc(100vh-7rem))] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#efeae2] shadow-2xl"
          role="dialog"
          aria-label="Chat with Teeshogs on WhatsApp"
        >
          <div className="flex items-center gap-3 bg-[#075E54] px-3 py-3 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="size-5" />
            </button>
            <div className="relative size-10 overflow-hidden rounded-full bg-white">
              <Image
                src="/teeshogs-logo-black.png"
                alt="Teeshogs"
                fill
                className="object-contain p-1"
                sizes="40px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Teeshogs</p>
              <p className="truncate text-xs text-white/75">Typically replies within minutes</p>
            </div>
            <WhatsAppIcon className="size-5 opacity-90" />
          </div>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-[#e5ddd5] px-3 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.from === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.from === "teeshogs" && (
                  <div className="relative mr-2 mt-auto size-7 shrink-0 overflow-hidden rounded-full bg-white shadow-sm">
                    <Image
                      src="/teeshogs-logo-black.png"
                      alt=""
                      fill
                      className="object-contain p-0.5"
                      sizes="28px"
                    />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[78%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm",
                    message.from === "user"
                      ? "rounded-br-sm bg-[#dcf8c6] text-neutral-900"
                      : "rounded-bl-sm bg-white text-neutral-900"
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/5 bg-[#f0f0f0] p-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type a message"
                className="max-h-28 min-h-10 flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none ring-0 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#25D366]"
              />
              <button
                type="button"
                onClick={sendToWhatsApp}
                aria-label="Send on WhatsApp"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#1ebe57]"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-neutral-500">
              Sending opens WhatsApp with your message to Teeshogs.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close WhatsApp chat" : "Open WhatsApp chat"}
        aria-expanded={open}
        className={cn(
          "flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200",
          "hover:scale-105 hover:bg-[#1ebe57]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        )}
      >
        {open ? <X className="size-6" /> : <WhatsAppIcon className="size-7" />}
      </button>
    </div>
  )
}
