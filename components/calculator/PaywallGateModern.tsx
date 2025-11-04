'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Zap } from 'lucide-react'
import PaymentModal from '@/components/payment/PaymentModalModern'
import { checkAccess, getGuestEmail, storeGuestEmail } from '@/lib/access-control'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function PaywallGateModern({
  children,
  calculatorType = 'valuation'
}: {
  children: React.ReactNode
  calculatorType?: string
}) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Only check access once on mount
    checkUserAccess()

    // Handle successful payments - just show toast, don't refresh
    if (searchParams.get('success') === 'true' || searchParams.get('payment_success') === 'true') {
      toast.success('Payment successful! Your access is now active.')
      // Clean URL without refreshing
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('payment_success')
      window.history.replaceState({}, '', url)
    }

    if (searchParams.get('canceled') === 'true') {
      toast.error('Payment canceled')
      // Clean URL without refreshing
      const url = new URL(window.location.href)
      url.searchParams.delete('canceled')
      window.history.replaceState({}, '', url)
    }
  }, [])

  const checkUserAccess = async () => {
    setIsCheckingAccess(true)

    try {
      // Check for user email from multiple sources
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const email = user?.email ||
                    localStorage.getItem('userEmail') ||
                    getGuestEmail()

      setUserEmail(email)

      if (email) {
        // If payment was just completed (within last 10 seconds), trust the local state
        const accessGrantedAt = localStorage.getItem('accessGrantedAt')
        if (accessGrantedAt) {
          const timeSinceGrant = Date.now() - parseInt(accessGrantedAt)
          if (timeSinceGrant < 10000) {
            // Trust the payment success, grant access immediately
            setHasAccess(true)
            setDaysRemaining(30)
            setIsCheckingAccess(false)
            return
          }
        }

        // Check access via API with timeout
        const access = await checkAccess(email, calculatorType)
        setHasAccess(access.hasAccess)
        setDaysRemaining(access.daysRemaining)
      } else {
        setHasAccess(false)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      // If there's an error but localStorage has email, assume they have access
      const email = localStorage.getItem('userEmail')
      if (email) {
        setHasAccess(true)
        setDaysRemaining(30)
      } else {
        setHasAccess(false)
      }
    } finally {
      setIsCheckingAccess(false)
    }
  }

  const handlePaymentSuccess = (email: string) => {
    // Store email for future access checks
    localStorage.setItem('userEmail', email)
    storeGuestEmail(email)
    localStorage.setItem('accessGrantedAt', Date.now().toString())

    // Close modal immediately
    setIsPaymentModalOpen(false)

    // Grant immediate access without additional checks
    setHasAccess(true)
    setDaysRemaining(30)
    setUserEmail(email)

    // Show success message
    toast.success('Payment successful! Your access is now active.')
  }

  const handleCloseModal = useCallback(() => {
    setIsPaymentModalOpen(false)
  }, [])

  if (hasAccess === null || isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-white relative">
          {/* Clean Header */}
          <div className="relative border-b border-gray-200 bg-white">
            <div className="max-w-5xl mx-auto px-8 py-16">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Restaurant Valuation Calculator
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Professional valuation tool for restaurant businesses. Get instant, accurate valuations based on industry standards.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative max-w-5xl mx-auto px-8 py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Left Column - Features */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">
                    Everything you need for accurate valuations
                  </h2>

                  <div className="space-y-5">
                    <Feature
                      title="Multiple Valuation Methods"
                      description="SDE, EBITDA, and Revenue multiples for comprehensive analysis"
                    />
                    <Feature
                      title="Industry Benchmarks"
                      description="Compare your metrics against restaurant industry standards"
                    />
                    <Feature
                      title="Professional Reports"
                      description="Download detailed PDF reports for presentations and clients"
                    />
                    <Feature
                      title="Real-time Calculations"
                      description="Instant results as you adjust your financial inputs"
                    />
                    <Feature
                      title="Save & Compare"
                      description="Store multiple valuations and track changes over time"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Hero Pricing Card */}
              <div className="lg:sticky lg:top-8">
                <div className="bg-gray-50 rounded-lg p-10 border-2 border-gray-200">
                  {/* Price Section */}
                  <div className="text-center mb-8">
                    <div className="mb-4">
                      <span className="text-7xl font-bold text-gray-900">$10</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-semibold text-gray-900">30 Days of Unlimited Access</p>
                      <p className="text-sm text-gray-600">One-time payment • No auto-renewal</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-8 h-14 text-lg font-semibold"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Get Instant Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                      <p className="text-base text-gray-700">Instant access after payment</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                      <p className="text-base text-gray-700">Works on all devices</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                      <p className="text-base text-gray-700">Professional PDF reports</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                      <p className="text-base text-gray-700">Save unlimited valuations</p>
                    </div>
                  </div>

                  {/* Trust Signals */}
                  <div className="pt-6 border-t border-gray-300">
                    <p className="text-xs text-center text-gray-500 mb-2">
                      Test mode active - Use card: 4242 4242 4242 4242
                    </p>
                    <p className="text-xs text-center text-gray-400">
                      Secure payment via Stripe
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleCloseModal}
          onSuccess={handlePaymentSuccess}
          calculatorType={calculatorType}
        />
      </>
    )
  }

  // User has access - show calculator without banner
  return (
    <div>
      {children}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        calculatorType={calculatorType}
      />
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Check className="w-3 h-3 text-white stroke-[2.5]" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1.5 text-base">{title}</h3>
        <p className="text-base text-gray-600">{description}</p>
      </div>
    </div>
  )
}