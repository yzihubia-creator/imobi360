'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { KanbanDeal } from '@/lib/types/kanban'
import { formatCurrency } from '@/lib/utils/format'
import { User } from 'lucide-react'

interface KanbanCardProps {
  deal: KanbanDeal
  onClick?: () => void
}

export function KanbanCard({ deal, onClick }: KanbanCardProps) {
  return (
    <Card
      className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">
            {deal.title}
          </h4>

          {deal.value !== null && (
            <p className="text-base font-semibold text-primary">
              {formatCurrency(deal.value)}
            </p>
          )}

          {deal.contact && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{deal.contact.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
