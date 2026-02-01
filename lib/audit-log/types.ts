import type { Database } from '@/src/types/supabase'

type EventType = Database['public']['Enums']['event_type']

/**
 * Normalized audit log entry for UI display
 */
export interface AuditLogEntry {
  id: string
  timestamp: string
  eventType: EventType
  actor: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  metadata?: Record<string, any>
}

/**
 * Format timestamp for display (client-safe)
 */
export function formatAuditTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // Relative time for recent events
  if (seconds < 60) {
    return 'Just now'
  }
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  if (hours < 24) {
    return `${hours}h ago`
  }
  if (days < 7) {
    return `${days}d ago`
  }

  // Absolute time for older events
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  })
}
