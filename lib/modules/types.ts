/**
 * Module Types
 *
 * Type definitions for module registry and view resolution.
 * Module views are React components that render module content.
 */

import type { ComponentType } from 'react'
import type { UserRole } from '@/lib/permissions'
import type { ModuleConfig } from '@/lib/templates/types'

/**
 * Module View Component Props
 *
 * All module view components receive these props.
 */
export interface ModuleViewProps {
  tenantId: string
  userRole: UserRole
  moduleConfig: ModuleConfig
}

/**
 * Module View Component
 *
 * React component that renders a specific module's content.
 */
export type ModuleView = ComponentType<ModuleViewProps>

/**
 * Module Registry Entry
 *
 * Maps module_id to view component and metadata.
 */
export interface ModuleRegistryEntry {
  /**
   * Module identifier (must match module_id in tenant config)
   */
  id: string

  /**
   * Display name for error messages
   */
  name: string

  /**
   * View component to render
   */
  component: ModuleView

  /**
   * Minimum role required (optional, falls back to module config)
   */
  minRole?: UserRole
}

/**
 * Module Validation Result
 */
export interface ModuleValidationResult {
  valid: boolean
  error?: {
    code: 'MODULE_NOT_FOUND' | 'MODULE_DISABLED' | 'MODULE_NOT_CONFIGURED' | 'UNAUTHORIZED'
    message: string
  }
  moduleConfig?: ModuleConfig
}
