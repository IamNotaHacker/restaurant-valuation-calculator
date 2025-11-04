# Restaurant Valuation Calculator

A professional restaurant valuation calculator built for **Blue Orbit Restaurant Consulting**. This tool helps restaurant owners and consultants estimate restaurant market value based on financial performance metrics and industry benchmarks.

## Quick Start

```bash
# Clone repository
git clone [repository-url]
cd blue-orbit-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server with Turbopack
npm run dev

# Open http://localhost:3000
```

> **Note:** This project uses Next.js 16 with Turbopack for faster development builds.

## Features

- 📊 **Accurate Valuation Calculations** - Industry-standard formulas for restaurant valuation
- 📈 **Real-time Calculations** - Instant results as you adjust inputs
- 📄 **PDF Report Generation** - Professional reports with full calculation breakdown
- 💾 **Data Persistence** - Automatic saving to Supabase database
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎯 **Industry Benchmarks** - Visual indicators for healthy operating ranges
- 🏥 **Health Status Assessment** - Business health evaluation based on profit margins
- 💳 **Stripe Payment Integration** - 30-day access model with secure payment processing
- 🔐 **Access Control System** - Email-based access tokens for calculator usage
- 🤖 **Automatic Database Setup** - No manual SQL required, everything handled programmatically

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Modern web browser

## Installation

### 1. Clone the Repository

```bash
git clone [repository-url]
cd blue-orbit-mvp
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration (for payment processing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRODUCT_ID_VALUATION=your_stripe_product_id
```

### 4. Database Setup (Automatic)

**IMPORTANT: All database operations are handled automatically!**
- No manual SQL execution required
- Tables are created automatically when the app starts
- The app handles all database initialization programmatically
- Simply start the app and everything will be set up for you

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
blue-orbit-mvp/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── calculate/     # Save calculations endpoint
│   │   └── generate-pdf/  # PDF generation endpoint
│   ├── calculators/       # Calculator pages
│   │   └── valuation/     # Restaurant valuation calculator
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions and logic
│   ├── calculations.ts    # Core calculation logic
│   ├── validations.ts     # Input validation utilities
│   └── supabase/         # Supabase client configuration
├── public/               # Static assets
└── styles/               # Global styles
```

## Usage Guide

### Payment & Access Model

The application uses a **30-day access model**:
- **Price**: $10 for 30 days of unlimited calculator access
- **Payment**: Secure processing via Stripe (test mode available)
- **Access**: Email-based access tokens
- **Guest Checkout**: No account required, just provide email
- **Test Mode**: Currently configured with Stripe test keys for development

### Basic Calculation

1. Navigate to `/calculators/valuation`
2. If you don't have access, you'll see the payment option
3. Complete payment via Stripe (use test card: 4242 4242 4242 4242)
4. Enter your restaurant's financial data:
   - Annual Sales ($100k - $50M)
   - Food Cost % (15-60%)
   - Labor Cost % (15-50%)
   - Occupancy Cost % (3-20%)
   - Other Operating Expenses % (5-30%)
   - Owner Compensation ($0 - $1M)
   - Desired ROI % (10-50%)
5. View real-time calculation results
6. Download PDF report for detailed analysis

### Understanding Results

- **Estimated Value**: Market value based on cash flow and desired ROI
- **Gross Profit**: Revenue after food costs
- **Operating Profit**: Profit after all operating expenses
- **Cash Flow (SDE)**: Seller's Discretionary Earnings
- **Health Status**: Business health based on profit margins
  - Excellent: ≥15% margin
  - Good: 10-14% margin
  - Fair: 5-9% margin
  - Poor: <5% margin

## Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Testing the Calculator

Use these test values to verify calculations:
- Annual Sales: $1,200,000
- Food Cost: 32%
- Labor Cost: 30%
- Occupancy Cost: 10%
- Other Expenses: 15%
- Owner Compensation: $100,000
- Desired ROI: 25%

**Expected Result:** ~$1,624,000 estimated value

## API Documentation

### POST /api/calculate
Save a calculation to the database.

### GET /api/calculate?session_id=xxx&limit=10
Retrieve calculation history.

### POST /api/generate-pdf
Generate a PDF report from calculation data.

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

```bash
# Using Vercel CLI
vercel --prod
```

### Deploy to Other Platforms

The app is Next.js-based and can be deployed to:
- AWS Amplify
- Netlify
- Railway
- Render
- Self-hosted Node.js server

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Recent Updates (November 2025)

- ✅ Fixed API route imports for proper Supabase client usage
- ✅ Configured Next.js middleware for authentication flow
- ✅ Updated metadata with proper Blue Orbit branding
- ✅ Enabled TypeScript strict mode for better type safety
- ✅ Improved type definitions throughout the codebase
- ✅ Added proper middleware configuration for protected routes
- ✅ **Fixed Turbopack runtime error** - Resolved "Failed to write app endpoint" error by using middleware.ts instead of proxy.ts
- ✅ **Implemented Stripe Payment Integration** - Added 30-day access model with test mode support
- ✅ **Created Access Control System** - Email-based access tokens for calculator usage
- ✅ **Automatic Database Setup** - All database tables created programmatically on startup
- ✅ **Enhanced UI Design** - Professional gradients, animations, and improved logo rendering
- ✅ **Fixed Logo Flickering** - Dynamic imports with proper loading states
- ✅ **No Manual SQL Required** - Everything handled automatically by the application

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check if tables are created (run `supabase-init.sql`)
- Ensure RLS policies are enabled

### PDF Generation Issues
- Allow popups for the site
- Use Chrome/Edge for best PDF rendering
- Check browser console for errors

### Calculation Not Saving
- Check network tab for API errors
- Verify Supabase connection
- Ensure tables exist in database
- Verify middleware is properly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

Proprietary - Blue Orbit Restaurant Consulting

## Support

For support, email info@blueorbitconsulting.com or call (404) 375-1085

---

Built with ❤️ for Blue Orbit Restaurant Consulting