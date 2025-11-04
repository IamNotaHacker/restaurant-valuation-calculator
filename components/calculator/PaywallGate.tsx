'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { checkAccess, storeGuestEmail, getGuestEmail } from '@/lib/access-control'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Calculator, Clock, Check, ArrowRight, AlertCircle, Sparkles, TrendingUp, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PaywallGateProps {
  children: React.ReactNode
  calculatorType?: 'valuation' | 'viability'
}

export default function PaywallGate({ children, calculatorType = 'valuation' }: PaywallGateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailInput, setEmailInput] = useState('')

  useEffect(() => {
    checkUserAccess()

    // Check for successful payment return (old format - still supported)
    if (searchParams.get('success') === 'true' && searchParams.get('session_id')) {
      toast.success('Payment successful! Your 30-day access is now active.', {
        duration: 5000,
      })
      // Immediately check access again
      setTimeout(() => {
        checkUserAccess()
        router.push('/calculators/valuation') // Remove query params
      }, 1500)
    }

    // Check for successful payment return from our payment-success endpoint (new format)
    if (searchParams.get('payment_success') === 'true') {
      toast.success('Payment successful! Your 30-day access is now active.', {
        duration: 5000,
      })
      // Immediately check access again
      checkUserAccess()
      // Clean URL after showing message
      setTimeout(() => {
        router.push('/calculators/valuation')
      }, 1000)
    }

    // Handle payment still processing
    if (searchParams.get('payment_processing') === 'true') {
      toast.loading('Payment is being processed. Please wait...', {
        duration: 5000,
      })
      // Keep checking for access
      const interval = setInterval(() => {
        checkUserAccess()
      }, 2000)

      return () => clearInterval(interval)
    }

    // Handle errors
    if (searchParams.get('error')) {
      const error = searchParams.get('error')
      if (error === 'no_session') {
        toast.error('Invalid payment session.')
      } else if (error === 'processing_failed') {
        toast.error('Failed to process payment. Please contact support.')
      }
    }

    if (searchParams.get('canceled') === 'true') {
      toast.error('Payment canceled. You can try again when you\'re ready.')
    }
  }, [searchParams])

  const checkUserAccess = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check for user email or guest email
    const email = user?.email || getGuestEmail()
    setUserEmail(email)

    if (email) {
      const access = await checkAccess(email, calculatorType)
      setHasAccess(access.hasAccess)
      setDaysRemaining(access.daysRemaining)
    } else {
      setHasAccess(false)
    }
  }

  const handleUnlock = async () => {
    // If no email, show dialog to collect it
    if (!userEmail) {
      setShowEmailDialog(true)
      return
    }

    proceedToCheckout(userEmail)
  }

  const proceedToCheckout = async (email: string) => {
    setIsLoading(true)

    try {
      // Store email for guest checkout
      if (!userEmail) {
        storeGuestEmail(email)
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorType,
          email,
          priceId: calculatorType === 'valuation'
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VALUATION || 'price_test_valuation'
            : 'price_test_viability'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId, url } = await response.json()

      // Redirect to Stripe Checkout using the URL
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailInput)) {
      toast.error('Please enter a valid email address')
      return
    }

    setShowEmailDialog(false)
    proceedToCheckout(emailInput)
  }

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg text-gray-600">Checking access...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-6">
                <Lock className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Unlock Restaurant {calculatorType === 'valuation' ? 'Valuation' : 'Viability'} Calculator
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Get instant access to professional-grade analysis tools designed specifically for the restaurant industry
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-2 bg-white hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="p-3 bg-green-100 rounded-lg w-fit mb-2">
                    <Calculator className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Instant Calculations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Real-time valuation using SDE, EBITDA, and revenue multiples with industry benchmarks</p>
                </CardContent>
              </Card>

              <Card className="border-2 bg-white hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="p-3 bg-purple-100 rounded-lg w-fit mb-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Industry Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Compare against 500+ restaurant transactions with location and type adjustments</p>
                </CardContent>
              </Card>

              <Card className="border-2 bg-white hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="p-3 bg-orange-100 rounded-lg w-fit mb-2">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Professional Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Download detailed PDF reports perfect for investors and business planning</p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Card */}
            <Card className="max-w-2xl mx-auto border-2 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="text-center pb-8">
                <Badge className="w-fit mx-auto mb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  LIMITED TIME OFFER
                </Badge>
                <div>
                  <span className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">$10</span>
                  <span className="text-2xl text-gray-600 ml-2">for 30 days</span>
                </div>
                <p className="text-gray-600 mt-4">One-time payment, no subscription required</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">30-Day Unlimited Access</p>
                      <p className="text-sm text-gray-600">Perform unlimited calculations for a full month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">All Valuation Methods</p>
                      <p className="text-sm text-gray-600">SDE, EBITDA, Revenue multiples with adjustments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">PDF Report Generation</p>
                      <p className="text-sm text-gray-600">Professional reports for presentations and planning</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Save & Compare</p>
                      <p className="text-sm text-gray-600">Store multiple valuations and track changes</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button
                    onClick={handleUnlock}
                    disabled={isLoading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all text-lg py-6"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Unlock Calculator Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </span>
                    )}
                  </Button>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Test Mode Active</p>
                        <p>Use test card: <code className="bg-blue-100 px-1 py-0.5 rounded">4242 4242 4242 4242</code></p>
                        <p>Any future expiry date and any 3-digit CVC</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="mt-12 text-center">
              <div className="flex flex-wrap justify-center gap-8 items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Stripe Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>No Hidden Fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Collection Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Your Email</DialogTitle>
              <DialogDescription>
                We'll use this email to send you access details and track your 30-day access period.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                />
              </div>
              <Button onClick={handleEmailSubmit} className="w-full">
                Continue to Checkout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // User has access - show the calculator with remaining days banner
  return (
    <div>
      {daysRemaining > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-100 rounded">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-800">
                  Full Access Active
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                </Badge>
              </div>
              {daysRemaining <= 7 && (
                <Button size="sm" variant="outline" onClick={handleUnlock}>
                  Extend Access
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}