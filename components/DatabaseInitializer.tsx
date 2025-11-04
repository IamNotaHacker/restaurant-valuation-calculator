'use client'

import { useEffect } from 'react'

/**
 * This component automatically initializes the database on app startup
 * It runs completely in the background - no user action required!
 */
export function DatabaseInitializer() {
  useEffect(() => {
    const initDatabase = async () => {
      try {
        // Call the initialization API
        await fetch('/api/db-init', {
          method: 'GET',
        })
      } catch (error) {
        // Silent fail - will retry on next page load
      }
    }

    // Run initialization
    initDatabase()
  }, [])

  // This component doesn't render anything
  return null
}