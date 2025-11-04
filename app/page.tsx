"use client"

import { useState } from "react"
import { Logo } from "@/components/layout/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { LoginModal } from "@/components/login-modal"

export default function Page() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        redirectTo="/calculators/valuation"
      />

      <div className="min-h-screen flex flex-col">
        {/* Full-screen Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
          {/* Subtle Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Minimal Gradient Accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-transparent" />

          {/* Content Container */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center flex-1 py-12 sm:py-16 md:py-20">
            {/* Logo at Top Center */}
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="scale-75 sm:scale-90 md:scale-100">
                <Logo size="large" />
              </div>
            </div>

            {/* Hero Content */}
            <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10">
              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-balance leading-[1.1] px-4">
                <span className="text-gray-900">
                  Restaurant Business
                </span>
                <br />
                <span className="text-blue-600">
                  Intelligence Tools
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 text-balance max-w-3xl mx-auto leading-relaxed px-4">
                Professional valuation and viability calculators designed specifically for the hospitality industry
              </p>

              {/* CTA Button */}
              <div className="flex justify-center pt-2 sm:pt-4 px-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 hover:bg-gray-50 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto w-full sm:w-auto"
                  onClick={() => setShowLoginModal(true)}
                >
                  Valuation Calculator <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

      {/* Calculator Cards Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 bg-white">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Powerful Analytics Tools
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Get instant insights and data-driven decisions for your restaurant business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {/* Valuation Calculator Card */}
          <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all">
            <CardHeader className="space-y-4">
              <div className="w-10 h-10 border-2 border-gray-900 rounded-lg flex items-center justify-center">
                <Calculator className="h-5 w-5 text-gray-900" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Valuation Calculator</CardTitle>
              <CardDescription className="text-base text-gray-600">
                Get an accurate market valuation using SDE, EBITDA, and revenue multiples with industry-specific adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  Multiple valuation methods
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  Industry benchmarks included
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  PDF report generation
                </li>
              </ul>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowLoginModal(true)}
              >
                Start Valuation <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Viability Calculator Card */}
          <Card className="relative border-2 border-gray-200">
            <div className="absolute inset-0 bg-white/50 rounded-lg z-10 flex items-center justify-center">
              <Badge className="text-base py-2 px-4 bg-orange-500 hover:bg-orange-500 text-white">
                Coming Q1 2025
              </Badge>
            </div>
            <CardHeader className="space-y-4">
              <div className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-400">Viability Calculator</CardTitle>
              <CardDescription className="text-base text-gray-400">
                Assess new restaurant potential with location analysis and success probability forecasting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-400">
                  <CheckCircle2 className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                  Location scoring algorithm
                </li>
                <li className="flex items-center text-sm text-gray-400">
                  <CheckCircle2 className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                  Competition analysis
                </li>
                <li className="flex items-center text-sm text-gray-400">
                  <CheckCircle2 className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                  5-year projections
                </li>
              </ul>
              <Button disabled className="w-full bg-gray-200 text-gray-500">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Blue Orbit Restaurant Consulting. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}
