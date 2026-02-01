'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { KanbanResponse, KanbanStage } from '@/lib/types/kanban'

interface UpdateDealStageParams {
  dealId: string
  newStageId: string
  currentStageId: string
  pipelineId?: string
}

interface CreateDealParams {
  title: string
  value?: number
  contact_id?: string
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dealId, newStageId }: UpdateDealStageParams) => {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage_id: newStageId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update deal')
      }

      return response.json()
    },
    onMutate: async ({ dealId, newStageId, currentStageId, pipelineId }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban', pipelineId] })

      const previousData = queryClient.getQueryData<KanbanResponse>([
        'kanban',
        pipelineId,
      ])

      queryClient.setQueryData<KanbanResponse>(
        ['kanban', pipelineId],
        (old) => {
          if (!old) return old

          const newStages = old.data.map((stage) => {
            if (stage.id === currentStageId) {
              return {
                ...stage,
                deals: stage.deals.filter((deal) => deal.id !== dealId),
              }
            }

            if (stage.id === newStageId) {
              const dealToMove = old.data
                .find((s) => s.id === currentStageId)
                ?.deals.find((d) => d.id === dealId)

              if (dealToMove) {
                return {
                  ...stage,
                  deals: [dealToMove, ...stage.deals],
                }
              }
            }

            return stage
          })

          return { data: newStages }
        }
      )

      return { previousData }
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['kanban', variables.pipelineId],
          context.previousData
        )
      }
      toast.error(error.message || 'Failed to update deal')
    },
    onSuccess: () => {
      toast.success('Deal updated successfully')
    },
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateDealParams) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create deal')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      toast.success('Deal created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create deal')
    },
  })
}
