import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAccessToken } from '@/lib/access-control'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

// Disable body parsing, we need the raw body to verify the webhook signature
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // SECURITY: ALWAYS verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('Webhook secret not configured')
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      )
    }

    // Verify webhook signature - NO BYPASS ALLOWED
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Extract metadata
      const email = session.customer_email || session.metadata?.email
      const calculatorType = session.metadata?.calculator_type || 'valuation'
      const accessDays = parseInt(session.metadata?.access_days || '30')

      if (!email) {
        console.error('No email found in checkout session')
        return NextResponse.json(
          { error: 'No email found in session' },
          { status: 400 }
        )
      }

      // Create access token in database
      try {
        const tokenId = await createAccessToken(
          email,
          session.id,
          session.payment_intent as string | null,
          calculatorType,
          session.amount_total || 1000, // Amount in cents
          accessDays
        )

        if (!tokenId) {
          console.error('Failed to create access token')
        }
      } catch (error) {
        console.error('Error creating access token:', error)
        // Don't return error to Stripe, log it and handle separately
      }

      break
    }

    case 'payment_intent.succeeded': {
      // Payment intent succeeded - handled via checkout.session.completed
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.error('Payment failed:', paymentIntent.id)
      // You might want to send an email to the customer here
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      // Handle subscription events if you add subscription model later
      break
    }

    default:
      // Unhandled event type
      break
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true })
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  })
}

// For local testing without webhooks - manual access token creation
export async function GET(req: NextRequest) {
  // This endpoint is for testing only - remove in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const searchParams = req.nextUrl.searchParams
  const email = searchParams.get('email')
  const calculatorType = searchParams.get('type') || 'valuation'

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    const tokenId = await createAccessToken(
      email,
      `test_session_${Date.now()}`,
      `test_payment_${Date.now()}`,
      calculatorType,
      1000, // $10.00 in cents
      30
    )

    return NextResponse.json({
      success: true,
      tokenId,
      message: `Test access token created for ${email} - 30 days of ${calculatorType} calculator access`,
    })
  } catch (error) {
    console.error('Error creating test token:', error)
    return NextResponse.json(
      { error: 'Failed to create test access token' },
      { status: 500 }
    )
  }
}