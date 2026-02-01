'use client'

import { useState, useEffect, useCallback } from 'react'
import type { KanbanStage, KanbanDeal } from '@/lib/types/kanban'

interface UseKanbanReturn {
  stages: KanbanStage[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  optimisticUpdate: (stageId: string, dealId: string, updates: Partial<KanbanDeal>) => void
}

interface KanbanApiResponse {
  data: KanbanStage[]
}

export function useKanban(pipelineId?: string): UseKanbanReturn {
  const [stages, setStages] = useState<KanbanStage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0)

  const fetchKanbanData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = pipelineId
        ? `/api/kanban?pipeline_id=${pipelineId}`
        : '/api/kanban'

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to fetch kanban data',
        }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: KanbanApiResponse = await response.json()

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid response format from kanban API')
      }

      const sortedStages = result.data.sort(
        (a, b) => a.position - b.position
      )

      setStages(sortedStages)
      setError(null)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error('Unknown error occurred')
      setError(errorMessage)
      setStages([])
    } finally {
      setIsLoading(false)
    }
  }, [pipelineId])

  useEffect(() => {
    fetchKanbanData()
  }, [fetchKanbanData, refetchTrigger])

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  const optimisticUpdate = useCallback(
    (stageId: string, dealId: string, updates: Partial<KanbanDeal>) => {
      setStages((currentStages) => {
        return currentStages.map((stage) => {
          if (stage.id !== stageId) return stage

          return {
            ...stage,
            deals: stage.deals.map((deal) => {
              if (deal.id !== dealId) return deal
              return { ...deal, ...updates }
            }),
          }
        })
      })
    },
    []
  )

  return {
    stages,
    isLoading,
    error,
    refetch,
    optimisticUpdate,
  }
}
