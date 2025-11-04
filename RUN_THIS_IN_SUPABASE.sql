-- ====================================
-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ====================================

-- Create access_tokens table for managing 30-day calculator access
CREATE TABLE IF NOT EXISTS access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  calculator_type VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_session_id VARCHAR(255) UNIQUE,
  amount_paid INTEGER,
  currency VARCHAR(10) DEFAULT 'usd',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_access_tokens_user ON access_tokens(user_id, calculator_type, is_active);
CREATE INDEX IF NOT EXISTS idx_access_tokens_email ON access_tokens(email, calculator_type, is_active);
CREATE INDEX IF NOT EXISTS idx_access_tokens_expires ON access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_tokens_stripe_session ON access_tokens(stripe_session_id);

-- Add access_token_id to calculations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calculations'
    AND column_name = 'access_token_id'
  ) THEN
    ALTER TABLE calculations ADD COLUMN access_token_id UUID REFERENCES access_tokens(id);
  END IF;
END $$;

-- Enable RLS on access_tokens table
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own access tokens" ON access_tokens;
DROP POLICY IF EXISTS "System can create access tokens" ON access_tokens;
DROP POLICY IF EXISTS "System can update access tokens" ON access_tokens;

-- Create policies for access_tokens
CREATE POLICY "Users can view own access tokens" ON access_tokens
  FOR SELECT
  USING (true); -- Allow all reads for now, you can restrict later

CREATE POLICY "System can create access tokens" ON access_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update access tokens" ON access_tokens
  FOR UPDATE
  USING (true);

-- Optional: Create a test access token (30 days from now)
-- Uncomment and modify the email below to test
/*
INSERT INTO access_tokens (
  email,
  calculator_type,
  stripe_session_id,
  amount_paid,
  expires_at,
  is_active
) VALUES (
  'test@example.com', -- Change this to your test email
  'valuation',
  'test_session_' || gen_random_uuid(),
  1000, -- $10.00 in cents
  NOW() + INTERVAL '30 days',
  true
);
*/

-- Verify the table was created
SELECT
  'Access tokens table created successfully!' as message,
  COUNT(*) as total_tokens
FROM access_tokens;