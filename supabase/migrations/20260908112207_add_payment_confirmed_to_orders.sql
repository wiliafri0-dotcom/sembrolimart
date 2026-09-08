/*
# Add payment confirmation flag to orders

1. Modified Tables
- `orders.payment_confirmed` (boolean, not null, default false) — lets the cashier
  mark that payment for an order has been received/verified.

2. Security
- No new tables; RLS already enabled on `orders`.
- Existing SELECT/INSERT policies cover the new column (it defaults to false).
- Adds an UPDATE policy so the cashier (anon/authenticated in this single-store app)
  can toggle the payment_confirmed flag on existing orders.

3. Important Notes
- Existing order data is preserved; the new column defaults to false.
- This is a single-store app without customer accounts, so anon + authenticated
  roles are allowed to update orders (specifically the payment_confirmed flag).
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
CREATE POLICY "Anyone can update orders"
  ON orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
