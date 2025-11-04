import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAndSanitizeEmail } from '@/lib/validations'

// PRODUCTION NOTE: Implement rate limiting for this endpoint
// Recommended: 10 requests per minute per IP or email
// Consider using Vercel Edge Config or Upstash Redis for rate limiting
// Example: https://vercel.com/docs/security/rate-limiting
// IMPLEMENTED: Email validation and sanitization

export async function POST(req: NextRequest) {
  // TODO: Add rate limiting check here before processing request
  try {
    const { email: rawEmail, calculatorType } = await req.json()

    // SECURITY: Validate and sanitize email
    const email = validateAndSanitizeEmail(rawEmail)

    if (!email) {
      return NextResponse.json(
        { hasAccess: false, daysRemaining: 0 },
        { status: 200 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      console.error('Service role key not configured')
      return NextResponse.json(
        { hasAccess: false, daysRemaining: 0 },
        { status: 200 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query for active access tokens
    const { data: tokens, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('email', email)
      .eq('calculator_type', calculatorType || 'valuation')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error checking access:', error)
      return NextResponse.json(
        { hasAccess: false, daysRemaining: 0 },
        { status: 200 }
      )
    }

    if (tokens && tokens.length > 0) {
      const token = tokens[0]
      const daysRemaining = Math.ceil(
        (new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return NextResponse.json({
        hasAccess: true,
        daysRemaining,
        accessToken: {
          id: token.id,
          email: token.email,
          calculator_type: token.calculator_type,
          expires_at: token.expires_at,
          is_active: token.is_active,
          days_remaining: daysRemaining
        }
      })
    }

    // No valid token found
    return NextResponse.json({
      hasAccess: false,
      daysRemaining: 0
    })
  } catch (error: any) {
    console.error('Check access error:', error)
    return NextResponse.json(
      { hasAccess: false, daysRemaining: 0 },
      { status: 200 }
    )
  }
}
