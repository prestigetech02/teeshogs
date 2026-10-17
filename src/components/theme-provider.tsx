"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({
  children,
  defaultTheme = "light",
  attribute = "class",
  enableSystem = false,
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  // React 19 / Next 16 warn when next-themes renders a <script> on the client.
  // Keep a normal script on the server (FOUC prevention); mark it non-JS on the client.
  const scriptProps =
    typeof window === "undefined"
      ? undefined
      : ({ type: "application/json" } as const)

  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
      scriptProps={scriptProps}
    >
      {children}
    </NextThemesProvider>
  )
}

export { useTheme } from "next-themes"
