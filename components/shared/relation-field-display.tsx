'use client'

import { Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RelationFieldDisplayProps {
  value: any
  relationType: 'lookup' | 'rollup'
  rollupOperation?: 'sum' | 'count' | 'avg' | 'min' | 'max'
  className?: string
  showIcon?: boolean
}

/**
 * Display component for relation field values (lookup/rollup)
 * Always read-only, with subtle visual indication
 */
export function RelationFieldDisplay({
  value,
  relationType,
  rollupOperation,
  className,
  showIcon = false,
}: RelationFieldDisplayProps) {
  const formattedValue = formatValue(value, relationType, rollupOperation)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded',
        'bg-blue-50 dark:bg-blue-950/20 text-sm text-blue-900 dark:text-blue-100',
        'cursor-not-allowed select-none',
        'border border-blue-200 dark:border-blue-800',
        className
      )}
      title={getTooltip(relationType, rollupOperation)}
    >
      {showIcon && <Link2 className="h-3 w-3 opacity-60" />}
      <span className="font-medium">{formattedValue}</span>
    </div>
  )
}

/**
 * Format value based on relation type and operation
 */
function formatValue(
  value: any,
  relationType: 'lookup' | 'rollup',
  rollupOperation?: string
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  if (relationType === 'rollup') {
    // Numeric formatting for rollup
    if (rollupOperation === 'count') {
      return `${value} ${value === 1 ? 'record' : 'records'}`
    }

    if (rollupOperation === 'sum' || rollupOperation === 'avg') {
      return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    return Number(value).toLocaleString()
  }

  // Lookup - display as-is
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    return Number(value).toLocaleString()
  }

  return String(value)
}

/**
 * Get tooltip text
 */
function getTooltip(
  relationType: 'lookup' | 'rollup',
  rollupOperation?: string
): string {
  if (relationType === 'lookup') {
    return 'Lookup field (read-only)'
  }

  const operationLabels: Record<string, string> = {
    sum: 'Sum',
    count: 'Count',
    avg: 'Average',
    min: 'Minimum',
    max: 'Maximum',
  }

  const operation = rollupOperation
    ? operationLabels[rollupOperation] || rollupOperation
    : 'Rollup'

  return `${operation} rollup (read-only)`
}
