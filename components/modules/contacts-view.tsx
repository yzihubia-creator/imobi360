/**
 * Contacts Module View
 *
 * Renders contacts module content.
 * Generic implementation that works for any tenant.
 */

import type { ModuleViewProps } from '@/lib/modules/types'

export function ContactsView({ tenantId, userRole, moduleConfig }: ModuleViewProps) {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{moduleConfig.label}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your contacts and relationships
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">Contacts Module</p>
            <p className="text-sm">
              Tenant: {tenantId} | Role: {userRole}
            </p>
            <p className="text-xs mt-4 text-gray-400">
              View implementation coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
