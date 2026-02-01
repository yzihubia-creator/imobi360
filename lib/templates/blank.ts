/**
 * BlankCRM Template Manifest
 *
 * Minimal baseline configuration with no industry-specific customization.
 * Provides essential CRM modules (Deals, Contacts) with generic defaults.
 */

import type { TemplateManifest } from './types'

export const blankTemplate: TemplateManifest = {
  // Metadata
  id: 'blank',
  name: 'BlankCRM',
  description: 'Minimal CRM with essential modules and no customization',
  version: '1.0.0',
  author: 'YZIHUB',
  category: 'blank',
  locale: 'en',

  // Modules Configuration
  modules: [
    {
      id: 'deals',
      label: 'Deals',
      icon: 'briefcase',
      enabled: true,
      order: 1,
      entity_type_id: 'deal',
      route: '/dashboard/deals',
      settings: {
        default_view: 'pipeline',
      },
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: 'contact',
      enabled: true,
      order: 2,
      entity_type_id: 'contact',
      route: '/dashboard/contacts',
      settings: {
        default_view: 'list',
      },
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: 'calendar',
      enabled: true,
      order: 3,
      entity_type_id: 'activity',
      route: '/dashboard/activities',
      settings: {
        default_view: 'list',
      },
    },
  ],

  // Navigation Configuration
  navigation: {
    sidebar_items: [
      {
        module_id: 'deals',
        label: 'Deals',
        icon: 'briefcase',
        route: '/dashboard/deals',
        order: 1,
      },
      {
        module_id: 'contacts',
        label: 'Contacts',
        icon: 'contact',
        route: '/dashboard/contacts',
        order: 2,
      },
      {
        module_id: 'activities',
        label: 'Activities',
        icon: 'calendar',
        route: '/dashboard/activities',
        order: 3,
      },
    ],
    show_icons: true,
    position: 'left',
    user_customizable: true,
  },

  // Entity Types Configuration
  entity_types: [
    {
      id: 'deal',
      name_singular: 'Deal',
      name_plural: 'Deals',
      description: 'Sales opportunities',
      icon: 'briefcase',
      has_pipeline: true,
      is_primary: true,
      table_name: 'deals',
    },
    {
      id: 'contact',
      name_singular: 'Contact',
      name_plural: 'Contacts',
      description: 'People and organizations',
      icon: 'contact',
      has_pipeline: false,
      table_name: 'contacts',
      type_value: 'contact',
    },
    {
      id: 'activity',
      name_singular: 'Activity',
      name_plural: 'Activities',
      description: 'Tasks and events',
      icon: 'calendar',
      has_pipeline: false,
      table_name: 'activities',
    },
  ],

  // Views Configuration
  views: [
    {
      entity_type_id: 'deal',
      type: 'pipeline',
      label: 'Sales Pipeline',
      is_default: true,
      config: {
        pipeline_id: 'default_pipeline',
        show_metrics: true,
        collapsed: false,
      },
    },
    {
      entity_type_id: 'deal',
      type: 'list',
      label: 'Deal List',
      is_default: false,
      config: {
        columns: [
          { field: 'title', label: 'Title', width: 250 },
          { field: 'value', label: 'Value', width: 120 },
          { field: 'stage_id', label: 'Stage', width: 150 },
          { field: 'assigned_to', label: 'Owner', width: 150 },
        ],
      },
    },
    {
      entity_type_id: 'contact',
      type: 'list',
      label: 'Contact List',
      is_default: true,
      config: {
        columns: [
          { field: 'title', label: 'Name', width: 250 },
          { field: 'custom_fields.email', label: 'Email', width: 200 },
          { field: 'custom_fields.phone', label: 'Phone', width: 150 },
        ],
      },
    },
    {
      entity_type_id: 'activity',
      type: 'list',
      label: 'Activity List',
      is_default: true,
      config: {
        columns: [
          { field: 'title', label: 'Activity', width: 250 },
          { field: 'type', label: 'Type', width: 120 },
          { field: 'due_date', label: 'Due Date', width: 120 },
          { field: 'assigned_to', label: 'Assigned To', width: 150 },
        ],
      },
    },
  ],

  // Field Presets
  field_presets: [
    {
      entity_type_id: 'deal',
      fields: [],
    },
    {
      entity_type_id: 'contact',
      fields: [
        {
          field_name: 'email',
          field_label: 'Email',
          field_type: 'text',
          options: {
            placeholder: 'email@example.com',
          },
          is_required: false,
          position: 1,
        },
        {
          field_name: 'phone',
          field_label: 'Phone',
          field_type: 'text',
          options: {
            placeholder: '+1 (555) 000-0000',
          },
          is_required: false,
          position: 2,
        },
      ],
    },
    {
      entity_type_id: 'activity',
      fields: [],
    },
  ],

  // Pipeline Configurations
  pipelines: [
    {
      entity_type_id: 'deal',
      name: 'Default Sales Pipeline',
      is_default: true,
      stages: [
        {
          name: 'New',
          color: '#3b82f6',
          position: 0,
        },
        {
          name: 'Qualified',
          color: '#8b5cf6',
          position: 1,
        },
        {
          name: 'Proposal',
          color: '#ec4899',
          position: 2,
        },
        {
          name: 'Negotiation',
          color: '#f59e0b',
          position: 3,
        },
        {
          name: 'Won',
          color: '#22c55e',
          position: 4,
          is_won: true,
        },
        {
          name: 'Lost',
          color: '#ef4444',
          position: 5,
          is_lost: true,
        },
      ],
    },
  ],

  // RBAC Presets
  rbac_presets: {
    role_labels: {
      admin: 'Administrator',
      manager: 'Manager',
      member: 'Member',
      viewer: 'Viewer',
    },
    role_descriptions: {
      admin: 'Full system access',
      manager: 'Team and settings management',
      member: 'Standard user access',
      viewer: 'Read-only access',
    },
    default_role: 'member',
  },

  // Settings
  settings: {
    currency: 'USD',
    currency_symbol: '$',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    timezone: 'UTC',
  },
}
