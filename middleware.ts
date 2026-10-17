import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  response.headers.set("x-pathname", pathname)

  const isAdminRoute = pathname.startsWith("/admin")
  const isAdminLogin = pathname === "/admin/login"

  if (isAdminRoute && !isAdminLogin && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    loginUrl.searchParams.set("next", pathname)
    const redirect = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie)
    })
    return redirect
  }

  if (isAdminLogin && user) {
    // Let the login page decide based on role; don't force redirect here.
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
