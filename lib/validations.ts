/**
 * Input validation and formatting utilities for the Restaurant Valuation Calculator
 *
 * This module provides helper functions for:
 * - Number and currency formatting (locale-aware display)
 * - Input parsing and validation
 * - User session management
 * - Debounced input handling
 */

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Formats a number as US currency without decimal places
 *
 * Uses the Intl.NumberFormat API for locale-aware currency formatting.
 * Output format: $1,234,567
 *
 * @param value - Numeric value to format as currency
 * @returns Formatted currency string with dollar sign and commas
 *
 * @example
 * ```typescript
 * formatCurrency(1234567)  // Returns: "$1,234,567"
 * formatCurrency(100.75)   // Returns: "$101"
 * ```
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats a number with comma separators (no currency symbol)
 *
 * @param value - Numeric value to format
 * @returns Formatted number string with thousand separators
 *
 * @example
 * ```typescript
 * formatNumber(1234567)  // Returns: "1,234,567"
 * ```
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats a number as a percentage with configurable decimal places
 *
 * @param value - Numeric value to format (e.g., 32 for 32%)
 * @param decimals - Number of decimal places to display (default: 1)
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercent(32.5)      // Returns: "32.5%"
 * formatPercent(32.567, 2) // Returns: "32.57%"
 * ```
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

// ============================================
// PARSING UTILITIES
// ============================================

/**
 * Parses a currency string into a numeric value
 *
 * Strips currency symbols ($), commas, and whitespace before parsing.
 * Returns 0 for invalid input instead of NaN.
 *
 * @param value - Currency string to parse (e.g., "$1,234.56")
 * @returns Numeric value or 0 if parsing fails
 *
 * @example
 * ```typescript
 * parseCurrency("$1,234.56")  // Returns: 1234.56
 * parseCurrency("1234")       // Returns: 1234
 * parseCurrency("invalid")    // Returns: 0
 * ```
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[$,\s]/g, "")
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

// ============================================
// NUMERIC UTILITIES
// ============================================

/**
 * Clamps a numeric value between a minimum and maximum bound
 *
 * Ensures the returned value is always within the specified range.
 * Useful for enforcing input constraints.
 *
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Value constrained between min and max
 *
 * @example
 * ```typescript
 * clamp(150, 0, 100)   // Returns: 100
 * clamp(-10, 0, 100)   // Returns: 0
 * clamp(50, 0, 100)    // Returns: 50
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

/**
 * Creates a debounced version of a function that delays execution
 *
 * Useful for optimizing expensive operations triggered by rapid user input.
 * The function will only execute after the user stops typing for the specified delay.
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds before executing function
 * @returns Debounced function that can be called immediately but executes later
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   performExpensiveSearch(query)
 * }, 300)
 *
 * // User types "restaurant" - function only executes once after they stop typing
 * debouncedSearch("r")
 * debouncedSearch("re")
 * debouncedSearch("res")
 * debouncedSearch("restaurant")  // Only this triggers the actual function after 300ms
 * ```
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// ============================================
// EMAIL VALIDATION & SANITIZATION
// ============================================

/**
 * Validates email format using RFC 5322 compliant regex
 *
 * Checks for valid email structure including:
 * - Local part (before @)
 * - @ symbol
 * - Domain part with valid TLD
 *
 * @param email - Email address to validate
 * @returns True if email format is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidEmail("user@example.com")    // Returns: true
 * isValidEmail("invalid.email")       // Returns: false
 * isValidEmail("user@@example.com")   // Returns: false
 * ```
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitizes email address by trimming whitespace and converting to lowercase
 *
 * Email addresses are case-insensitive per RFC 5321, so normalization
 * prevents duplicate accounts (User@Example.com vs user@example.com)
 *
 * @param email - Email address to sanitize
 * @returns Sanitized email in lowercase without whitespace
 * @throws Error if email format is invalid
 *
 * @example
 * ```typescript
 * sanitizeEmail("  User@Example.COM  ")  // Returns: "user@example.com"
 * sanitizeEmail("test@test.com")         // Returns: "test@test.com"
 * sanitizeEmail("invalid")               // Throws: Error
 * ```
 */
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()

  if (!isValidEmail(trimmed)) {
    throw new Error('Invalid email format')
  }

  return trimmed
}

/**
 * Validates and sanitizes email address in one step
 *
 * Convenience function that combines validation and sanitization.
 * Returns sanitized email or null if invalid.
 *
 * @param email - Email address to process
 * @returns Sanitized email string or null if invalid
 *
 * @example
 * ```typescript
 * validateAndSanitizeEmail("User@Example.com")  // Returns: "user@example.com"
 * validateAndSanitizeEmail("invalid")           // Returns: null
 * ```
 */
export function validateAndSanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null

  try {
    return sanitizeEmail(email)
  } catch {
    return null
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Generates a unique session identifier for tracking anonymous users
 *
 * Creates an ID using timestamp and random string for uniqueness.
 * Format: [timestamp-in-base36]-[random-string]
 *
 * @returns Unique session ID string
 *
 * @example
 * ```typescript
 * generateSessionId()  // Returns: "l8x9k2m-a7b3c9d"
 * ```
 *
 * @internal This is typically called by getSessionId() automatically
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const randomString = Math.random().toString(36).substring(2, 9)
  return `${timestamp}-${randomString}`
}

/**
 * Retrieves or creates a session ID for the current user
 *
 * Manages session persistence using localStorage:
 * - Returns existing session ID if found
 * - Creates and stores new session ID if not found
 * - Returns empty string on server-side (no window object)
 *
 * Session IDs are used to track calculations and user behavior across page reloads
 * without requiring authentication.
 *
 * @returns Session ID string or empty string on server-side
 *
 * @example
 * ```typescript
 * const sessionId = getSessionId()
 * // First call: generates and stores "l8x9k2m-a7b3c9d"
 * // Subsequent calls: returns same "l8x9k2m-a7b3c9d"
 * ```
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return ""

  const storageKey = "valuation-session-id"
  let sessionId = localStorage.getItem(storageKey)

  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(storageKey, sessionId)
  }

  return sessionId
}
