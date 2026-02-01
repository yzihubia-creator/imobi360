/**
 * Tenant Configuration Loader (Server-Side)
 *
 * Loads tenant config from database and merges with template.
 * Server-only module - uses Supabase server client.
 */

import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/templates'
import { buildTenantConfig, validateTenantConfig } from '@/lib/merge-template'
import type { TenantConfig, TenantSettings } from '@/lib/templates/types'
import type { Json } from '@/src/types/supabase'

/**
 * Load tenant configuration
 *
 * 1. Query tenant.settings JSONB from database
 * 2. Get template by template_id (if present)
 * 3. Merge: core + template + tenant overrides
 * 4. Validate final config
 * 5. Return TenantConfig or throw error
 *
 * @param tenantId - Tenant identifier
 * @returns Complete tenant configuration
 * @throws Error if tenant not found or config invalid
 */
export async function loadTenantConfig(tenantId: string): Promise<TenantConfig> {
  const supabase = await createClient()

  // Query tenant settings
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, settings')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    throw new Error(`Tenant not found: ${tenantId}`)
  }

  // Parse tenant settings (JSONB stored as object)
  const tenantSettings = (tenant.settings || {}) as TenantSettings

  // Get template if configured
  let template = null
  if (tenantSettings.template_id) {
    template = getTemplate(tenantSettings.template_id)
    if (!template) {
      console.warn(`[TenantConfig] Template not found: ${tenantSettings.template_id}. Using core defaults.`)
    }
  }

  // Build merged config
  const config = buildTenantConfig(tenantId, template, tenantSettings)

  // Validate config
  const validationErrors = validateTenantConfig(config)
  if (validationErrors) {
    console.error(`[TenantConfig] Validation failed for tenant ${tenantId}:`, validationErrors)
    throw new Error(`Invalid tenant configuration: ${validationErrors.join(', ')}`)
  }

  return config
}

/**
 * Get tenant template ID
 *
 * Lightweight query to get just the template_id without loading full config.
 * Useful for middleware or route guards.
 *
 * @param tenantId - Tenant identifier
 * @returns Template ID or null
 */
export async function getTenantTemplateId(tenantId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    return null
  }

  const settings = (tenant.settings || {}) as TenantSettings
  return settings.template_id || null
}

/**
 * Update tenant template
 *
 * Sets the template_id and template_version in tenant.settings.
 * Does not modify tenant overrides.
 *
 * @param tenantId - Tenant identifier
 * @param templateId - Template to apply
 * @returns Success boolean
 */
export async function setTenantTemplate(
  tenantId: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Validate template exists
  const template = getTemplate(templateId)
  if (!template) {
    return { success: false, error: `Template not found: ${templateId}` }
  }

  // Get current settings
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  if (fetchError || !tenant) {
    return { success: false, error: `Tenant not found: ${tenantId}` }
  }

  const currentSettings = (tenant.settings || {}) as TenantSettings

  // Update settings with new template
  const updatedSettings: TenantSettings = {
    ...currentSettings,
    template_id: templateId,
    template_version: template.version,
    template_applied_at: new Date().toISOString(),
  }

  // Save to database
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ settings: updatedSettings as Json })
    .eq('id', tenantId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

/**
 * Update tenant overrides
 *
 * Merges new overrides with existing overrides in tenant.settings.
 * Does not replace entire overrides object.
 *
 * @param tenantId - Tenant identifier
 * @param overrides - Partial overrides to merge
 * @returns Success boolean
 */
export async function updateTenantOverrides(
  tenantId: string,
  overrides: Partial<TenantSettings['overrides']>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current settings
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  if (fetchError || !tenant) {
    return { success: false, error: `Tenant not found: ${tenantId}` }
  }

  const currentSettings = (tenant.settings || {}) as TenantSettings

  // Merge overrides
  const updatedSettings: TenantSettings = {
    ...currentSettings,
    overrides: {
      ...currentSettings.overrides,
      ...overrides,
    },
  }

  // Save to database
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ settings: updatedSettings as Json })
    .eq('id', tenantId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

/**
 * Clear tenant template
 *
 * Removes template_id from tenant settings, falling back to core defaults.
 * Preserves tenant overrides.
 *
 * @param tenantId - Tenant identifier
 * @returns Success boolean
 */
export async function clearTenantTemplate(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current settings
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  if (fetchError || !tenant) {
    return { success: false, error: `Tenant not found: ${tenantId}` }
  }

  const currentSettings = (tenant.settings || {}) as TenantSettings

  // Remove template fields
  const updatedSettings: TenantSettings = {
    ...currentSettings,
    template_id: undefined,
    template_version: undefined,
    template_applied_at: undefined,
  }

  // Save to database
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ settings: updatedSettings as Json })
    .eq('id', tenantId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}
