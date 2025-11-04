-- Restaurant Valuation Calculator Database Schema
-- Run this script in your Supabase SQL Editor to set up the required tables

-- Create calculations table
CREATE TABLE IF NOT EXISTS calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calculator_type VARCHAR(50) DEFAULT 'valuation',
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  session_id VARCHAR(100),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_session_id ON calculations(session_id);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_calculator_type ON calculations(calculator_type);

-- Enable Row Level Security (RLS)
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Policy: Users can only see their own calculations
CREATE POLICY "Users can view own calculations" ON calculations
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- Policy: Users can insert their own calculations
CREATE POLICY "Users can insert own calculations" ON calculations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- Policy: Users can update their own calculations
CREATE POLICY "Users can update own calculations" ON calculations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own calculations
CREATE POLICY "Users can delete own calculations" ON calculations
  FOR DELETE USING (auth.uid() = user_id);

-- Create a view for calculation statistics
CREATE OR REPLACE VIEW calculation_stats AS
SELECT
  calculator_type,
  COUNT(*) as total_calculations,
  AVG((results->>'estimatedValue')::numeric) as avg_valuation,
  MIN((results->>'estimatedValue')::numeric) as min_valuation,
  MAX((results->>'estimatedValue')::numeric) as max_valuation,
  AVG((inputs->>'annualSales')::numeric) as avg_annual_sales,
  DATE(created_at) as calculation_date
FROM calculations
WHERE calculator_type = 'valuation'
GROUP BY calculator_type, DATE(created_at)
ORDER BY calculation_date DESC;

-- Grant permissions on the view
GRANT SELECT ON calculation_stats TO anon, authenticated;

-- Create function to clean up old anonymous calculations (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_calculations()
RETURNS void AS $$
BEGIN
  DELETE FROM calculations
  WHERE user_id IS NULL
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run cleanup daily
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-anonymous-calculations', '0 2 * * *', 'SELECT cleanup_old_anonymous_calculations();');

-- Create a function to get user's calculation history
CREATE OR REPLACE FUNCTION get_calculation_history(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  calculator_type VARCHAR(50),
  inputs JSONB,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  session_id VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.calculator_type,
    c.inputs,
    c.results,
    c.created_at,
    c.session_id
  FROM calculations c
  WHERE c.user_id = auth.uid()
    OR (c.user_id IS NULL AND c.session_id IS NOT NULL)
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_calculation_history TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE calculations IS 'Stores all calculator results including inputs and outputs';
COMMENT ON COLUMN calculations.calculator_type IS 'Type of calculator used (e.g., valuation, profit-margin, break-even)';
COMMENT ON COLUMN calculations.inputs IS 'JSON object containing all input parameters';
COMMENT ON COLUMN calculations.results IS 'JSON object containing all calculated results';
COMMENT ON COLUMN calculations.session_id IS 'Anonymous session ID for non-authenticated users';
COMMENT ON COLUMN calculations.user_id IS 'Reference to authenticated user if logged in';