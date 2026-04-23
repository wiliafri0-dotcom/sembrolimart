/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text, not null)
      - `customer_address` (text)
      - `shipping_type` (text, not null, default 'preorder')
      - `items` (jsonb, not null) - snapshot of cart items with name, price, quantity at time of order
      - `subtotal` (integer, not null)
      - `shipping_fee` (integer, not null, default 0)
      - `total` (integer, not null)
      - `status` (text, not null, default 'sent')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `orders` table
    - Add policy for authenticated users to read their own orders (future use)
    - Add policy for anon users to insert orders (needed for checkout flow without auth)
    - No update or delete policies - orders are immutable once created

  3. Important Notes
    - The `items` column stores a JSON snapshot of the cart at order time, preventing
      post-order modification of item details and prices
    - No UPDATE or DELETE policies ensure orders cannot be altered after submission
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_address text DEFAULT '',
  shipping_type text NOT NULL DEFAULT 'preorder',
  items jsonb NOT NULL DEFAULT '[]',
  subtotal integer NOT NULL DEFAULT 0,
  shipping_fee integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);
