"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { calculateValuation, validateInputs, INDUSTRY_BENCHMARKS } from "@/lib/calculations"
import type { CalculationInputs, CalculationResults, CalculationBreakdown } from "@/types/calculator.types"
import { formatCurrency, debounce, getSessionId } from "@/lib/validations"
import { Loader2 } from "lucide-react"

export default function ValuationCalculator() {
  const { toast } = useToast()
  const sessionId = useMemo(() => getSessionId(), [])
  const [activeTab, setActiveTab] = useState<'standard' | 'health'>('standard')

  const [inputs, setInputs] = useState<CalculationInputs>({
    annualSales: 1200000,
    foodCostPercent: 32,
    laborCostPercent: 30,
    occupancyCostPercent: 10,
    otherExpensesPercent: 15,
    ownerCompensation: 100000,
    desiredROI: 25,
  })

  const [results, setResults] = useState<CalculationResults | null>(null)
  const [breakdown, setBreakdown] = useState<CalculationBreakdown | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Calculate immediately for responsive UI
  useEffect(() => {
    const validation = validateInputs(inputs)
    setValidationErrors(validation.errors)

    // Always calculate, even with validation errors (for dynamic updates)
    const result = calculateValuation(inputs)
    setResults(result)
    setBreakdown(result.breakdown)
  }, [inputs])

  const handleDownloadPDF = useCallback(async () => {
    if (!results || validationErrors.length > 0) {
      toast({
        title: "Cannot Generate PDF",
        description: "Please fix validation errors first.",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingPDF(true)
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, results: { ...results, breakdown } })
      })

      if (response.ok) {
        const htmlContent = await response.text()

        // Create iframe to print without opening new tab
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        document.body.appendChild(iframe)

        const iframeDoc = iframe.contentWindow?.document
        if (iframeDoc) {
          iframeDoc.open()
          iframeDoc.write(htmlContent)
          iframeDoc.close()

          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()

          toast({ title: "PDF Report Ready", description: "Use the print dialog to save as PDF." })

          // Clean up iframe after printing
          setTimeout(() => {
            document.body.removeChild(iframe)
          }, 1000)
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" })
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [results, validationErrors, breakdown, inputs, toast])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch(e.key) {
          case 'p':
            e.preventDefault()
            handleDownloadPDF()
            break
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleDownloadPDF])

  // Calculate health score based on profit margin (updates with inputs)
  // Score: 0-100 where 100 = excellent profit margin (≥15%)
  const valuationScore = useMemo(() => {
    if (!results) return 0
    const profitMargin = results.profitMargin
    // Scale: Poor (<5%) = 0-35, Fair (5-10%) = 35-60, Good (10-15%) = 60-85, Excellent (≥15%) = 85-100
    if (profitMargin >= 15) return Math.min(100, 85 + (profitMargin - 15) * 2)
    if (profitMargin >= 10) return 60 + (profitMargin - 10) * 5
    if (profitMargin >= 5) return 35 + (profitMargin - 5) * 5
    return Math.max(0, profitMargin * 7)
  }, [results])

  const costData = [
    { label: 'Food', value: inputs.foodCostPercent, benchmark: INDUSTRY_BENCHMARKS.foodCost.min },
    { label: 'Labor', value: inputs.laborCostPercent, benchmark: INDUSTRY_BENCHMARKS.laborCost.min },
    { label: 'Occupancy', value: inputs.occupancyCostPercent, benchmark: INDUSTRY_BENCHMARKS.occupancyCost.min },
    { label: 'Other', value: inputs.otherExpensesPercent, benchmark: INDUSTRY_BENCHMARKS.otherExpenses.min },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-40 w-96 h-96 bg-purple-500/[0.015] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-black/[0.04] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:gap-8 w-full sm:w-auto">
              {/* Logo */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#0052E0] opacity-90" />
                <div className="hidden sm:block h-4 w-px bg-black/10" />
                <h1 className="text-xs sm:text-sm font-medium tracking-wide text-gray-700">
                  VALUATION PRO
                </h1>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center bg-gray-100/50 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setActiveTab('standard')}
                  className={`
                    px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                    ${activeTab === 'standard'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  Standard Valuation
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className={`
                    px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                    ${activeTab === 'health'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <span className="hidden sm:inline">Health Score Analysis</span>
                    <span className="sm:hidden">Health Score</span>
                    <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] sm:text-xs rounded-full font-semibold">
                      BONUS
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-[10px] tracking-wider text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Three Panel Layout - Responsive */}
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-88px)] relative">

        {/* LEFT PANEL - Inputs */}
        <div className="w-full lg:w-[35%] bg-[#FAFAFA] lg:border-r border-black/[0.04] p-4 sm:p-6 md:p-8 lg:p-10 lg:overflow-y-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/90 shadow-[0_4px_24px_0_rgba(31,38,135,0.04)] p-8">
            <div className="space-y-10">

              {/* Annual Sales Input */}
              <div className="space-y-3 group">
                <div className="flex items-center justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Annual Sales
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={inputs.annualSales.toLocaleString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '')
                    if (!isNaN(Number(value))) {
                      setInputs({ ...inputs, annualSales: Number(value) })
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => e.currentTarget.select()}
                  className="
                    w-full px-0 py-3
                    bg-transparent
                    border-b-2 border-gray-200
                    text-2xl font-light text-gray-900
                    transition-all duration-300
                    focus:outline-none focus:border-blue-500
                    placeholder:text-gray-300
                  "
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  USD
                </div>
              </div>
            </div>

            {/* Owner Compensation Input */}
            <div className="space-y-3 group">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Owner Compensation
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={inputs.ownerCompensation.toLocaleString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '')
                    if (!isNaN(Number(value))) {
                      setInputs({ ...inputs, ownerCompensation: Number(value) })
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => e.currentTarget.select()}
                  className="
                    w-full px-0 py-3
                    bg-transparent
                    border-b-2 border-gray-200
                    text-2xl font-light text-gray-900
                    transition-all duration-300
                    focus:outline-none focus:border-blue-500
                    placeholder:text-gray-300
                  "
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  Annual
                </div>
              </div>
            </div>

            {/* Food Cost Slider */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Food Cost
                </label>
                <div className="text-2xl font-light text-gray-900">
                  {inputs.foodCostPercent}
                  <span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
                </div>
              </div>

              <div className="relative">
                <div className="h-px bg-gray-200 relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-gray-400"
                    style={{ left: `${((INDUSTRY_BENCHMARKS.foodCost.min - 15) / (60 - 15)) * 100}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={15}
                  max={60}
                  value={inputs.foodCostPercent}
                  onChange={(e) => setInputs({ ...inputs, foodCostPercent: Number(e.target.value) })}
                  className="
                    absolute top-1/2 -translate-y-1/2 w-full
                    appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#0066FF]
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-200
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#0066FF]
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:duration-200
                    [&::-moz-range-thumb]:hover:scale-125
                  "
                />
              </div>
              <div className="text-sm text-gray-500 font-medium flex justify-between">
                <span>15%</span>
                <span>Benchmark: {INDUSTRY_BENCHMARKS.foodCost.min}-{INDUSTRY_BENCHMARKS.foodCost.max}%</span>
                <span>60%</span>
              </div>
            </div>

            {/* Labor Cost Slider */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Labor Cost
                </label>
                <div className="text-2xl font-light text-gray-900">
                  {inputs.laborCostPercent}
                  <span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
                </div>
              </div>

              <div className="relative">
                <div className="h-px bg-gray-200 relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-gray-400"
                    style={{ left: `${((INDUSTRY_BENCHMARKS.laborCost.min - 15) / (50 - 15)) * 100}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={15}
                  max={50}
                  value={inputs.laborCostPercent}
                  onChange={(e) => setInputs({ ...inputs, laborCostPercent: Number(e.target.value) })}
                  className="
                    absolute top-1/2 -translate-y-1/2 w-full
                    appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#0066FF]
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-200
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#0066FF]
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:duration-200
                    [&::-moz-range-thumb]:hover:scale-125
                  "
                />
              </div>
              <div className="text-sm text-gray-500 font-medium flex justify-between">
                <span>15%</span>
                <span>Benchmark: {INDUSTRY_BENCHMARKS.laborCost.min}-{INDUSTRY_BENCHMARKS.laborCost.max}%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Occupancy Cost Slider */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Occupancy Cost
                </label>
                <div className="text-2xl font-light text-gray-900">
                  {inputs.occupancyCostPercent}
                  <span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
                </div>
              </div>

              <div className="relative">
                <div className="h-px bg-gray-200 relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-gray-400"
                    style={{ left: `${((INDUSTRY_BENCHMARKS.occupancyCost.min - 3) / (20 - 3)) * 100}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={3}
                  max={20}
                  value={inputs.occupancyCostPercent}
                  onChange={(e) => setInputs({ ...inputs, occupancyCostPercent: Number(e.target.value) })}
                  className="
                    absolute top-1/2 -translate-y-1/2 w-full
                    appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#0066FF]
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-200
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#0066FF]
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:duration-200
                    [&::-moz-range-thumb]:hover:scale-125
                  "
                />
              </div>
              <div className="text-sm text-gray-500 font-medium flex justify-between">
                <span>3%</span>
                <span>Benchmark: {INDUSTRY_BENCHMARKS.occupancyCost.min}-{INDUSTRY_BENCHMARKS.occupancyCost.max}%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Other Expenses Slider */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Other Expenses
                </label>
                <div className="text-2xl font-light text-gray-900">
                  {inputs.otherExpensesPercent}
                  <span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
                </div>
              </div>

              <div className="relative">
                <div className="h-px bg-gray-200 relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-gray-400"
                    style={{ left: `${((INDUSTRY_BENCHMARKS.otherExpenses.min - 5) / (30 - 5)) * 100}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={5}
                  max={30}
                  value={inputs.otherExpensesPercent}
                  onChange={(e) => setInputs({ ...inputs, otherExpensesPercent: Number(e.target.value) })}
                  className="
                    absolute top-1/2 -translate-y-1/2 w-full
                    appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#0066FF]
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-200
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#0066FF]
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:duration-200
                    [&::-moz-range-thumb]:hover:scale-125
                  "
                />
              </div>
              <div className="text-sm text-gray-500 font-medium flex justify-between">
                <span>5%</span>
                <span>Benchmark: {INDUSTRY_BENCHMARKS.otherExpenses.min}-{INDUSTRY_BENCHMARKS.otherExpenses.max}%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Desired ROI Slider */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Desired ROI
                </label>
                <div className="text-2xl font-light text-gray-900">
                  {inputs.desiredROI}
                  <span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
                </div>
              </div>

              <div className="relative">
                <div className="h-px bg-gray-200" />

                <input
                  type="range"
                  min={10}
                  max={50}
                  value={inputs.desiredROI}
                  onChange={(e) => setInputs({ ...inputs, desiredROI: Number(e.target.value) })}
                  className="
                    absolute top-1/2 -translate-y-1/2 w-full
                    appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#0066FF]
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-200
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#0066FF]
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:duration-200
                    [&::-moz-range-thumb]:hover:scale-125
                  "
                />
              </div>
              <div className="text-sm text-gray-500 font-medium flex justify-between">
                <span>10%</span>
                <span>Expected Annual Return</span>
                <span>50%</span>
              </div>
            </div>
            </div>
          </div>

        </div>

        {/* CENTER PANEL - Visualization */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 lg:overflow-y-auto relative">
          {activeTab === 'standard' ? (
            /* STANDARD VALUATION VIEW */
            <div className="h-full flex flex-col relative">
              {/* Subtle background card */}
              <div className="absolute inset-0 bg-white/30 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]" />

              <div className="relative z-10 p-12">
                {/* Calculation Waterfall */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      Valuation Calculation Breakdown
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                  </div>

                  <div className="space-y-3">
                    {/* Annual Sales */}
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                      <span className="text-sm font-semibold text-gray-700">Annual Sales</span>
                      <span className="text-xl font-bold text-gray-900 tabular-nums">
                        ${(inputs.annualSales / 1000000).toFixed(2)}M
                      </span>
                    </div>

                    {/* Less Food Cost */}
                    <div className="flex items-center justify-between py-3 px-4 ml-6 border-l-3 border-red-200 bg-red-50/30 rounded-r-lg">
                      <span className="text-sm text-gray-600">Less: Food Cost <span className="text-xs text-gray-500">({inputs.foodCostPercent}%)</span></span>
                      <span className="text-sm text-red-600 font-semibold tabular-nums">
                        - ${((inputs.annualSales * inputs.foodCostPercent / 100) / 1000).toFixed(0)}k
                      </span>
                    </div>

                    {/* Gross Profit */}
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
                      <span className="text-sm font-semibold text-gray-700">= Gross Profit</span>
                      <span className="text-xl font-bold text-gray-900 tabular-nums">
                        ${results ? (results.grossProfit / 1000).toFixed(0) : '0'}k
                      </span>
                    </div>

                    {/* Less Operating Expenses */}
                    <div className="flex items-center justify-between py-3 px-4 ml-6 border-l-3 border-red-200 bg-red-50/30 rounded-r-lg">
                      <span className="text-sm text-gray-600">Less: Operating Expenses</span>
                      <span className="text-sm text-red-600 font-semibold tabular-nums">
                        - ${results ? ((results.grossProfit - results.operatingProfit) / 1000).toFixed(0) : '0'}k
                      </span>
                    </div>

                    {/* Operating Profit */}
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
                      <span className="text-sm font-semibold text-gray-700">= Operating Profit</span>
                      <span className="text-xl font-bold text-gray-900 tabular-nums">
                        ${results ? (results.operatingProfit / 1000).toFixed(0) : '0'}k
                      </span>
                    </div>

                    {/* Plus Owner Compensation */}
                    <div className="flex items-center justify-between py-3 px-4 ml-6 border-l-3 border-green-200 bg-green-50/30 rounded-r-lg">
                      <span className="text-sm text-gray-600">Plus: Owner Compensation</span>
                      <span className="text-sm text-green-600 font-semibold tabular-nums">
                        + ${(inputs.ownerCompensation / 1000).toFixed(0)}k
                      </span>
                    </div>

                    {/* Cash Flow (SDE) */}
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
                      <span className="text-sm font-semibold text-gray-700">= Cash Flow (SDE)</span>
                      <span className="text-xl font-bold text-gray-900 tabular-nums">
                        ${results ? (results.cashFlow / 1000).toFixed(0) : '0'}k
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* HEALTH SCORE VIEW */
            <div className="h-full flex flex-col relative">
              {/* Subtle background card */}
              <div className="absolute inset-0 bg-white/30 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]" />

              <div className="relative z-10 p-12">
                {/* Mini status indicator */}
                {results && (
                  <div className="mb-6 flex justify-center">
                    <div className="flex items-center space-x-6 px-4 py-2.5 bg-white/70 backdrop-blur-md rounded-full border border-white/80 shadow-sm">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          results.healthStatus === 'Excellent' ? 'bg-green-500' :
                          results.healthStatus === 'Good' ? 'bg-blue-500' :
                          results.healthStatus === 'Fair' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <span className="ml-2 text-xs font-medium text-gray-700">{results.healthStatus}</span>
                      </div>
                      <div className="h-4 w-px bg-gray-300" />
                      <div className="text-xs font-medium text-gray-600">
                        {results.profitMargin.toFixed(1)}% Margin
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Health Score */}
                <div className="mb-8">
                  <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-4 text-center">
                    Blue Orbit Valuation Health Score
                  </div>

                {/* Score with subtle background */}
                <div className="relative w-56 h-56 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-full" />

                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="rgba(0,0,0,0.05)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="url(#enhanced-gradient)"
                      strokeWidth="2"
                      strokeDasharray={`${valuationScore * 6.28} 628`}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="enhanced-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0066FF" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#0066FF" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#0066FF" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-extralight text-gray-900">
                      {Math.round(valuationScore)}
                    </div>
                    <div className="text-xs font-medium text-gray-500 mt-1">
                      of 100
                    </div>
                  </div>
                </div>
              </div>

                {/* Enhanced bar chart */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    Cost Structure Analysis
                  </div>

                  <div className="space-y-4 p-5 bg-white/50 backdrop-blur-sm rounded-xl border border-white/70 shadow-[0_4px_24px_0_rgba(31,38,135,0.04)]">
                    {costData.map((item, i) => (
                      <div key={i} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">
                            {item.label}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500 font-medium">
                              Industry: {item.benchmark}%
                            </span>
                            <span className="text-base font-semibold text-gray-900">
                              {item.value}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-gray-100/80 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-500 z-10"
                            style={{ left: `${item.benchmark}%` }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.value}%`,
                              background: `linear-gradient(90deg, rgba(0,102,255,0.3) 0%, rgba(0,102,255,0.6) 100%)`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Results */}
        <div className="w-full lg:w-[25%] bg-[#FAFAFA] lg:border-l border-black/[0.04] p-4 sm:p-6 md:p-8 lg:p-10 lg:overflow-y-auto">
          <div className="h-full flex flex-col">

            {/* Enhanced primary value card */}
            <div className="flex-1">
              <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white/70 backdrop-blur-md rounded-2xl border border-white/90 shadow-[0_12px_40px_0_rgba(0,102,255,0.1)] mb-8">
                <div className="text-xs font-semibold tracking-wider text-gray-600 uppercase mb-3">
                  Estimated Value
                </div>

                <div className="relative">
                  <div className="text-6xl font-extralight tracking-tight text-gray-900 value-change">
                    ${results ? (results.estimatedValue / 1000000).toFixed(2) : '0.00'}
                    <span className="text-2xl font-light text-gray-400 ml-1">M</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-black/[0.05]">
                  <div className="text-sm font-medium text-gray-600">
                    {results ? formatCurrency(results.estimatedValue) : '$0'} USD
                  </div>
                  <div className="text-xs text-gray-700 mt-1 font-medium">
                    At {inputs.desiredROI}% ROI
                  </div>
                </div>
              </div>

              {/* Output Stats - Matching Reference Document */}
              {results && (
                <div className="space-y-3">
                  {/* Gross Profit */}
                  <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/80 shadow-[0_2px_16px_0_rgba(31,38,135,0.04)] hover:bg-white/60 hover:shadow-[0_4px_20px_0_rgba(31,38,135,0.06)] hover:border-white/90 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700">
                        Gross Profit
                      </div>
                      <div className="text-xl font-semibold text-gray-900">
                        ${results.grossProfit.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Operating Profit */}
                  <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/80 shadow-[0_2px_16px_0_rgba(31,38,135,0.04)] hover:bg-white/60 hover:shadow-[0_4px_20px_0_rgba(31,38,135,0.06)] hover:border-white/90 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700">
                        Operating Profit
                      </div>
                      <div className="text-xl font-semibold text-gray-900">
                        ${Math.round(results.operatingProfit).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow */}
                  <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/80 shadow-[0_2px_16px_0_rgba(31,38,135,0.04)] hover:bg-white/60 hover:shadow-[0_4px_20px_0_rgba(31,38,135,0.06)] hover:border-white/90 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700">
                        Cash Flow
                      </div>
                      <div className="text-xl font-semibold text-gray-900">
                        ${Math.round(results.cashFlow).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* ROI */}
                  <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/80 shadow-[0_2px_16px_0_rgba(31,38,135,0.04)] hover:bg-white/60 hover:shadow-[0_4px_20px_0_rgba(31,38,135,0.06)] hover:border-white/90 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700">
                        ROI
                      </div>
                      <div className="text-xl font-semibold text-gray-900">
                        {inputs.desiredROI}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced CTA button */}
            <div className="space-y-4 pt-6">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF || !results}
                className="
                  relative w-full py-4
                  bg-[#0066FF]
                  text-white text-sm font-medium tracking-wide
                  rounded-xl
                  transition-all duration-300
                  hover:bg-[#0052E0]
                  hover:shadow-xl hover:shadow-blue-500/25
                  hover:-translate-y-0.5
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                ">
                {isGeneratingPDF ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">GENERATE REPORT</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span>PDF</span>
                <span>•</span>
                <span>XLSX</span>
                <span>•</span>
                <span>Share Link</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
