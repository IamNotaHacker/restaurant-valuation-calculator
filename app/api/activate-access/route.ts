import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ensureDatabaseSetup } from '@/lib/database/auto-setup'

export async function POST(req: NextRequest) {
  try {
    const { email, paymentIntentId, calculatorType } = await req.json()

    if (!email || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure database is set up
    await ensureDatabaseSetup()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      console.error('Service role key not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if access already exists for this payment
    const { data: existingToken } = await supabase
      .from('access_tokens')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (existingToken) {
      return NextResponse.json({
        success: true,
        message: 'Access already activated'
      })
    }

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create access token
    const { data, error } = await supabase
      .from('access_tokens')
      .insert({
        email,
        calculator_type: calculatorType || 'valuation',
        stripe_payment_intent_id: paymentIntentId,
        amount_paid: 1000, // $10.00 in cents
        currency: 'usd',
        expires_at: expiresAt.toISOString(),
        is_active: true,
        metadata: {
          payment_method: 'embedded_stripe',
          activated_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating access token:', error)

      // Provide helpful error message for missing table
      if (error.code === 'PGRST205') {
        return NextResponse.json(
          {
            error: 'Database table not found. Please run the migration in Supabase dashboard.',
            details: 'See supabase-migration.sql file'
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to activate access', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      accessToken: data,
      message: 'Access successfully activated for 30 days'
    })
  } catch (error: any) {
    console.error('Access activation error:', error)
    return NextResponse.json(
      { error: 'Failed to activate access' },
      { status: 500 }
    )
  }
}