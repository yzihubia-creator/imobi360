'use client'

/**
 * Navigation Item Component
 *
 * Renders individual navigation items with:
 * - Dynamic icon from config
 * - Active state detection
 * - Accessibility support
 * - Clean, minimal styling
 */

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getIconComponent, isRouteActive } from '@/lib/navigation'
import type { SidebarItemConfig } from '@/lib/templates/types'

interface NavItemProps {
  item: SidebarItemConfig
  currentPath: string
  className?: string
}

export function NavItem({ item, currentPath, className }: NavItemProps) {
  const Icon = getIconComponent(item.icon)
  const isActive = isRouteActive(item.route, currentPath)

  return (
    <Link
      href={item.route}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
        className
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  )
}
