import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAccessToken } from '@/lib/access-control'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.redirect(new URL('/calculators/valuation?error=no_session', req.url))
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent']
    })

    if (session.payment_status === 'paid') {
      // Create access token immediately
      const email = session.customer_email || session.customer_details?.email

      if (email) {
        // Create access token for 30 days
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null

        await createAccessToken(
          email,
          sessionId,
          paymentIntentId,
          session.metadata?.calculator_type || 'valuation',
          session.amount_total || 1000,
          30
        )
      }

      // Redirect to calculator with success message and email
      const redirectUrl = new URL('/calculators/valuation', req.url)
      redirectUrl.searchParams.set('payment_success', 'true')
      if (email) {
        redirectUrl.searchParams.set('email', email)
      }
      return NextResponse.redirect(redirectUrl)
    } else {
      // Payment not complete yet
      return NextResponse.redirect(
        new URL('/calculators/valuation?payment_processing=true', req.url)
      )
    }
  } catch (error) {
    console.error('Error processing payment success:', error)
    return NextResponse.redirect(
      new URL('/calculators/valuation?error=processing_failed', req.url)
    )
  }
}