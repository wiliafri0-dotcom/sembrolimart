/*
# Add managed delivery areas and cashier sale fields

1. New Tables
- `shipping_addresses` stores the delivery area names shown to customers and whether each area qualifies for free shipping.
- `shipping_addresses.id` is the unique identifier.
- `shipping_addresses.name` is the customer-facing area name.
- `shipping_addresses.is_active` controls whether the area appears in the customer form.
- `shipping_addresses.created_at` records when the area was added.

2. Modified Tables
- `orders.order_source` identifies whether a sale came from the online store or was entered by the cashier for an offline sale.
- `orders.payment_method` stores the cashier's payment method when known.
- `orders.notes` stores optional cashier notes.

3. Security
- Row-level security is enabled on `shipping_addresses`.
- This is a single-store app without customer accounts, so the anon and authenticated roles can read and manage the shared delivery-area settings and purchase records.

4. Important Notes
- Existing order data is preserved; new order fields use safe defaults.
- The customer form only uses active delivery areas, and checkout applies free shipping only when the selected area matches an active configured area.
*/

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view shipping addresses" ON shipping_addresses;
CREATE POLICY "Anyone can view shipping addresses"
  ON shipping_addresses FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add shipping addresses" ON shipping_addresses;
CREATE POLICY "Anyone can add shipping addresses"
  ON shipping_addresses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update shipping addresses" ON shipping_addresses;
CREATE POLICY "Anyone can update shipping addresses"
  ON shipping_addresses FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete shipping addresses" ON shipping_addresses;
CREATE POLICY "Anyone can delete shipping addresses"
  ON shipping_addresses FOR DELETE
  TO anon, authenticated
  USING (true);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_source text NOT NULL DEFAULT 'online';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

INSERT INTO shipping_addresses (name)
VALUES ('Sekarpuro'), ('Sulfat'), ('Sawojajar')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_order_source_idx ON orders (order_source);
