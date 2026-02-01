'use client'

import { Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormulaFieldDisplayProps {
  value: any
  returnType: 'number' | 'string' | 'boolean'
  className?: string
  showIcon?: boolean
}

/**
 * Display component for formula field values
 * Always read-only, with subtle visual indication
 */
export function FormulaFieldDisplay({
  value,
  returnType,
  className,
  showIcon = false,
}: FormulaFieldDisplayProps) {
  const formattedValue = formatValue(value, returnType)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded',
        'bg-muted/30 text-sm text-muted-foreground',
        'cursor-not-allowed select-none',
        'border border-dashed border-muted-foreground/20',
        className
      )}
      title="Computed field (read-only)"
    >
      {showIcon && <Calculator className="h-3 w-3 opacity-50" />}
      <span>{formattedValue}</span>
    </div>
  )
}

/**
 * Format value based on return type
 */
function formatValue(
  value: any,
  returnType: 'number' | 'string' | 'boolean'
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  switch (returnType) {
    case 'number':
      return Number(value).toLocaleString()
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'string':
    default:
      return String(value)
  }
}
