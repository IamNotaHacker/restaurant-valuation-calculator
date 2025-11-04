import { NextResponse } from 'next/server'
import { ensureDatabaseSetup } from '@/lib/database/auto-setup'

/**
 * API endpoint for automatic database initialization
 * This runs automatically - no manual intervention needed!
 */
export async function GET() {
  try {
    const success = await ensureDatabaseSetup()

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database initialization pending - environment variables may be loading'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}