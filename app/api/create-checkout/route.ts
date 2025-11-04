import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { validateAndSanitizeEmail } from '@/lib/validations'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

// Calculator pricing (in cents)
const PRICING = {
  valuation: 1000, // $10.00
  viability: 1000, // $10.00
  both: 1500,     // $15.00
}

export async function POST(req: NextRequest) {
  try {
    const { calculatorType, email: rawEmail, priceId } = await req.json()

    // SECURITY: Validate and sanitize email
    const email = validateAndSanitizeEmail(rawEmail)

    if (!email) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Determine the price based on calculator type
    const amount = PRICING[calculatorType as keyof typeof PRICING] || PRICING.valuation

    // Create or retrieve customer
    let customer: Stripe.Customer | undefined

    // Check if customer exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email,
        metadata: {
          calculator_type: calculatorType,
        },
      })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product: process.env.STRIPE_PRODUCT_ID_VALUATION || 'prod_TLtKjvFeFJcNiD', // Use your actual product ID
            unit_amount: amount,
            recurring: undefined, // One-time payment
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/api/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/calculators/valuation?canceled=true`,
      metadata: {
        calculator_type: calculatorType,
        access_days: '30',
        email: email,
      },
      // Collect billing address for better fraud prevention
      billing_address_collection: 'required',
      // Allow promotional codes
      allow_promotion_codes: true,
      // Expire the checkout session after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      // Custom text for the submit button
      submit_type: 'pay',
      // Tax collection (optional - configure in Stripe Dashboard)
      automatic_tax: {
        enabled: false, // Set to true if you've configured tax in Stripe
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}