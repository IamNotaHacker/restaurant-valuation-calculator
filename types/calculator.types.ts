/**
 * TypeScript type definitions for Restaurant Valuation Calculator
 */

export interface CalculationInputs {
  annualSales: number
  foodCostPercent: number
  laborCostPercent: number
  occupancyCostPercent: number
  otherExpensesPercent: number
  ownerCompensation: number
  desiredROI: number
}

export interface CalculationResults {
  grossProfit: number
  operatingProfit: number
  cashFlow: number
  estimatedValue: number
  desiredROIValue: number
  healthStatus: "Excellent" | "Good" | "Fair" | "Poor"
  profitMargin: number
}

export interface CalculationBreakdown {
  foodCost: number
  laborCost: number
  occupancyCost: number
  otherExpenses: number
  totalOperatingExpenses: number
}

export type HealthStatus = "Excellent" | "Good" | "Fair" | "Poor"
