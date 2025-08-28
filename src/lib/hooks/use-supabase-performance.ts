/**
 * Performance monitoring hook for Supabase client optimization
 * Helps track client usage and ensure we're using the singleton pattern correctly
 */

import { useEffect, useRef } from 'react'
import { useSupabaseClient } from './use-supabase-client'

interface PerformanceMetrics {
  clientCreationCount: number
  queriesPerformed: number
  averageQueryTime: number
  lastQueryTime?: number
}

// Global metrics store
const performanceMetrics: PerformanceMetrics = {
  clientCreationCount: 0,
  queriesPerformed: 0,
  averageQueryTime: 0,
}

/**
 * Hook to monitor Supabase client performance
 * This helps ensure we're properly using the singleton pattern
 */
export function useSupabasePerformance() {
  const client = useSupabaseClient()
  const queryStartTime = useRef<number>(0)

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return

    // Log performance metrics every 30 seconds
    const interval = setInterval(() => {
      // Performance monitoring disabled
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const trackQuery = {
    start: () => {
      queryStartTime.current = performance.now()
    },
    end: () => {
      if (queryStartTime.current) {
        const duration = performance.now() - queryStartTime.current
        performanceMetrics.queriesPerformed++
        performanceMetrics.lastQueryTime = duration
        
        // Update average
        performanceMetrics.averageQueryTime = 
          (performanceMetrics.averageQueryTime * (performanceMetrics.queriesPerformed - 1) + duration) / 
          performanceMetrics.queriesPerformed
      }
    }
  }

  return { 
    client, 
    trackQuery,
    metrics: performanceMetrics 
  }
}

/**
 * Log client creation (for monitoring)
 */
export function logClientCreation() {
  performanceMetrics.clientCreationCount++
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...performanceMetrics }
}
