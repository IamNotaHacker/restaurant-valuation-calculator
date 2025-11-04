'use client'

import { Suspense, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import PaywallGate from '@/components/calculator/PaywallGateModern'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { LoginModal } from '@/components/login-modal'

// Dynamically import the calculator component to avoid SSR issues
const ValuationCalculator = dynamic(
  () => import('./calculator-content'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <div className="animate-pulse text-lg text-gray-600">Loading calculator...</div>
      </div>
    )
  }
)

export default function ValuationCalculatorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setIsAuthenticated(false)
        setShowLoginModal(true)
      } else {
        setIsAuthenticated(true)
        setShowLoginModal(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = getSupabaseBrowserClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session) {
        setIsAuthenticated(false)
        setShowLoginModal(true)
      } else {
        setIsAuthenticated(true)
        setShowLoginModal(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <div className="animate-pulse text-lg text-gray-600">Checking authentication...</div>
      </div>
    )
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setShowLoginModal(true)
  }

  return (
    <>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          setIsAuthenticated(true)
          setShowLoginModal(false)
        }}
      />

      {isAuthenticated ? (
        <>
          {/* Sign Out Header */}
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <PaywallGate calculatorType="valuation">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
                <div className="animate-pulse text-lg text-gray-600">Loading calculator...</div>
              </div>
            }>
              <ValuationCalculator />
            </Suspense>
          </PaywallGate>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
          <div className="text-lg text-gray-600">Please sign in to access the calculator</div>
        </div>
      )}
    </>
  )
}