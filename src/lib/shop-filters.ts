export const shopCategories = [
  { label: "Dresses", value: "dresses" },
  { label: "Tops", value: "tops" },
  { label: "Bottoms", value: "bottoms" },
  { label: "Outerwear", value: "outerwear" },
  { label: "Intimates", value: "intimates" },
  { label: "Lounge & Sleepwear", value: "lounge-and-sleepwear" },
  { label: "Swim & Beachwear", value: "swim-and-beachwear" },
  { label: "Bonnets & Hair Accessories", value: "bonnets-and-hair-accessories" },
  { label: "Accessories", value: "accessories" },
] as const

export const shopStatusFilters = [
  { label: "New Arrivals", value: "new" },
  { label: "Best Sellers", value: "bestsellers" },
  { label: "On Sale", value: "sale" },
] as const

export const shopSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const

export const shopColors = [
  "Black",
  "White",
  "Ivory",
  "Cream",
  "Camel",
  "Navy",
  "Charcoal",
  "Olive",
  "Sage Green",
  "Terracotta",
  "Dusty Rose",
  "Blush",
  "Burgundy",
  "Emerald",
  "Midnight",
] as const

export const shopSortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" },
] as const

export const PRICE_MIN = 0
export const PRICE_MAX = 500_000
