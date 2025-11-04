'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (email: string) => void
  calculatorType?: string
}

function PaymentForm({ onClose, onSuccess, calculatorType }: Omit<PaymentModalProps, 'isOpen'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !email) {
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          calculatorType: calculatorType || 'valuation'
        })
      })

      const { clientSecret, error: intentError } = await response.json()

      if (intentError) {
        toast.error(intentError)
        setIsProcessing(false)
        return
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            email: email,
          },
        },
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
        setIsProcessing(false)
      } else if (paymentIntent?.status === 'succeeded') {
        setSucceeded(true)

        // Create access token immediately
        const activateResponse = await fetch('/api/activate-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            paymentIntentId: paymentIntent.id,
            calculatorType: calculatorType || 'valuation'
          })
        })

        if (!activateResponse.ok) {
          console.error('Activation failed with status:', activateResponse.status)
          const errorData = await activateResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Activation error:', errorData)
          toast.error('Payment successful but access activation failed. Please contact support.')
          setSucceeded(false)
          setIsProcessing(false)
          return
        }

        const activateData = await activateResponse.json()

        if (activateData.success) {
          // Store email for access checking
          localStorage.setItem('userEmail', email)

          // Immediately trigger success callback
          onSuccess(email)

          // Show success message briefly then close
          setTimeout(() => {
            setSucceeded(false)
          }, 800)
        } else {
          toast.error('Payment successful but access activation failed. Please contact support.')
          setSucceeded(false)
          setIsProcessing(false)
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Something went wrong. Please try again.')
      setIsProcessing(false)
    }
  }

  const cardElementOptions = useMemo(() => ({
    style: {
      base: {
        fontSize: '15px',
        color: '#111827',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  }), [])

  if (succeeded) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-50 mx-auto">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful</h3>
        <p className="text-sm text-gray-600">Activating your access...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={handleEmailChange}
          required
          className="mt-1.5 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-500 mt-1.5">
          We'll use this to track your access
        </p>
      </div>

      <div>
        <Label htmlFor="card" className="text-gray-700 text-sm font-medium">
          Card Details
        </Label>
        <div className="mt-1.5 p-3 border border-gray-200 rounded-md focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
          <CardElement id="card" options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          Test card: 4242 4242 4242 4242, any future date, any CVC
        </p>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-600">30-Day Access</span>
          <span className="text-2xl font-semibold text-gray-900">$10</span>
        </div>

        <Button
          type="submit"
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11 font-medium"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay $10
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default function PaymentModalModern({ isOpen, onClose, onSuccess, calculatorType }: PaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-gray-200" showCloseButton={false}>
        <DialogTitle className="sr-only">Complete Payment</DialogTitle>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Complete Payment</h2>
        </div>
        <div className="px-6 py-6">
          <Elements stripe={stripePromise}>
            <PaymentForm
              onClose={onClose}
              onSuccess={onSuccess}
              calculatorType={calculatorType}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  )
}