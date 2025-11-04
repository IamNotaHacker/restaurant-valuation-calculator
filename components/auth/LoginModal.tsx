'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Dynamically import Logo to avoid SSR issues
const Logo = dynamic(() => import('@/components/logo').then(mod => mod.Logo), {
  ssr: false,
  loading: () => <div className="h-10 w-32 bg-gray-100 animate-pulse rounded" />
})

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
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

            router.refresh()
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

          router.refresh()
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
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSignUp
              ? 'Sign up to access the Valuation Calculator'
              : 'Sign in to access the Valuation Calculator'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password">Password</Label>
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
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              isSignUp ? 'Create account' : 'Sign in'
            )}
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
