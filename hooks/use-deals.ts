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
  } | null
  pipeline: {
    id: string
    name: string
    is_default: boolean
  } | null
  stage: {
    id: string
    name: string
    color: string | null
    position: number
    is_won: boolean | null
    is_lost: boolean | null
  } | null
}

interface UseDealsOptions {
  pipelineId?: string
  stageId?: string
  contactId?: string
}

interface UseDealsReturn {
  deals: Deal[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

interface DealsApiResponse {
  data: Deal[]
}

export function useDeals(options: UseDealsOptions = {}): UseDealsReturn {
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0)

  const { pipelineId, stageId, contactId } = options

  const fetchDeals = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query params
      const params = new URLSearchParams()
      if (pipelineId) params.append('pipeline_id', pipelineId)
      if (stageId) params.append('stage_id', stageId)
      if (contactId) params.append('contact_id', contactId)

      const url = `/api/deals${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to fetch deals',
        }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: DealsApiResponse = await response.json()

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid response format from deals API')
      }

      setDeals(result.data)
      setError(null)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error('Unknown error occurred')
      setError(errorMessage)
      setDeals([])
    } finally {
      setIsLoading(false)
    }
  }, [pipelineId, stageId, contactId])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals, refetchTrigger])

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  return {
    deals,
    isLoading,
    error,
    refetch,
  }
}
