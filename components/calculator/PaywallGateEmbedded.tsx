'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calculator, Clock, FileText, Lock, Check, Shield, Star, TrendingUp } from 'lucide-react'
import PaymentModal from '@/components/payment/PaymentModal'
import { checkAccess, getGuestEmail } from '@/lib/access-control'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function PaywallGate({
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
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    checkUserAccess()

    // Handle legacy success params
    if (searchParams.get('success') === 'true' || searchParams.get('payment_success') === 'true') {
      toast.success('Payment successful! Your 30-day access is now active.')
      setTimeout(() => {
        checkUserAccess()
        router.push('/calculators/valuation')
      }, 1500)
    }

    if (searchParams.get('canceled') === 'true') {
      toast.error('Payment canceled. You can try again when you\'re ready.')
    }
  }, [searchParams])

  const checkUserAccess = async () => {
    // Check for user email from multiple sources
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    const email = user?.email ||
                  localStorage.getItem('userEmail') ||
                  getGuestEmail()

    setUserEmail(email)

    if (email) {
      const access = await checkAccess(email, calculatorType)
      setHasAccess(access.hasAccess)
      setDaysRemaining(access.daysRemaining)
    } else {
      setHasAccess(false)
    }
  }

  const handlePaymentSuccess = (email: string) => {
    setIsPaymentModalOpen(false)
    // Access will be checked on page reload
  }

  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-600">Checking access...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <Card className="overflow-hidden shadow-xl border-0">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                <div className="text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur mb-4">
                    <Lock className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold mb-2">
                    Restaurant Valuation Calculator
                  </h1>
                  <p className="text-lg opacity-90">
                    Professional valuation tool trusted by industry experts
                  </p>
                </div>
              </div>

              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center group">
                    <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calculator className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Instant Valuations</h3>
                    <p className="text-sm text-gray-600">
                      SDE, EBITDA & Revenue multiples
                    </p>
                  </div>
                  <div className="text-center group">
                    <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="h-7 w-7 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1">30-Day Access</h3>
                    <p className="text-sm text-gray-600">
                      Unlimited calculations & saves
                    </p>
                  </div>
                  <div className="text-center group">
                    <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="h-7 w-7 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-1">PDF Reports</h3>
                    <p className="text-sm text-gray-600">
                      Professional client presentations
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="bg-blue-600 text-white mb-2">LIMITED TIME OFFER</Badge>
                      <div className="text-3xl font-bold text-blue-600">$10</div>
                      <div className="text-gray-600">One-time payment</div>
                      <div className="text-sm text-gray-500">30 days of unlimited access</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">Trusted by 500+ restaurants</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg h-14"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Unlock Calculator Now - Pay Securely
                </Button>

                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-1" />
                    SSL Encrypted
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Powered by Stripe
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Instant Access
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <p className="text-center text-xs text-gray-500">
                    Test mode active • Use card: 4242 4242 4242 4242 • Any future date • Any 3-digit CVC
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          calculatorType={calculatorType}
        />
      </>
    )
  }

  // User has access
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  Extend Access
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
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