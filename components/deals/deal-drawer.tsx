'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils/format'
import { AuditLog } from '@/components/shared/audit-log'
import {
  User,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  History,
} from 'lucide-react'

export interface DealDrawerDeal {
  id: string
  title: string
  value: number | null
  status: string
  contact?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    type: string
  } | null
  stageName?: string
  pipelineName?: string
}

export interface DealDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal: DealDrawerDeal | null
}

function DealOverview({ deal }: { deal: DealDrawerDeal }) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won':
        return 'default'
      case 'lost':
        return 'destructive'
      case 'open':
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Value & Status */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Deal Value
        </h4>
        <div className="flex items-center gap-3 p-5 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex-1">
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(deal.value)}
            </div>
          </div>
          <Badge variant={getStatusVariant(deal.status)} className="text-xs">
            {deal.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contact
        </h4>
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {deal.contact?.name || 'No contact'}
            </p>
            {deal.contact?.email && (
              <p className="text-xs text-muted-foreground truncate">
                {deal.contact.email}
              </p>
            )}
            {deal.contact?.phone && (
              <p className="text-xs text-muted-foreground">
                {deal.contact.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Pipeline & Stage */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pipeline & Stage
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Pipeline</p>
              <p className="text-sm font-medium">
                {deal.pipelineName || 'Default Pipeline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Stage</p>
              <p className="text-sm font-medium">
                {deal.stageName || 'Unknown Stage'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Status */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Current Status
        </h4>
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium capitalize">{deal.status}</p>
            <p className="text-xs text-muted-foreground">
              Deal is currently {deal.status.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActivityItem {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note'
  title: string
  description: string
  timestamp: string
  actor?: string
}

function DealActivity() {
  // Mock data - will be replaced with real data from backend
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'note',
      title: 'Added internal note',
      description: 'Client is interested in premium tier',
      timestamp: '2 hours ago',
      actor: 'John Silva',
    },
    {
      id: '2',
      type: 'meeting',
      title: 'Meeting scheduled',
      description: 'Product demo on Friday at 2:00 PM',
      timestamp: '1 day ago',
      actor: 'Sarah Costa',
    },
    {
      id: '3',
      type: 'email',
      title: 'Email sent',
      description: 'Sent proposal and pricing details',
      timestamp: '2 days ago',
      actor: 'John Silva',
    },
    {
      id: '4',
      type: 'call',
      title: 'Phone call',
      description: 'Discussed requirements and timeline',
      timestamp: '3 days ago',
      actor: 'Sarah Costa',
    },
    {
      id: '5',
      type: 'note',
      title: 'Deal created',
      description: 'Initial contact from website form',
      timestamp: '5 days ago',
      actor: 'System',
    },
  ]

  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconClass = 'h-4 w-4'
    switch (type) {
      case 'call':
        return <Phone className={iconClass} />
      case 'email':
        return <Mail className={iconClass} />
      case 'meeting':
        return <Calendar className={iconClass} />
      case 'note':
        return <MessageSquare className={iconClass} />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'call':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'email':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'meeting':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'note':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    }
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4">
          <div className="rounded-full bg-muted/50 p-4 inline-block">
            <Clock className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          No activity recorded yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Activity will appear here as you interact with this deal
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="space-y-1">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline line */}
            {index !== activities.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(
                activity.type
              )}`}
            >
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {activity.title}
                </h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.timestamp}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                {activity.description}
              </p>
              {activity.actor && (
                <p className="text-xs text-muted-foreground/70">
                  by {activity.actor}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface NoteItem {
  id: string
  content: string
  author: string
  timestamp: string
}

function DealNotes() {
  // Mock data - will be replaced with real data from backend
  const notes: NoteItem[] = [
    {
      id: '1',
      content:
        'Client mentioned they are currently using a competitor solution but are unhappy with the support quality. Good opportunity to highlight our premium support package.',
      author: 'Eric Luna',
      timestamp: 'Yesterday',
    },
    {
      id: '2',
      content:
        'Decision maker is the CTO. Finance team needs to approve budget over $50K. Recommend starting with a pilot program to reduce initial commitment.',
      author: 'Sarah Costa',
      timestamp: '3 days ago',
    },
    {
      id: '3',
      content:
        'Follow up scheduled for next week after they complete internal review. They requested a custom demo focusing on integration capabilities with their existing ERP system.',
      author: 'Eric Luna',
      timestamp: '5 days ago',
    },
  ]

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4">
          <div className="rounded-full bg-muted/50 p-4 inline-block">
            <FileText className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          No notes yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          No notes added to this deal yet
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-4 rounded-lg bg-muted/30 border border-border/50"
          >
            <p className="text-sm text-foreground leading-relaxed mb-3">
              {note.content}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="font-medium">{note.author}</span>
              <span>•</span>
              <span>{note.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DealDrawer({ open, onOpenChange, deal }: DealDrawerProps) {
  if (!deal) {
    return null
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won':
        return 'default'
      case 'lost':
        return 'destructive'
      case 'open':
      default:
        return 'secondary'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-6 border-b space-y-4">
          <div className="space-y-3">
            {/* Title */}
            <SheetTitle className="text-xl font-semibold leading-tight line-clamp-2 pr-8">
              {deal.title}
            </SheetTitle>

            {/* Value & Status */}
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(deal.value)}
              </div>
              <Badge variant={getStatusVariant(deal.status)} className="text-xs">
                {deal.status.toUpperCase()}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{deal.pipelineName || 'Sales Pipeline'}</span>
              <span>•</span>
              <span>{deal.stageName || 'Stage'}</span>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <div className="border-b px-6">
            <TabsList className="w-full justify-start h-12 bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                Notes
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full mt-0">
              <div className="h-full overflow-y-auto px-6 py-6">
                <DealOverview deal={deal} />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="h-full mt-0">
              <div className="h-full overflow-y-auto">
                <DealActivity />
              </div>
            </TabsContent>

            <TabsContent value="notes" className="h-full mt-0">
              <div className="h-full overflow-y-auto">
                <DealNotes />
              </div>
            </TabsContent>

            <TabsContent value="history" className="h-full mt-0">
              <div className="h-full overflow-y-auto px-6 py-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <History className="h-4 w-4" />
                    <h3 className="font-semibold text-foreground">Audit Log</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete history of changes and events for this deal
                  </p>
                  <Separator />
                  <AuditLog entityType="deal" entityId={deal.id} />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-muted/30">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" disabled>
              Edit
            </Button>
            <Button variant="default" className="flex-1" disabled>
              Move Stage
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
