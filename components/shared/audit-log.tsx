'use client'

import { useEffect, useState } from 'react'
import { Clock, User, GitBranch, AlertCircle } from 'lucide-react'
import type { AuditLogEntry } from '@/lib/audit-log/types'
import { formatAuditTimestamp } from '@/lib/audit-log/types'
import { cn } from '@/lib/utils'

interface AuditLogProps {
  entityType: 'deal' | 'lead'
  entityId: string
  className?: string
}

/**
 * Read-only Audit Log component
 * Displays chronological history of events for a record
 */
export function AuditLog({ entityType, entityId, className }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAuditLog() {
      try {
        setLoading(true)
        setError(null)

        const endpoint =
          entityType === 'deal'
            ? `/api/deals/${entityId}/audit`
            : `/api/leads/${entityId}/audit`

        const response = await fetch(endpoint)

        if (!response.ok) {
          throw new Error('Failed to load audit log')
        }

        const { data } = await response.json()
        setEntries(data || [])
      } catch (err) {
        console.error('[AuditLog] Load error:', err)
        setError('Unable to load history')
      } finally {
        setLoading(false)
      }
    }

    if (entityId) {
      loadAuditLog()
    }
  }, [entityType, entityId])

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Loading history...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-sm text-muted-foreground">No activity history yet</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {entries.map((entry, index) => (
        <AuditLogItem
          key={entry.id}
          entry={entry}
          isFirst={index === 0}
          isLast={index === entries.length - 1}
        />
      ))}
    </div>
  )
}

/**
 * Individual audit log entry item
 */
function AuditLogItem({
  entry,
  isFirst,
  isLast,
}: {
  entry: AuditLogEntry
  isFirst: boolean
  isLast: boolean
}) {
  const icon = getEventIcon(entry.eventType)

  return (
    <div className="group relative flex gap-3 py-2 text-sm">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-2 top-8 bottom-0 w-px bg-border" />
      )}

      {/* Event icon */}
      <div
        className={cn(
          'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
          'bg-muted ring-2 ring-background',
          isFirst && 'bg-primary/10 ring-primary/20'
        )}
      >
        {icon}
      </div>

      {/* Event details */}
      <div className="flex-1 space-y-0.5 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-foreground">{entry.action}</p>
          <time
            className="shrink-0 text-xs text-muted-foreground"
            dateTime={entry.timestamp}
          >
            {formatAuditTimestamp(entry.timestamp)}
          </time>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{entry.actor}</span>
        </div>

        {/* Additional metadata for certain events */}
        {entry.field && (
          <div className="mt-1 text-xs text-muted-foreground">
            Field: <code className="rounded bg-muted px-1 py-0.5">{entry.field}</code>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Get icon for event type
 */
function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'created':
      return <div className="h-2 w-2 rounded-full bg-green-500" />
    case 'updated':
      return <div className="h-2 w-2 rounded-full bg-blue-500" />
    case 'deleted':
      return <div className="h-2 w-2 rounded-full bg-red-500" />
    case 'stage_changed':
      return <GitBranch className="h-3 w-3 text-purple-500" />
    case 'status_changed':
      return <div className="h-2 w-2 rounded-full bg-orange-500" />
    default:
      return <div className="h-2 w-2 rounded-full bg-gray-400" />
  }
}
