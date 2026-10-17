/*
  Product-level SKU for catalog rows without variants.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku text;
