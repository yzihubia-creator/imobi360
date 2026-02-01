'use client'

import { useState, useMemo } from 'react'
import { useKanban } from '@/hooks/use-kanban'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { KanbanSkeleton } from '@/components/kanban/kanban-skeleton'
import { EmptyState } from '@/components/kanban/empty-state'
import { NewDealDialog } from '@/components/kanban/new-deal-dialog'
import { DealDrawer } from '@/components/deals/deal-drawer'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import type { KanbanDeal } from '@/lib/types/kanban'

interface SelectedDeal {
  id: string
  title: string
  value: number | null
  status: string
  stageName: string
  pipelineName: string
  contact?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    type: string
  } | null
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<SelectedDeal | null>(null)
  const { stages, isLoading, error } = useKanban()

  const { filteredStages, hasResults, totalDeals } = useMemo(() => {
    if (!stages || stages.length === 0) {
      return { filteredStages: [], hasResults: true, totalDeals: 0 }
    }

    const totalDeals = stages.reduce(
      (sum, stage) => sum + stage.deals.length,
      0
    )

    if (!searchQuery.trim()) {
      return { filteredStages: stages, hasResults: true, totalDeals }
    }

    const query = searchQuery.toLowerCase()

    const filtered = stages.map((stage) => ({
      ...stage,
      deals: stage.deals.filter(
        (deal) =>
          deal.title.toLowerCase().includes(query) ||
          deal.contact?.name.toLowerCase().includes(query)
      ),
    }))

    const hasResults = filtered.some((stage) => stage.deals.length > 0)

    return { filteredStages: filtered, hasResults, totalDeals }
  }, [stages, searchQuery])

  const handleDealClick = (deal: KanbanDeal, stageName: string) => {
    setSelectedDeal({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      status: deal.status,
      stageName,
      pipelineName: 'Sales Pipeline',
      contact: deal.contact,
    })
  }

  const handleCloseDrawer = () => {
    setSelectedDeal(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 max-w-md">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg text-destructive">Error</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Failed to load pipeline data'}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search deals"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold hidden sm:block">
              Sales Pipeline
            </h1>
            <NewDealDialog />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <ScrollArea className="h-full">
            <div className="px-6 py-4">
              <KanbanSkeleton />
            </div>
          </ScrollArea>
        ) : filteredStages.length === 0 ? (
          <EmptyState
            title="No pipeline stages"
            description="Contact your administrator to set up pipeline stages."
          />
        ) : totalDeals === 0 && !searchQuery.trim() ? (
          <EmptyState
            title="Seu funil começa aqui"
            description="Crie seu primeiro negócio para acompanhar oportunidades e transformá-las em vendas."
            showAction
          />
        ) : !hasResults && searchQuery.trim() ? (
          <EmptyState
            title="No deals found"
            description={`No deals match "${searchQuery}". Try a different search term.`}
          />
        ) : (
          <ScrollArea className="h-full">
            <div className="px-6 py-4">
              <KanbanBoard
                stages={filteredStages}
                onDealClick={handleDealClick}
              />
            </div>
          </ScrollArea>
        )}
      </div>

      <DealDrawer
        open={!!selectedDeal}
        onOpenChange={(open) => !open && handleCloseDrawer()}
        deal={selectedDeal}
      />
    </div>
  )
}
