"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProvider } from "@/context/StoreContext"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        {children}
        <Toaster />
      </StoreProvider>
    </ThemeProvider>
  )
}
