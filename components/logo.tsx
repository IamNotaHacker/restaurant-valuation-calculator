"use client"

import { useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import Lottie with no SSR to prevent hydration issues
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => null
})

export function Logo({ className = "", size = "normal" }: { className?: string; size?: "normal" | "large" }) {
  const [animationData, setAnimationData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Try to load the Lottie animation data
    fetch("/lottie/logo-main.json")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load")
        return response.json()
      })
      .then((data) => {
        setAnimationData(data)
        setIsLoading(false)
      })
      .catch(() => {
        setError(true)
        setIsLoading(false)
      })
  }, [])

  // Determine size based on prop
  const dimensions = size === "large"
    ? { width: 630, height: 180 }
    : { width: 140, height: 40 }

  // Show skeleton while loading
  if (error || isLoading || !animationData) {
    return (
      <div className={`flex items-center ${className}`}>
        <div
          style={dimensions}
          className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg opacity-0"
        />
      </div>
    )
  }

  // Render Lottie animation with fade-in
  return (
    <div className={`flex items-center ${className}`}>
      <Suspense fallback={null}>
        <div className="animate-in fade-in duration-300">
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={dimensions}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet'
            }}
          />
        </div>
      </Suspense>
    </div>
  )
}
