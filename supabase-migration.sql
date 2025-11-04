-- =====================================================
-- Blue Orbit MVP - Access Tokens Table Migration
-- =====================================================
-- Run this in your Supabase SQL Editor
-- Dashboard: https://lsdswmoatjfymgkviljw.supabase.co/project/lsdswmoatjfymgkviljw/sql/new
-- =====================================================

-- Drop the table if it exists (to ensure clean setup)
DROP TABLE IF EXISTS public.access_tokens CASCADE;

-- Create access_tokens table
CREATE TABLE public.access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  calculator_type VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_session_id VARCHAR(255) UNIQUE,
  amount_paid INTEGER,
  currency VARCHAR(10) DEFAULT 'usd',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX idx_access_tokens_user ON public.access_tokens(user_id, calculator_type, is_active);
CREATE INDEX idx_access_tokens_email ON public.access_tokens(email, calculator_type, is_active);
CREATE INDEX idx_access_tokens_expires ON public.access_tokens(expires_at);
CREATE INDEX idx_access_tokens_stripe_session ON public.access_tokens(stripe_session_id);
CREATE INDEX idx_access_tokens_stripe_payment ON public.access_tokens(stripe_payment_intent_id);

-- Enable Row Level Security
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own access tokens"
  ON public.access_tokens
  FOR SELECT
  USING (true);  -- Allow reading for now, you can restrict to auth.uid() = user_id later

CREATE POLICY "System can create access tokens"
  ON public.access_tokens
  FOR INSERT
  WITH CHECK (true);  -- Service role will handle this

CREATE POLICY "System can update access tokens"
  ON public.access_tokens
  FOR UPDATE
  USING (true);  -- Service role will handle this

-- Grant necessary permissions
GRANT ALL ON public.access_tokens TO authenticated;
GRANT ALL ON public.access_tokens TO service_role;
GRANT ALL ON public.access_tokens TO anon;

-- =====================================================
-- Success! Your table is ready to use.
-- =====================================================
