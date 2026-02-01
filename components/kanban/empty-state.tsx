import { Card } from '@/components/ui/card'
import { Inbox, Sparkles } from 'lucide-react'
import { NewDealDialog } from './new-deal-dialog'

interface EmptyStateProps {
  title: string
  description: string
  showAction?: boolean
}

export function EmptyState({
  title,
  description,
  showAction = false,
}: EmptyStateProps) {
  const Icon = showAction ? Sparkles : Inbox

  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card className="p-12 max-w-lg text-center border-dashed">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <Icon className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="font-semibold text-2xl mb-3 tracking-tight">{title}</h3>
        <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
          {description}
        </p>
        {showAction && (
          <div className="flex justify-center">
            <NewDealDialog />
          </div>
        )}
      </Card>
    </div>
  )
}
