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
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out',
        isActive
          ? 'bg-slate-800/60 text-slate-50 shadow-sm border border-white/10'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-white/5',
        className
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-all duration-200",
          isActive
            ? "text-slate-300"
            : "text-slate-500 group-hover:text-slate-300"
        )}
        aria-hidden="true"
      />
      <span>{item.label}</span>
    </Link>
  )
}
