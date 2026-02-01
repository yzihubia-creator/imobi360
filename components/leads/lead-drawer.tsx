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
import { AuditLog } from '@/components/shared/audit-log'
import {
  User,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  MessageSquare,
  History,
  UserCircle,
} from 'lucide-react'

export interface LeadDrawerLead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  status: string
  assigned_to?: string | null
  created_at?: string | null
}

export interface LeadDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: LeadDrawerLead | null
}

function LeadOverview({ lead }: { lead: LeadDrawerLead }) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'qualified':
        return 'default'
      case 'contacted':
        return 'secondary'
      case 'new':
        return 'outline'
      case 'converted':
        return 'default'
      case 'unqualified':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Lead Status */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Lead Status
        </h4>
        <div className="flex items-center gap-3 p-5 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex-1">
            <Badge variant={getStatusVariant(lead.status)} className="text-xs">
              {lead.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contact Information
        </h4>
        <div className="space-y-3">
          {/* Name */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium">{lead.name}</p>
            </div>
          </div>

          {/* Email */}
          {lead.email && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{lead.email}</p>
              </div>
            </div>
          )}

          {/* Phone */}
          {lead.phone && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{lead.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Lead Source */}
      {lead.source && (
        <>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Lead Source
            </h4>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{lead.source}</p>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Current Status */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Current Status
        </h4>
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium capitalize">{lead.status}</p>
            <p className="text-xs text-muted-foreground">
              Lead is currently {lead.status.toLowerCase()}
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

function LeadActivity() {
  // Mock data - will be replaced with real data from backend
  const activities: ActivityItem[] = []

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
          Activity will appear here as you interact with this lead
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

function LeadNotes() {
  // Mock data - will be replaced with real data from backend
  const notes: NoteItem[] = []

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
          No notes added to this lead yet
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

export function LeadDrawer({ open, onOpenChange, lead }: LeadDrawerProps) {
  if (!lead) {
    return null
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'qualified':
        return 'default'
      case 'contacted':
        return 'secondary'
      case 'new':
        return 'outline'
      case 'converted':
        return 'default'
      case 'unqualified':
        return 'destructive'
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
              {lead.name}
            </SheetTitle>

            {/* Status */}
            <div className="flex items-center gap-3">
              <Badge variant={getStatusVariant(lead.status)} className="text-xs">
                {lead.status.toUpperCase()}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lead.email && <span>{lead.email}</span>}
              {lead.email && lead.phone && <span>•</span>}
              {lead.phone && <span>{lead.phone}</span>}
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
                <LeadOverview lead={lead} />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="h-full mt-0">
              <div className="h-full overflow-y-auto">
                <LeadActivity />
              </div>
            </TabsContent>

            <TabsContent value="notes" className="h-full mt-0">
              <div className="h-full overflow-y-auto">
                <LeadNotes />
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
                    Complete history of changes and events for this lead
                  </p>
                  <Separator />
                  <AuditLog entityType="lead" entityId={lead.id} />
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
              Convert to Deal
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
