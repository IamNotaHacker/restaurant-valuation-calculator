import { NextRequest, NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper function to format percentage
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// Generate HTML report
function generateHTMLReport(inputs: any, results: any, logoBase64: string): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restaurant Valuation Report</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }

    @media print {
      /* Hide browser-generated headers/footers */
      @page {
        margin-top: 0.75in;
        margin-bottom: 0.75in;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1A1A1A;
      background: #FAFAFA;
    }

    .header {
      background: white;
      border-bottom: 2px solid #f1f5f9;
      padding: 30px 50px;
      margin-bottom: 40px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 25px;
    }

    .logo-container {
      display: flex;
      align-items: center;
    }

    .logo-img {
      height: 60px;
      width: auto;
    }

    .report-info {
      text-align: right;
    }

    .report-date {
      color: #475569;
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .report-id {
      color: #94a3b8;
      font-size: 9pt;
      font-weight: 500;
    }

    h1 {
      font-size: 28pt;
      color: #0f172a;
      margin-bottom: 6px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .report-subtitle {
      font-size: 11pt;
      color: #64748b;
      font-weight: 500;
    }

    h2 {
      font-size: 12pt;
      color: #1A1A1A;
      margin-top: 25px;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      font-size: 10pt;
    }

    .executive-summary {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      color: #1A1A1A;
      padding: 35px;
      border-radius: 12px;
      margin-bottom: 30px;
    }

    .valuation-amount {
      font-size: 44pt;
      font-weight: 300;
      margin: 12px 0;
      letter-spacing: -0.03em;
      color: #0f172a;
    }

    .summary-label {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 25px 0;
    }

    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px;
      background: white;
    }

    .metric-label {
      font-size: 8pt;
      color: #64748b;
      margin-bottom: 6px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 16pt;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    th, td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
    }

    th {
      background: #f8fafc;
      font-weight: 700;
      color: #64748b;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    td {
      color: #0f172a;
      font-size: 10pt;
    }

    .input-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .input-label {
      color: #6b7280;
    }

    .input-value {
      font-weight: 600;
      color: #1e293b;
    }

    .health-status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 12pt;
      margin: 10px 0;
    }

    .health-excellent {
      background: #10b981;
      color: white;
    }

    .health-good {
      background: #3b82f6;
      color: white;
    }

    .health-fair {
      background: #f59e0b;
      color: white;
    }

    .health-poor {
      background: #ef4444;
      color: white;
    }

    .calculation-breakdown {
      background: white;
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 12px;
      padding: 25px;
      margin: 20px 0;
      box-shadow: 0 2px 16px 0 rgba(31, 38, 135, 0.04);
    }

    .formula-step {
      margin: 12px 0;
      padding: 15px;
      background: #FAFAFA;
      border-left: 3px solid #0066FF;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10pt;
      border-radius: 6px;
    }

    .disclaimer {
      margin-top: 35px;
      padding: 18px 22px;
      background: #fef9f5;
      border-left: 3px solid #fb923c;
      border-radius: 8px;
      font-size: 8.5pt;
      color: #78350f;
      line-height: 1.5;
    }

    .disclaimer-title {
      font-weight: 700;
      margin-bottom: 8px;
      color: #9a3412;
      font-size: 9pt;
      letter-spacing: 0.05em;
    }

    .footer {
      margin-top: 35px;
      padding-top: 18px;
      border-top: 2px solid #f1f5f9;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }

    .page-break {
      page-break-after: always;
    }

    @media print {
      .executive-summary {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo-container">
        <img src="data:image/png;base64,${logoBase64}" alt="Blue Orbit Restaurant Consulting" class="logo-img">
      </div>
      <div class="report-info">
        <div class="report-date">${currentDate}</div>
        <div class="report-id">Report ID: VO-${Date.now().toString().slice(-6)}</div>
      </div>
    </div>
    <h1>Restaurant Valuation Report</h1>
    <p class="report-subtitle">Professional Business Valuation Analysis</p>
  </div>

  <div class="executive-summary">
    <div class="summary-label">ESTIMATED RESTAURANT VALUE</div>
    <div class="valuation-amount">${formatCurrency(results.estimatedValue)}</div>
    <div style="margin-top: 15px; color: #4A5568; font-weight: 500;">
      Based on ${formatCurrency(inputs.annualSales)} in annual sales at ${formatPercent(inputs.desiredROI)} ROI
    </div>
  </div>

  <h2>Key Financial Metrics</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">ANNUAL SALES</div>
      <div class="metric-value">${formatCurrency(inputs.annualSales)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">GROSS PROFIT</div>
      <div class="metric-value">${formatCurrency(results.grossProfit)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">OPERATING PROFIT</div>
      <div class="metric-value">${formatCurrency(results.operatingProfit)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">CASH FLOW (SDE)</div>
      <div class="metric-value">${formatCurrency(results.cashFlow)}</div>
    </div>
  </div>

  <div class="page-break"></div>

  <h2>Cost Breakdown Analysis</h2>
  <table>
    <thead>
      <tr>
        <th>Expense Category</th>
        <th>Percentage</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Food Cost</td>
        <td>${formatPercent(inputs.foodCostPercent)}</td>
        <td>${formatCurrency(results.breakdown.foodCost)}</td>
      </tr>
      <tr>
        <td>Labor Cost</td>
        <td>${formatPercent(inputs.laborCostPercent)}</td>
        <td>${formatCurrency(results.breakdown.laborCost)}</td>
      </tr>
      <tr>
        <td>Occupancy Cost</td>
        <td>${formatPercent(inputs.occupancyCostPercent)}</td>
        <td>${formatCurrency(results.breakdown.occupancyCost)}</td>
      </tr>
      <tr>
        <td>Other Operating Expenses</td>
        <td>${formatPercent(inputs.otherExpensesPercent)}</td>
        <td>${formatCurrency(results.breakdown.otherExpenses)}</td>
      </tr>
      <tr style="font-weight: bold; background: #f3f4f6;">
        <td>Total Expenses</td>
        <td>${formatPercent((results.breakdown.foodCost + results.breakdown.totalOperatingExpenses) / inputs.annualSales * 100)}</td>
        <td>${formatCurrency(results.breakdown.foodCost + results.breakdown.totalOperatingExpenses)}</td>
      </tr>
    </tbody>
  </table>

  <div class="disclaimer">
    <div class="disclaimer-title">IMPORTANT DISCLAIMER</div>
    <p>This valuation report is provided for informational purposes only and should not be considered as professional financial advice. The estimated value is based on simplified calculations and industry averages that may not reflect the unique circumstances of your specific restaurant.</p>
    <p style="margin-top: 10px;">Actual restaurant valuations require comprehensive analysis including:</p>
    <ul style="margin-left: 20px; margin-top: 10px;">
      <li>Detailed financial statement review (3-5 years)</li>
      <li>Market and location analysis</li>
      <li>Asset and equipment valuation</li>
      <li>Lease terms and transferability</li>
      <li>Brand value and customer loyalty assessment</li>
      <li>Competition and market trends analysis</li>
    </ul>
    <p style="margin-top: 10px;">For a professional valuation, please consult with Blue Orbit Restaurant Consulting or a qualified business valuation specialist.</p>
  </div>

  <div class="footer">
    <p><strong>Blue Orbit Restaurant Consulting</strong></p>
    <p style="margin-top: 5px;">© ${new Date().getFullYear()} All rights reserved.</p>
  </div>
</body>
</html>
  `

  return html
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inputs, results } = body

    if (!inputs || !results) {
      return NextResponse.json(
        { error: "Missing required data for PDF generation" },
        { status: 400 }
      )
    }

    // Read and encode the logo
    const logoPath = join(process.cwd(), "blueorbit.png")
    const logoBuffer = readFileSync(logoPath)
    const logoBase64 = logoBuffer.toString("base64")

    // Generate HTML report
    const htmlContent = generateHTMLReport(inputs, results, logoBase64)

    // For the MVP, we'll return the HTML and let the client handle the PDF conversion
    // In production, you would use a library like Puppeteer or a PDF service
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="restaurant-valuation-${Date.now()}.html"`,
      },
    })

  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    )
  }
}

// GET endpoint to return PDF generation instructions
export async function GET() {
  return NextResponse.json({
    message: "PDF Generation Endpoint",
    instructions: "POST to this endpoint with inputs and results to generate a PDF report",
    example: {
      inputs: {
        annualSales: 1200000,
        foodCostPercent: 32,
        laborCostPercent: 30,
        occupancyCostPercent: 10,
        otherExpensesPercent: 15,
        ownerCompensation: 100000,
        desiredROI: 25
      },
      results: {
        grossProfit: 816000,
        operatingProfit: 156000,
        cashFlow: 256000,
        estimatedValue: 1024000,
        healthStatus: "Good",
        profitMargin: 13,
        breakdown: {
          foodCost: 384000,
          laborCost: 360000,
          occupancyCost: 120000,
          otherExpenses: 180000,
          totalOperatingExpenses: 660000
        }
      }
    }
  })
}