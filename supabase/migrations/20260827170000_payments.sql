/*
  Payment metadata on orders (Paystack).
  Payments UI is a ledger over checkout orders.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_channel text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS paystack_fees numeric(12,2),
  ADD COLUMN IF NOT EXISTS paystack_status text,
  ADD COLUMN IF NOT EXISTS paystack_paid_amount numeric(12,2);

CREATE INDEX IF NOT EXISTS orders_paid_at_idx ON orders (paid_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS orders_payment_channel_idx ON orders (payment_channel);
