"use server"

import { revalidatePath } from "next/cache"

/** Refresh storefront chrome so Shop menu picks up category changes. */
export async function revalidateStorefrontNav() {
  revalidatePath("/", "layout")
  revalidatePath("/shop")
}
