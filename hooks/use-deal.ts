'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Deal {
  id: string
  title: string
  value: number | null
  status: string
  tenant_id: string
  pipeline_id: string
  stage_id: string
  contact_id: string | null
  assigned_to: string | null
  expected_close_date: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  custom_fields: Record<string, unknown> | null
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
    type: string
    status: string
  } | null
  pipeline: {
    id: string
    name: string
    is_default: boolean
    is_active: boolean
  } | null
  stage: {
    id: string
    name: string
    color: string | null
    position: number
    is_won: boolean | null
    is_lost: boolean | null
  } | null
  assigned_user: {
    id: string
    name: string
    email: string
  } | null
}

interface UseDealReturn {
  deal: Deal | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

interface DealApiResponse {
  data: Deal
}

export function useDeal(dealId: string | null): UseDealReturn {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0)

  const fetchDeal = useCallback(async () => {
    if (!dealId) {
      setDeal(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to fetch deal',
        }))

        if (response.status === 404) {
          throw new Error('Deal not found')
        }

        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: DealApiResponse = await response.json()

      if (!result.data) {
        throw new Error('Invalid response format from deal API')
      }

      setDeal(result.data)
      setError(null)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error('Unknown error occurred')
      setError(errorMessage)
      setDeal(null)
    } finally {
      setIsLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    fetchDeal()
  }, [fetchDeal, refetchTrigger])

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  return {
    deal,
    isLoading,
    error,
    refetch,
  }
}
