/*
  # Create Products Table for E-commerce

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `category` (text) - Product category (vegetables, fish, frozen, spices)
      - `price` (numeric) - Unit price in Rupiah
      - `image_url` (text) - Product image URL
      - `description` (text, optional) - Product description
      - `in_stock` (boolean) - Availability status
      - `created_at` (timestamptz) - Record creation timestamp
      
  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access (anyone can view products)
    - Add policy for authenticated users to insert/update/delete (for admin functionality)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('vegetables', 'fish', 'frozen', 'spices')),
  price numeric NOT NULL CHECK (price >= 0),
  image_url text NOT NULL DEFAULT '',
  description text DEFAULT '',
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);