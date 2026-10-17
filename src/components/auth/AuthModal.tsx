"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/context/StoreContext"
import {
  getRememberedEmail,
  setRememberPreference,
} from "@/lib/auth-storage"
import { supabase } from "@/lib/supabase"

type AuthMode = "login" | "signup" | "forgot"

export function AuthModal() {
  const { isAuthOpen, setIsAuthOpen, user, signOut } = useStore()
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthOpen) {
      setPassword("")
      setFullName("")
      setMode("login")
      setShowPassword(false)
      return
    }

    const savedEmail = getRememberedEmail()
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [isAuthOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        toast.success("Check your email for a password reset link.")
        setMode("login")
        return
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error

        if (data.user) {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              email,
              full_name: fullName,
              role: "customer",
            },
            { onConflict: "id" }
          )
          void fetch("/api/email/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name: fullName }),
          }).catch(() => {
            /* welcome email is best-effort */
          })
        }

        toast.success("Account created! Welcome to Teeshogs.")
        setIsAuthOpen(false)
        return
      }

      setRememberPreference(rememberMe, email)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success("Welcome back!")
      setIsAuthOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setIsAuthOpen(false)
  }

  const title =
    mode === "forgot"
      ? "Forgot password"
      : mode === "signup"
        ? "Join Teeshogs"
        : "Welcome Back"

  const description =
    mode === "forgot"
      ? "Enter your email and we will send you a reset link."
      : mode === "signup"
        ? "Create an account to unlock your wishlist and faster checkout."
        : "Sign in to your account to continue shopping."

  return (
    <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
      <DialogContent className="max-w-md">
        {user ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Your account</DialogTitle>
              <DialogDescription>
                You are signed in as {user.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button size="lg" asChild>
                <Link href="/account" onClick={() => setIsAuthOpen(false)}>
                  View my account
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "signup" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    placeholder="Jane Doe"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              {mode !== "forgot" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading} size="lg">
                {loading
                  ? "Please wait..."
                  : mode === "forgot"
                    ? "Send reset link"
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
              </Button>
            </form>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              {mode === "login" && (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-foreground hover:underline"
                  >
                    Sign up
                  </button>
                </>
              )}
              {mode === "signup" && (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-foreground hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <>
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-foreground hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
