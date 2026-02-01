'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { KanbanStage, KanbanDeal } from '@/lib/types/kanban'
import { KanbanCard } from './kanban-card'
import { formatCurrency } from '@/lib/utils/format'
import { LayoutList } from 'lucide-react'

interface KanbanColumnProps {
  stage: KanbanStage
  onDealClick?: (deal: KanbanDeal, stageName: string) => void
}

export function KanbanColumn({ stage, onDealClick }: KanbanColumnProps) {
  const dealCount = stage.deals.length
  const totalValue = stage.deals.reduce((sum, deal) => {
    const value = deal.value ?? 0
    return sum + value
  }, 0)

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full flex flex-col min-h-[600px]">
        <CardHeader className="pb-3 px-4 pt-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {stage.color && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stage.color }}
                  aria-hidden="true"
                />
              )}
              <h3 className="font-semibold text-sm truncate">{stage.name}</h3>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span className="text-xs font-medium text-muted-foreground">
                {dealCount} {dealCount === 1 ? 'deal' : 'deals'}
              </span>
              {totalValue > 0 && (
                <span className="text-xs font-semibold">
                  {formatCurrency(totalValue)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-4 pb-4 pt-4 overflow-hidden">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-3">
              {stage.deals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="mb-3">
                    <LayoutList className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground/70 mb-1">
                    Nenhum deal aqui
                  </p>
                  <p className="text-xs text-muted-foreground/50 max-w-[200px]">
                    Novos negócios aparecerão neste estágio
                  </p>
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <KanbanCard
                    key={deal.id}
                    deal={deal}
                    onClick={() => onDealClick?.(deal, stage.name)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
