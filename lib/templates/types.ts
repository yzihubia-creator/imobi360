/**
 * Template Manifest Type Definitions
 *
 * Pure configuration schema for YZIHUB CRM templates.
 * Templates configure defaults, never core behavior.
 */

export type TemplateCategory =
  | 'real_estate'
  | 'sales'
  | 'support'
  | 'agency'
  | 'consulting'
  | 'education'
  | 'healthcare'
  | 'nonprofit'
  | 'general'
  | 'blank'

export interface TemplateManifest {
  // Metadata
  id: string
  name: string
  description: string
  version: string
  author?: string
  category: TemplateCategory
  locale: string

  // Configuration
  modules: ModuleConfig[]
  navigation: NavigationConfig
  entity_types: EntityTypeConfig[]
  views: ViewConfig[]
  field_presets: FieldPresetConfig[]
  pipelines: PipelineConfig[]
  rbac_presets?: RBACPresetConfig
  settings?: Record<string, unknown>
}

export interface ModuleConfig {
  id: string
  label: string
  icon: string
  enabled: boolean
  order: number
  entity_type_id: string | null
  route: string
  settings?: Record<string, unknown>
}

export interface NavigationConfig {
  sidebar_items: SidebarItemConfig[]
  show_icons: boolean
  position: 'left' | 'right'
  user_customizable: boolean
}

export interface SidebarItemConfig {
  module_id: string
  label: string
  icon: string
  route: string
  order: number
  children?: SidebarItemConfig[]
  min_role?: 'viewer' | 'member' | 'manager' | 'admin'
}

export interface EntityTypeConfig {
  id: string
  name_singular: string
  name_plural: string
  description?: string
  icon: string
  has_pipeline: boolean
  is_primary?: boolean
  table_name: 'deals' | 'contacts' | 'activities'
  type_value?: string
}

export interface ViewConfig {
  entity_type_id: string
  type: 'kanban' | 'list' | 'pipeline' | 'calendar' | 'board'
  label: string
  is_default: boolean
  config: ViewTypeConfig
}

export type ViewTypeConfig =
  | KanbanViewConfig
  | ListViewConfig
  | PipelineViewConfig
  | CalendarViewConfig

export interface KanbanViewConfig {
  group_by_field: string
  sort_by?: {
    field: string
    direction: 'asc' | 'desc'
  }
  visible_fields?: string[]
}

export interface ListViewConfig {
  columns: {
    field: string
    label: string
    width?: number
  }[]
  sort_by?: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters?: {
    field: string
    operator: string
    value: unknown
  }[]
}

export interface PipelineViewConfig {
  pipeline_id: string
  show_metrics: boolean
  collapsed: boolean
}

export interface CalendarViewConfig {
  date_field: string
  default_view: 'month' | 'week' | 'day'
}

export interface FieldPresetConfig {
  entity_type_id: string
  fields: CustomFieldDefinition[]
}

export interface CustomFieldDefinition {
  field_name: string
  field_label: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
  options?: {
    choices?: string[]
    min?: number
    max?: number
    placeholder?: string
    help_text?: string
  }
  is_required: boolean
  position: number
}

export interface PipelineConfig {
  entity_type_id: string
  name: string
  is_default: boolean
  stages: PipelineStageConfig[]
}

export interface PipelineStageConfig {
  name: string
  color: string
  position: number
  is_won?: boolean
  is_lost?: boolean
}

export interface RBACPresetConfig {
  role_labels?: {
    admin?: string
    manager?: string
    member?: string
    viewer?: string
  }
  role_descriptions?: {
    admin?: string
    manager?: string
    member?: string
    viewer?: string
  }
  default_role?: 'member' | 'viewer'
}

/**
 * Tenant Configuration (Runtime Merged Config)
 *
 * This is the resolved configuration at runtime:
 * core defaults + template defaults + tenant overrides
 */
export interface TenantConfig {
  tenant_id: string
  template_id: string | null
  template_version: string | null

  modules: ModuleConfig[]
  navigation: NavigationConfig
  entity_types: EntityTypeConfig[]
  views: ViewConfig[]
  pipelines: PipelineConfig[]
  rbac_presets: RBACPresetConfig
  settings: Record<string, unknown>
}

/**
 * Tenant Settings (Stored in tenants.settings JSONB)
 */
export interface TenantSettings {
  template_id?: string
  template_version?: string
  template_applied_at?: string

  // Overrides (merged with template at runtime)
  overrides?: {
    modules?: Partial<ModuleConfig>[]
    navigation?: Partial<NavigationConfig>
    entity_types?: Partial<EntityTypeConfig>[]
    views?: Partial<ViewConfig>[]
    pipelines?: Partial<PipelineConfig>[]
    settings?: Record<string, unknown>
  }
}
