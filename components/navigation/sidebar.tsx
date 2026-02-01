'use client'

/**
 * Config-Driven Sidebar Component
 *
 * Fully dynamic navigation sidebar that:
 * - Consumes tenant runtime config (template + overrides)
 * - Renders navigation items from config only
 * - Respects module enablement
 * - Enforces RBAC (min_role filtering)
 * - Hard fails on invalid config
 *
 * No hardcoded modules, no fallbacks, no assumptions.
 */

import { usePathname } from 'next/navigation'
import { useTenantConfig } from '@/hooks/use-tenant-config'
import { NavItem } from './nav-item'
import {
  filterNavigationItems,
  sortNavigationItems,
  validateNavigationConfig,
} from '@/lib/navigation'
import type { UserRole } from '@/lib/permissions'

interface SidebarProps {
  tenantId: string
  userRole: UserRole
}

export function Sidebar({ tenantId, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { data: config, isLoading, error } = useTenantConfig(tenantId)

  // Loading state
  if (isLoading) {
    return (
      <nav className="flex flex-col gap-1 p-4">
        <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
      </nav>
    )
  }

  // Error state - hard fail
  if (error || !config) {
    console.error('[Sidebar] Failed to load tenant config:', error)
    return (
      <nav className="flex flex-col gap-1 p-4">
        <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
          Failed to load navigation configuration.
        </div>
      </nav>
    )
  }

  // Validate navigation config - hard fail on invalid config
  const validationErrors = validateNavigationConfig(config.navigation, config.modules)
  if (validationErrors) {
    console.error('[Sidebar] Invalid navigation config:', validationErrors)
    return (
      <nav className="flex flex-col gap-1 p-4">
        <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
          Invalid navigation configuration:
          <ul className="mt-2 list-disc list-inside">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </nav>
    )
  }

  // Filter navigation items by RBAC and module enablement
  const filteredItems = filterNavigationItems(
    config.navigation.sidebar_items,
    config.modules,
    userRole
  )

  // Sort items by order
  const sortedItems = sortNavigationItems(filteredItems)

  // No items after filtering - show empty state
  if (sortedItems.length === 0) {
    return (
      <nav className="flex flex-col gap-1 p-4">
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
          No navigation items available.
        </div>
      </nav>
    )
  }

  return (
    <nav className="flex flex-col gap-1 p-4" aria-label="Main navigation">
      {sortedItems.map((item) => (
        <NavItem key={item.route} item={item} currentPath={pathname} />
      ))}
    </nav>
  )
}
