'use client'

/**
 * Client-Side Tenant Configuration Hook
 *
 * Provides access to tenant configuration in React components.
 * Uses React Query for caching and automatic revalidation.
 */

import { useQuery } from '@tanstack/react-query'
import type { TenantConfig } from '@/lib/templates/types'

/**
 * Fetch tenant configuration from API
 *
 * @param tenantId - Tenant identifier
 * @returns Tenant configuration
 */
async function fetchTenantConfig(tenantId: string): Promise<TenantConfig> {
  const response = await fetch(`/api/tenant/config?tenant_id=${tenantId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to load tenant configuration')
  }

  return response.json()
}

/**
 * Hook to access tenant configuration
 *
 * @param tenantId - Tenant identifier
 * @returns Tenant configuration query
 */
export function useTenantConfig(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      return fetchTenantConfig(tenantId)
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to access specific module config
 *
 * @param tenantId - Tenant identifier
 * @param moduleId - Module identifier
 * @returns Module configuration
 */
export function useModuleConfig(tenantId: string | null | undefined, moduleId: string) {
  const { data: config, ...rest } = useTenantConfig(tenantId)

  const module = config?.modules.find((m) => m.id === moduleId)

  return {
    ...rest,
    data: module || null,
  }
}

/**
 * Hook to access entity type config
 *
 * @param tenantId - Tenant identifier
 * @param entityTypeId - Entity type identifier
 * @returns Entity type configuration
 */
export function useEntityTypeConfig(tenantId: string | null | undefined, entityTypeId: string) {
  const { data: config, ...rest } = useTenantConfig(tenantId)

  const entityType = config?.entity_types.find((et) => et.id === entityTypeId)

  return {
    ...rest,
    data: entityType || null,
  }
}

/**
 * Hook to access navigation config
 *
 * @param tenantId - Tenant identifier
 * @returns Navigation configuration
 */
export function useNavigationConfig(tenantId: string | null | undefined) {
  const { data: config, ...rest } = useTenantConfig(tenantId)

  return {
    ...rest,
    data: config?.navigation || null,
  }
}

/**
 * Hook to access RBAC presets
 *
 * @param tenantId - Tenant identifier
 * @returns RBAC preset configuration
 */
export function useRBACPresets(tenantId: string | null | undefined) {
  const { data: config, ...rest } = useTenantConfig(tenantId)

  return {
    ...rest,
    data: config?.rbac_presets || null,
  }
}

/**
 * Hook to access tenant settings
 *
 * @param tenantId - Tenant identifier
 * @returns Tenant settings
 */
export function useTenantSettings(tenantId: string | null | undefined) {
  const { data: config, ...rest } = useTenantConfig(tenantId)

  return {
    ...rest,
    data: config?.settings || null,
  }
}
