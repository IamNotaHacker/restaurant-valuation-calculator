import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { validateAndSanitizeEmail } from '@/lib/validations'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

// PRODUCTION NOTE: Critical security endpoint
// IMPLEMENTED: Email validation and sanitization
// TODO: Add rate limiting (recommend Upstash Redis: 5 requests per 15 minutes per IP/email)
// TODO: Consider implementing CAPTCHA for additional bot protection
// TODO: Add fraud detection monitoring (Stripe Radar)

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, calculatorType } = await req.json()

    // SECURITY: Validate and sanitize email format
    const email = validateAndSanitizeEmail(rawEmail)

    if (!email) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00 in cents
      currency: 'usd',
      metadata: {
        email,
        calculatorType: calculatorType || 'valuation',
        accessDays: '30',
      },
      description: `${calculatorType || 'Valuation'} Calculator - 30 Day Access`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error: any) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}