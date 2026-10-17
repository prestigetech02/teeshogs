"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Store, UserRound } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOutAdmin } from "@/components/admin/AdminSignOutButton"

type AdminUserMenuProps = {
  email: string | null
  name: string | null
}

function initialsFrom(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "A"
  const parts = source.split(/[\s@]+/).filter(Boolean)
  const letters = (parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "")
  return letters.toUpperCase()
}

export function AdminUserMenu({ email, name }: AdminUserMenuProps) {
  const router = useRouter()
  const label = name?.trim() || email || "Admin"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar size="sm" className="size-8">
            <AvatarFallback className="bg-primary text-[11px] font-medium text-primary-foreground">
              {initialsFrom(name, email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{label}</p>
          {email && name?.trim() ? (
            <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/profile">
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">
            <Store />
            View store
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void signOutAdmin(() => {
              router.replace("/admin/login")
              router.refresh()
            })
          }}
        >
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
