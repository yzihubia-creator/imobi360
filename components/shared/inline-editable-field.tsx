'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import type { UserRole, EntityType } from '@/lib/permissions'

interface InlineEditableFieldProps {
  value: string | number | null
  fieldName: string
  userRole: UserRole
  entityType: EntityType
  onSave: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  displayFormatter?: (value: string | number | null) => string
}

export function InlineEditableField({
  value,
  fieldName,
  userRole,
  entityType,
  onSave,
  placeholder,
  className,
  displayFormatter,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value || ''))
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { canEdit } = usePermissions({ userRole, entityType })

  const isEditable = canEdit(fieldName)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue === String(value || '')) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
      // Revert on error
      setEditValue(String(value || ''))
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(String(value || ''))
      setIsEditing(false)
    }
  }

  const displayValue = displayFormatter
    ? displayFormatter(value)
    : value || placeholder || 'N/A'

  if (!isEditable) {
    return (
      <span
        className={cn(
          'text-sm text-muted-foreground cursor-not-allowed opacity-60',
          className
        )}
        title="You don't have permission to edit this field"
      >
        {displayValue}
      </span>
    )
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={cn('h-7 text-sm', className)}
        placeholder={placeholder}
      />
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'text-sm hover:bg-muted/50 px-2 py-1 rounded transition-colors text-left',
        'cursor-pointer',
        !value && 'text-muted-foreground',
        className
      )}
      title="Click to edit"
    >
      {displayValue}
    </button>
  )
}
