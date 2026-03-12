/*
  # Create admins table

  1. New Tables
    - `admins`
      - `id` (uuid, primary key) - Unique identifier for each admin
      - `username` (text, unique, not null) - Admin username for login
      - `password` (text, not null) - Admin password (stored as plain text for simplicity)
      - `created_at` (timestamptz) - Timestamp of admin creation
  
  2. Security
    - Enable RLS on `admins` table
    - Add policy for authenticated users to read admin data (for login verification)
    
  3. Initial Data
    - Create a default admin account (username: admin, password: admin123)
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for authentication"
  ON admins
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO admins (username, password) 
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;