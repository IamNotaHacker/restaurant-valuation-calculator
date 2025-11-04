'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  redirectTo?: string
}

export function LoginModal({ open, onOpenChange, onSuccess, redirectTo }: LoginModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) throw signUpError

        if (data.user) {
          if (data.session) {
            // Successfully signed up and logged in
            onOpenChange(false)

            // Wait a bit for the session to be fully established
            await new Promise(resolve => setTimeout(resolve, 100))

            if (redirectTo) {
              router.push(redirectTo)
            } else {
              router.refresh()
            }

            onSuccess?.()
          } else {
            setError('Please check your email to confirm your account.')
          }
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.session) {
          // Successfully signed in
          onOpenChange(false)

          // Wait a bit for the session to be fully established
          await new Promise(resolve => setTimeout(resolve, 100))

          if (redirectTo) {
            router.push(redirectTo)
          } else {
            router.refresh()
          }

          onSuccess?.()
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEmail('')
      setPassword('')
      setError('')
      setIsSignUp(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Premium Header Section with Logo */}
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50/30 px-6 sm:px-8 pt-10 pb-6">
          <div className="flex justify-center mb-8">
            <div className="scale-[2.5] origin-center">
              <Logo />
            </div>
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-900 tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base text-gray-600 font-normal">
              {isSignUp
                ? 'Sign up to access the Valuation Calculator'
                : 'Sign in to access the Valuation Calculator'
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Section */}
        <div className="px-6 sm:px-8 py-6 sm:py-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-sm font-semibold text-gray-900">
                Email
              </Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="h-11 text-sm px-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-password" className="text-sm font-semibold text-gray-900">
                Password
              </Label>
              <Input
                id="modal-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="h-11 text-sm px-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-200 mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </Button>

            <div className="text-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                disabled={loading}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
