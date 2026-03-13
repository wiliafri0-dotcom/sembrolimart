/*
  # Create Storage Bucket for Product Images

  1. Storage Setup
    - Create public bucket named 'products' for product images
    - Images stored here will be publicly accessible
    - Admin can upload images when adding/editing products
    
  2. Notes
    - Public bucket allows unauthenticated read access
    - All images in this bucket are public and can be linked directly
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Allow insert for all"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow update for all"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'products')
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow delete for all"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'products');