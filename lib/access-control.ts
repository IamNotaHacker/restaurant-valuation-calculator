import { getSupabaseBrowserClient } from './supabase/client'
import { createClient } from '@supabase/supabase-js'
import { ensureDatabaseSetup } from './database/auto-setup'

export interface AccessToken {
  id: string
  email: string
  calculator_type: string
  expires_at: string
  is_active: boolean
  days_remaining?: number
}

export interface AccessCheckResult {
  hasAccess: boolean
  daysRemaining: number
  accessToken?: AccessToken
}

/**
 * Check if a user has valid access to a calculator
 * @param email - User's email address
 * @param calculatorType - Type of calculator (valuation, viability, etc.)
 * @returns Access check result with days remaining
 */
export async function checkAccess(
  email: string | null | undefined,
  calculatorType: string = 'valuation'
): Promise<AccessCheckResult> {
  if (!email) {
    return { hasAccess: false, daysRemaining: 0 }
  }

  try {
    // Use API endpoint for checking access (works both client and server side)
    const response = await fetch('/api/check-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, calculatorType })
    })

    if (!response.ok) {
      // 404 can happen during development when Next.js is recompiling routes
      if (response.status !== 404) {
        console.error('Access check failed with status:', response.status)
      }
      return { hasAccess: false, daysRemaining: 0 }
    }

    const data = await response.json()
    return {
      hasAccess: data.hasAccess,
      daysRemaining: data.daysRemaining,
      accessToken: data.accessToken
    }
  } catch (error) {
    console.error('Error in checkAccess:', error)
    return { hasAccess: false, daysRemaining: 0 }
  }
}

/**
 * Create a new access token after successful payment
 * This should only be called from the server-side webhook handler
 * @param email - User's email
 * @param stripeSessionId - Stripe checkout session ID
 * @param stripePaymentIntentId - Stripe payment intent ID
 * @param calculatorType - Type of calculator
 * @param amountPaid - Amount paid in cents
 * @param days - Number of days of access (default 30)
 */
export async function createAccessToken(
  email: string,
  stripeSessionId: string,
  stripePaymentIntentId: string | null,
  calculatorType: string = 'valuation',
  amountPaid: number,
  days: number = 30
): Promise<string | null> {
  // This function should only be called server-side
  // We'll use the service role client for this
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    console.error('Service role key not configured')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // First check if table exists by attempting to create it
    // This is a safe operation - if table exists, it will just fail silently
    await supabase.from('access_tokens').select('id').limit(1)

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    // Try to find existing user with this email
    const { data: users } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .limit(1)

    const userId = users && users.length > 0 ? users[0].id : null

    // Insert new access token directly
    const { data, error } = await supabase
      .from('access_tokens')
      .insert({
        user_id: userId,
        email: email,
        calculator_type: calculatorType,
        stripe_session_id: stripeSessionId,
        stripe_payment_intent_id: stripePaymentIntentId,
        amount_paid: amountPaid,
        currency: 'usd',
        expires_at: expiresAt.toISOString(),
        is_active: true,
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating access token:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error in createAccessToken:', error)
    return null
  }
}

/**
 * Get all active access tokens for a user
 * @param email - User's email address
 * @returns Array of active access tokens
 */
export async function getUserAccessTokens(
  email: string | null | undefined
): Promise<AccessToken[]> {
  if (!email) {
    return []
  }

  const supabase = getSupabaseBrowserClient()

  try {
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })

    if (error) {
      console.error('Error fetching access tokens:', error)
      return []
    }

    // Calculate days remaining for each token
    return (data || []).map((token: any) => ({
      ...token,
      days_remaining: Math.ceil(
        (new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    }))
  } catch (error) {
    console.error('Error in getUserAccessTokens:', error)
    return []
  }
}

/**
 * Store email in localStorage for guest checkout
 * @param email - Email address to store
 */
export function storeGuestEmail(email: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('guestEmail', email)
  }
}

/**
 * Get stored guest email from localStorage
 * @returns Stored email or null
 */
export function getGuestEmail(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guestEmail')
  }
  return null
}

/**
 * Clear stored guest email from localStorage
 */
export function clearGuestEmail() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guestEmail')
  }
}