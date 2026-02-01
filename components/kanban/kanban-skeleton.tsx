import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function KanbanSkeleton() {
  return (
    <div className="flex gap-6 pb-6 overflow-x-auto">
      {Array.from({ length: 4 }).map((_, columnIndex) => (
        <div key={columnIndex} className="flex-shrink-0 w-80">
          <Card className="h-full flex flex-col min-h-[600px]">
            {/* Header Skeleton */}
            <CardHeader className="pb-3 px-4 pt-4 border-b">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            </CardHeader>

            {/* Cards Skeleton */}
            <CardContent className="flex-1 px-4 pb-4 pt-4">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, cardIndex) => (
                  <Card key={cardIndex}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* Title skeleton - 2 lines */}
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3.5 w-3/4" />
                        </div>

                        {/* Value skeleton */}
                        <Skeleton className="h-5 w-24" />

                        {/* Contact skeleton */}
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
