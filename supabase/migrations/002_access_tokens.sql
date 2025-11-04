-- Create access_tokens table for managing 30-day calculator access
CREATE TABLE IF NOT EXISTS access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  calculator_type VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_session_id VARCHAR(255) UNIQUE,
  amount_paid INTEGER, -- Amount in cents
  currency VARCHAR(10) DEFAULT 'usd',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for fast lookups
CREATE INDEX idx_access_tokens_user ON access_tokens(user_id, calculator_type, is_active);
CREATE INDEX idx_access_tokens_email ON access_tokens(email, calculator_type, is_active);
CREATE INDEX idx_access_tokens_expires ON access_tokens(expires_at);
CREATE INDEX idx_access_tokens_stripe_session ON access_tokens(stripe_session_id);

-- Add access_token_id to calculations table to track which access was used
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS access_token_id UUID REFERENCES access_tokens(id);

-- Enable RLS on access_tokens table
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for access_tokens
-- Users can view their own access tokens
CREATE POLICY "Users can view own access tokens" ON access_tokens
  FOR SELECT
  USING (auth.uid() = user_id OR email = auth.email());

-- System can insert new access tokens (from webhook)
CREATE POLICY "System can create access tokens" ON access_tokens
  FOR INSERT
  WITH CHECK (true);

-- System can update access tokens (from webhook)
CREATE POLICY "System can update access tokens" ON access_tokens
  FOR UPDATE
  USING (true);

-- Add a function to check if user has valid access
CREATE OR REPLACE FUNCTION check_calculator_access(
  p_email VARCHAR,
  p_calculator_type VARCHAR
)
RETURNS TABLE (
  has_access BOOLEAN,
  days_remaining INTEGER,
  access_token_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH valid_access AS (
    SELECT
      at.id,
      at.expires_at,
      GREATEST(0, EXTRACT(DAY FROM (at.expires_at - NOW()))::INTEGER) as days_left
    FROM access_tokens at
    WHERE at.email = p_email
      AND at.calculator_type = p_calculator_type
      AND at.is_active = true
      AND at.expires_at > NOW()
    ORDER BY at.expires_at DESC
    LIMIT 1
  )
  SELECT
    COUNT(*) > 0 as has_access,
    COALESCE(MAX(days_left), 0) as days_remaining,
    MAX(id) as access_token_id
  FROM valid_access;
END;
$$;

-- Function to create a new access token after successful payment
CREATE OR REPLACE FUNCTION create_access_token(
  p_email VARCHAR,
  p_calculator_type VARCHAR,
  p_stripe_session_id VARCHAR,
  p_stripe_payment_intent_id VARCHAR,
  p_amount_paid INTEGER,
  p_days INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_id UUID;
  v_user_id UUID;
BEGIN
  -- Try to find existing user with this email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  -- Insert new access token
  INSERT INTO access_tokens (
    user_id,
    email,
    calculator_type,
    stripe_session_id,
    stripe_payment_intent_id,
    amount_paid,
    expires_at,
    is_active
  ) VALUES (
    v_user_id,
    p_email,
    p_calculator_type,
    p_stripe_session_id,
    p_stripe_payment_intent_id,
    p_amount_paid,
    NOW() + INTERVAL '1 day' * p_days,
    true
  )
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$;