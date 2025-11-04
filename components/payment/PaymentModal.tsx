'use client'

import { useState } from 'react'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Lock, Shield, Check, CreditCard } from 'lucide-react'
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

        // Create access token immediately (works for local and production)
        await fetch('/api/activate-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            paymentIntentId: paymentIntent.id,
            calculatorType: calculatorType || 'valuation'
          })
        })

        // Store email for access checking
        localStorage.setItem('userEmail', email)

        toast.success('Your 30-day access has been activated!')

        setTimeout(() => {
          onSuccess(email)
          window.location.reload() // Reload to show calculator
        }, 2000)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Something went wrong. Please try again.')
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '10px 12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
        <p className="text-sm text-gray-600">Activating your access...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          We'll use this to track your access
        </p>
      </div>

      <div>
        <Label htmlFor="card">Card Information</Label>
        <div className="mt-1 p-3 border rounded-md">
          <CardElement id="card" options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Test mode: Use 4242 4242 4242 4242, any future date, any CVC
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">30-Day Calculator Access</span>
          <span className="text-xl font-bold text-blue-600">$10.00</span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
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
            Pay $10.00
          </>
        )}
      </Button>

      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <Lock className="h-3 w-3 mr-1" />
          Secure payment
        </div>
        <div className="flex items-center">
          <Shield className="h-3 w-3 mr-1" />
          Powered by Stripe
        </div>
      </div>
    </form>
  )
}

export default function PaymentModal({ isOpen, onClose, onSuccess, calculatorType }: PaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Unlock Restaurant Valuation Calculator</DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <PaymentForm
            onClose={onClose}
            onSuccess={onSuccess}
            calculatorType={calculatorType}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}