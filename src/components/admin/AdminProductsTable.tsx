"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/supabase"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import {
  getProductSku,
  isProductInStock,
  resolveAdminImageSrc,
  shopCategories,
} from "@/lib/admin-products"
import { formatNGN } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PAGE_SIZE = 10

type AdminProductsTableProps = {
  initialProducts: Product[]
}

export function AdminProductsTable({ initialProducts }: AdminProductsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get("q") ?? ""

  const [products, setProducts] = useState(initialProducts)
  const [query, setQuery] = useState(urlQuery)
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setQuery(urlQuery)
    setPage(1)
  }, [urlQuery])

  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((product) => {
      const sku = getProductSku(product).toLowerCase()
      const matchesQuery =
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        product.slug.toLowerCase().includes(needle) ||
        sku.includes(needle)

      const matchesCategory = category === "all" || product.category === category
      const inStock = isProductInStock(product)
      const matchesStatus =
        status === "all" ||
        (status === "in" && inStock) ||
        (status === "out" && !inStock)

      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [category, products, query, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [category, status, query])

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from("products").delete().eq("id", pendingDelete.id)

    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }

    setProducts((current) => current.filter((item) => item.id !== pendingDelete.id))
    toast.success(`${pendingDelete.name} deleted`)
    setPendingDelete(null)
    setDeleting(false)
    router.refresh()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, SKU, or slug..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {shopCategories.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="in">In stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No products match these filters.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((product) => {
                const inStock = isProductInStock(product)
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          <img
                            src={resolveAdminImageSrc(
                              Array.isArray(product.images) ? product.images[0] || "dress-1.webp" : "dress-1.webp"
                            )}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null
                              event.currentTarget.src = "/dress-1.webp"
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{getProductSku(product)}</TableCell>
                    <TableCell className="capitalize">{product.category.replace(/-/g, " ")}</TableCell>
                    <TableCell>{formatNGN(Number(product.price))}</TableCell>
                    <TableCell>
                      <Badge variant={inStock ? "outline" : "destructive"}>
                        {inStock ? "In stock" : "Out of stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${product.name}`}
                          >
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => setPendingDelete(product)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {currentPage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{pendingDelete?.name}</strong> from the catalog.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
