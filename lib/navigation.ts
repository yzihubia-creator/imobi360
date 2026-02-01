/**
 * Navigation Utilities
 *
 * Config-driven navigation helpers for sidebar rendering.
 * Maps icon strings to components, validates navigation config.
 */

import {
  LayoutDashboard,
  Users,
  Briefcase,
  Home,
  Contact,
  Calendar,
  ChartBar,
  Settings,
  FileText,
  DollarSign,
  Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@/lib/permissions'
import type { SidebarItemConfig, ModuleConfig, NavigationConfig } from '@/lib/templates/types'

/**
 * Icon Registry
 *
 * Maps icon string identifiers to Lucide components.
 * Templates reference icons by string, this registry resolves them.
 */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  briefcase: Briefcase,
  home: Home,
  contact: Contact,
  calendar: Calendar,
  chart: ChartBar,
  settings: Settings,
  file: FileText,
  dollar: DollarSign,
  building: Building2,
}

/**
 * Get icon component from string identifier
 *
 * @param iconName - Icon string identifier from config
 * @returns Lucide icon component or fallback
 */
export function getIconComponent(iconName: string): LucideIcon {
  return ICON_REGISTRY[iconName] || LayoutDashboard
}

/**
 * Check if user has permission to view navigation item
 *
 * @param item - Sidebar item configuration
 * @param userRole - Current user's role
 * @returns True if user can view this item
 */
export function canViewNavItem(item: SidebarItemConfig, userRole: UserRole): boolean {
  if (!item.min_role) {
    return true // No role restriction
  }

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 0,
    member: 1,
    manager: 2,
    admin: 3,
  }

  const userLevel = roleHierarchy[userRole]
  const requiredLevel = roleHierarchy[item.min_role]

  return userLevel >= requiredLevel
}

/**
 * Check if module is enabled in tenant config
 *
 * @param moduleId - Module identifier
 * @param modules - Tenant modules configuration
 * @returns True if module is enabled
 */
export function isModuleEnabled(moduleId: string, modules: ModuleConfig[]): boolean {
  const module = modules.find((m) => m.id === moduleId)
  return module?.enabled ?? false
}

/**
 * Filter navigation items by RBAC and module enablement
 *
 * @param items - Sidebar items from tenant config
 * @param modules - Tenant modules configuration
 * @param userRole - Current user's role
 * @returns Filtered navigation items
 */
export function filterNavigationItems(
  items: SidebarItemConfig[],
  modules: ModuleConfig[],
  userRole: UserRole
): SidebarItemConfig[] {
  return items.filter((item) => {
    // Check RBAC permission
    if (!canViewNavItem(item, userRole)) {
      return false
    }

    // Check module enablement
    if (item.module_id && !isModuleEnabled(item.module_id, modules)) {
      return false
    }

    // Recursively filter children
    if (item.children) {
      item.children = filterNavigationItems(item.children, modules, userRole)
    }

    return true
  })
}

/**
 * Validate navigation configuration
 *
 * Ensures navigation config is well-formed and references valid modules.
 *
 * @param navigationConfig - Navigation configuration
 * @param modules - Tenant modules configuration
 * @returns Array of validation errors or null if valid
 */
export function validateNavigationConfig(
  navigationConfig: NavigationConfig,
  modules: ModuleConfig[]
): string[] | null {
  const errors: string[] = []

  if (!navigationConfig.sidebar_items || navigationConfig.sidebar_items.length === 0) {
    errors.push('Navigation config has no sidebar items')
  }

  const moduleIds = new Set(modules.map((m) => m.id))

  for (const item of navigationConfig.sidebar_items) {
    // Validate module reference
    if (item.module_id && !moduleIds.has(item.module_id)) {
      errors.push(`Navigation item "${item.label}" references unknown module: ${item.module_id}`)
    }

    // Validate icon
    if (!item.icon) {
      errors.push(`Navigation item "${item.label}" has no icon`)
    }

    // Validate route
    if (!item.route) {
      errors.push(`Navigation item "${item.label}" has no route`)
    }

    // Validate children
    if (item.children) {
      for (const child of item.children) {
        if (child.module_id && !moduleIds.has(child.module_id)) {
          errors.push(`Child navigation item "${child.label}" references unknown module: ${child.module_id}`)
        }
      }
    }
  }

  return errors.length > 0 ? errors : null
}

/**
 * Sort navigation items by order
 *
 * @param items - Sidebar items
 * @returns Sorted items
 */
export function sortNavigationItems(items: SidebarItemConfig[]): SidebarItemConfig[] {
  return [...items].sort((a, b) => a.order - b.order)
}

/**
 * Check if route is active
 *
 * @param itemRoute - Navigation item route
 * @param currentPath - Current pathname
 * @returns True if route is active
 */
export function isRouteActive(itemRoute: string, currentPath: string): boolean {
  // Exact match
  if (currentPath === itemRoute) {
    return true
  }

  // Parent route match (e.g., /dashboard/leads matches /dashboard/leads/123)
  if (currentPath.startsWith(itemRoute + '/')) {
    return true
  }

  return false
}
