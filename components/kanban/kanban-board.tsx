'use client'

import type { KanbanStage, KanbanDeal } from '@/lib/types/kanban'
import { KanbanColumn } from './kanban-column'

interface KanbanBoardProps {
  stages: KanbanStage[]
  onDealClick?: (deal: KanbanDeal, stageName: string) => void
}

export function KanbanBoard({ stages, onDealClick }: KanbanBoardProps) {
  if (!stages || stages.length === 0) {
    return null
  }

  return (
    <div className="flex gap-6 pb-6 overflow-x-auto">
      {stages.map((stage) => (
        <KanbanColumn key={stage.id} stage={stage} onDealClick={onDealClick} />
      ))}
    </div>
  )
}
