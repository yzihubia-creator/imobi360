/**
 * Generic Module View
 *
 * Fallback view for modules without specific implementations.
 * Displays module metadata and basic information.
 */

import type { ModuleViewProps } from '@/lib/modules/types'

export function GenericModuleView({ tenantId, userRole, moduleConfig }: ModuleViewProps) {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{moduleConfig.label}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {moduleConfig.id} module
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">{moduleConfig.label}</p>
            <p className="text-sm">
              Tenant: {tenantId} | Role: {userRole}
            </p>
            <p className="text-xs mt-4 text-gray-400">
              Module: {moduleConfig.id}
            </p>
            {moduleConfig.entity_type_id && (
              <p className="text-xs text-gray-400">
                Entity Type: {moduleConfig.entity_type_id}
              </p>
            )}
            <p className="text-xs mt-6 text-gray-400">
              View implementation coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
