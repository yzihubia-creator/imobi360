'use client'

import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/use-permissions'
import { useActionField } from '@/hooks/use-action-field'
import { Loader2 } from 'lucide-react'
import type { UserRole, EntityType } from '@/lib/permissions'

interface ActionFieldButtonProps {
  fieldName: string
  label: string
  entityType: EntityType
  entityId: string
  userRole: UserRole
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  confirmMessage?: string
  onSuccess?: (result: { event_id?: string; executed_at?: string }) => void
  onError?: (error: string) => void
  className?: string
}

export function ActionFieldButton({
  fieldName,
  label,
  entityType,
  entityId,
  userRole,
  variant = 'default',
  confirmMessage,
  onSuccess,
  onError,
  className,
}: ActionFieldButtonProps) {
  const { canEdit } = usePermissions({ userRole, entityType })
  const { execute, isExecuting, lastError } = useActionField()

  const canExecute = canEdit(fieldName)

  const handleClick = async () => {
    // Native browser confirmation if confirmMessage is provided
    if (confirmMessage) {
      const confirmed = window.confirm(confirmMessage)
      if (!confirmed) return
    }

    const result = await execute({
      entityType,
      entityId,
      fieldName,
    })

    if (result.success) {
      onSuccess?.(result)
    } else {
      onError?.(result.error || 'Action failed')
    }
  }

  if (!canExecute) {
    return (
      <Button
        variant={variant}
        disabled
        className={className}
        title="You don't have permission to execute this action"
      >
        {label}
      </Button>
    )
  }

  return (
    <div>
      <Button
        variant={variant}
        onClick={handleClick}
        disabled={isExecuting}
        className={className}
      >
        {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>

      {lastError && (
        <p className="text-xs text-destructive mt-1">{lastError}</p>
      )}
    </div>
  )
}
