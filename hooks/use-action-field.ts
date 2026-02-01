'use client'

import { useState } from 'react'
import type { EntityType } from '@/lib/permissions'

interface ExecuteActionOptions {
  entityType: EntityType
  entityId: string
  fieldName: string
  context?: Record<string, any>
}

interface ExecuteActionResult {
  success: boolean
  event_id?: string
  executed_at?: string
  error?: string
}

/**
 * Hook to execute action fields (buttons)
 * Handles loading state and error handling
 */
export function useActionField() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const execute = async ({
    entityType,
    entityId,
    fieldName,
    context,
  }: ExecuteActionOptions): Promise<ExecuteActionResult> => {
    setIsExecuting(true)
    setLastError(null)

    try {
      const endpoint =
        entityType === 'deal'
          ? `/api/deals/${entityId}/actions`
          : entityType === 'lead' || entityType === 'contact'
          ? `/api/leads/${entityId}/actions`
          : ''

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_name: fieldName,
          context,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const error = data.error || data.details || 'Action execution failed'
        setLastError(error)
        return {
          success: false,
          error,
        }
      }

      return {
        success: true,
        event_id: data.event_id,
        executed_at: data.executed_at,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsExecuting(false)
    }
  }

  const clearError = () => setLastError(null)

  return {
    execute,
    isExecuting,
    lastError,
    clearError,
  }
}
