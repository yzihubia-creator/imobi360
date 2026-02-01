/**
 * Template Merge Logic
 *
 * Merges configuration with precedence: core < template < tenant overrides
 * Produces final runtime TenantConfig from multiple layers.
 */

import type {
  TemplateManifest,
  TenantConfig,
  TenantSettings,
  ModuleConfig,
  NavigationConfig,
  EntityTypeConfig,
  ViewConfig,
  PipelineConfig,
  RBACPresetConfig,
  SidebarItemConfig,
} from './templates/types'

/**
 * Core Defaults (Hardcoded Baseline)
 *
 * Absolute minimum configuration if no template is applied.
 * This ensures the system always has valid config.
 */
const CORE_DEFAULTS: {
  modules: ModuleConfig[]
  navigation: NavigationConfig
  entity_types: EntityTypeConfig[]
  views: ViewConfig[]
  pipelines: PipelineConfig[]
  rbac_presets: RBACPresetConfig
  settings: Record<string, unknown>
} = {
  modules: [],
  navigation: {
    sidebar_items: [],
    show_icons: true,
    position: 'left',
    user_customizable: true,
  },
  entity_types: [],
  views: [],
  pipelines: [],
  rbac_presets: {
    role_labels: {
      admin: 'Administrator',
      manager: 'Manager',
      member: 'Member',
      viewer: 'Viewer',
    },
    role_descriptions: {
      admin: 'Full system access',
      manager: 'Team management access',
      member: 'Standard user access',
      viewer: 'Read-only access',
    },
    default_role: 'member',
  },
  settings: {},
}

/**
 * Deep merge two objects
 *
 * - Arrays are replaced, not merged
 * - Objects are recursively merged
 * - null/undefined values in source are ignored
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key in source) {
    const sourceValue = source[key]
    const targetValue = result[key]

    // Skip undefined values
    if (sourceValue === undefined) {
      continue
    }

    // Replace arrays (don't merge them)
    if (Array.isArray(sourceValue)) {
      result[key] = sourceValue as any
      continue
    }

    // Recursively merge objects
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue)
      continue
    }

    // Primitive values: replace
    result[key] = sourceValue as any
  }

  return result
}

/**
 * Merge template manifest with core defaults
 *
 * @param template - Template manifest
 * @returns Merged configuration
 */
function mergeTemplateWithCore(template: TemplateManifest) {
  return {
    modules: template.modules,
    navigation: template.navigation,
    entity_types: template.entity_types,
    views: template.views,
    pipelines: template.pipelines,
    rbac_presets: template.rbac_presets || CORE_DEFAULTS.rbac_presets,
    settings: template.settings || {},
  }
}

/**
 * Merge tenant overrides on top of template config
 *
 * @param baseConfig - Base configuration (core + template)
 * @param overrides - Tenant-specific overrides
 * @returns Final merged configuration
 */
function mergeTenantOverrides(
  baseConfig: {
    modules: ModuleConfig[]
    navigation: NavigationConfig
    entity_types: EntityTypeConfig[]
    views: ViewConfig[]
    pipelines: PipelineConfig[]
    rbac_presets: RBACPresetConfig
    settings: Record<string, unknown>
  },
  overrides?: TenantSettings['overrides']
) {
  if (!overrides) {
    return baseConfig
  }

  const result = { ...baseConfig }

  // Merge modules (array replacement if present)
  if (overrides.modules && overrides.modules.length > 0) {
    // Partial override: update existing modules by id
    result.modules = baseConfig.modules.map((module) => {
      const override = overrides.modules?.find((o) => o.id === module.id)
      return override ? deepMerge(module, override) : module
    })
  }

  // Merge navigation
  if (overrides.navigation) {
    result.navigation = deepMerge(baseConfig.navigation, overrides.navigation)
  }

  // Merge entity types
  if (overrides.entity_types && overrides.entity_types.length > 0) {
    result.entity_types = baseConfig.entity_types.map((entityType) => {
      const override = overrides.entity_types?.find((o) => o.id === entityType.id)
      return override ? deepMerge(entityType, override) : entityType
    })
  }

  // Merge views
  if (overrides.views && overrides.views.length > 0) {
    result.views = baseConfig.views.map((view) => {
      const override = overrides.views?.find(
        (o) => o.entity_type_id === view.entity_type_id && o.type === view.type
      )
      return override ? deepMerge(view, override) : view
    })
  }

  // Merge pipelines
  if (overrides.pipelines && overrides.pipelines.length > 0) {
    result.pipelines = baseConfig.pipelines.map((pipeline) => {
      const override = overrides.pipelines?.find(
        (o) => o.entity_type_id === pipeline.entity_type_id && o.name === pipeline.name
      )
      return override ? deepMerge(pipeline, override) : pipeline
    })
  }

  // Merge settings
  if (overrides.settings) {
    result.settings = deepMerge(baseConfig.settings, overrides.settings)
  }

  return result
}

/**
 * Build tenant configuration from template and overrides
 *
 * Precedence: core defaults < template manifest < tenant overrides
 *
 * @param tenantId - Tenant identifier
 * @param template - Template manifest (can be null for core-only config)
 * @param tenantSettings - Tenant settings with overrides (optional)
 * @returns Complete tenant configuration
 */
export function buildTenantConfig(
  tenantId: string,
  template: TemplateManifest | null,
  tenantSettings?: TenantSettings
): TenantConfig {
  // Start with core defaults
  let config = { ...CORE_DEFAULTS }

  // Merge template on top of core
  if (template) {
    config = mergeTemplateWithCore(template)
  }

  // Merge tenant overrides on top
  const finalConfig = mergeTenantOverrides(config, tenantSettings?.overrides)

  return {
    tenant_id: tenantId,
    template_id: template?.id || null,
    template_version: template?.version || null,
    ...finalConfig,
  }
}

/**
 * Validate tenant configuration
 *
 * Ensures required fields are present and valid.
 * Returns validation errors or null if valid.
 *
 * @param config - Tenant configuration to validate
 * @returns Array of validation errors or null if valid
 */
export function validateTenantConfig(config: TenantConfig): string[] | null {
  const errors: string[] = []

  if (!config.tenant_id) {
    errors.push('Missing tenant_id')
  }

  if (config.modules.length === 0) {
    errors.push('No modules configured')
  }

  if (config.entity_types.length === 0) {
    errors.push('No entity types configured')
  }

  if (config.navigation.sidebar_items.length === 0) {
    errors.push('No navigation items configured')
  }

  // Validate modules have valid entity_type_id references
  for (const module of config.modules) {
    if (module.entity_type_id && !config.entity_types.find((et) => et.id === module.entity_type_id)) {
      errors.push(`Module "${module.id}" references unknown entity_type_id: ${module.entity_type_id}`)
    }
  }

  // Validate views reference existing entity types
  for (const view of config.views) {
    if (!config.entity_types.find((et) => et.id === view.entity_type_id)) {
      errors.push(`View "${view.label}" references unknown entity_type_id: ${view.entity_type_id}`)
    }
  }

  // Validate pipelines reference existing entity types
  for (const pipeline of config.pipelines) {
    if (!config.entity_types.find((et) => et.id === pipeline.entity_type_id)) {
      errors.push(`Pipeline "${pipeline.name}" references unknown entity_type_id: ${pipeline.entity_type_id}`)
    }
  }

  return errors.length > 0 ? errors : null
}
