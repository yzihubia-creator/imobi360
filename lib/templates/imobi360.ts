/**
 * IMOBI360 Template Manifest
 *
 * Complete real estate CRM configuration for Brazilian property sales.
 * Provides opinionated defaults for modules, pipelines, fields, and navigation.
 */

import type { TemplateManifest } from './types'

export const imobi360Template: TemplateManifest = {
  // Metadata
  id: 'imobi360',
  name: 'IMOBI360',
  description: 'Complete real estate CRM for property sales in Brazil',
  version: '1.0.0',
  author: 'YZIHUB',
  category: 'real_estate',
  locale: 'pt-BR',

  // Modules Configuration
  modules: [
    {
      id: 'leads',
      label: 'Leads',
      icon: 'users',
      enabled: true,
      order: 1,
      entity_type_id: 'lead',
      route: '/leads',
      settings: {
        default_view: 'kanban',
        enable_quick_add: true,
      },
    },
    {
      id: 'deals',
      label: 'Negócios',
      icon: 'briefcase',
      enabled: true,
      order: 2,
      entity_type_id: 'deal',
      route: '/deals',
      settings: {
        default_view: 'pipeline',
        enable_quick_add: true,
        show_value_metrics: true,
      },
    },
    {
      id: 'properties',
      label: 'Imóveis',
      icon: 'home',
      enabled: true,
      order: 3,
      entity_type_id: 'property',
      route: '/properties',
      settings: {
        default_view: 'list',
        enable_quick_add: true,
      },
    },
    {
      id: 'contacts',
      label: 'Contatos',
      icon: 'contact',
      enabled: true,
      order: 4,
      entity_type_id: 'contact',
      route: '/contacts',
      settings: {
        default_view: 'list',
      },
    },
    {
      id: 'activities',
      label: 'Atividades',
      icon: 'calendar',
      enabled: true,
      order: 5,
      entity_type_id: 'activity',
      route: '/activities',
      settings: {
        default_view: 'calendar',
      },
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: 'chart',
      enabled: true,
      order: 6,
      entity_type_id: null,
      route: '/reports',
      settings: {
        default_dashboard: 'sales_overview',
      },
    },
  ],

  // Navigation Configuration
  navigation: {
    sidebar_items: [
      {
        module_id: 'leads',
        label: 'Leads',
        icon: 'users',
        route: '/leads',
        order: 1,
      },
      {
        module_id: 'deals',
        label: 'Negócios',
        icon: 'briefcase',
        route: '/deals',
        order: 2,
      },
      {
        module_id: 'properties',
        label: 'Imóveis',
        icon: 'home',
        route: '/properties',
        order: 3,
      },
      {
        module_id: 'contacts',
        label: 'Contatos',
        icon: 'contact',
        route: '/contacts',
        order: 4,
      },
      {
        module_id: 'activities',
        label: 'Atividades',
        icon: 'calendar',
        route: '/activities',
        order: 5,
      },
      {
        module_id: 'reports',
        label: 'Relatórios',
        icon: 'chart',
        route: '/reports',
        order: 6,
        min_role: 'manager',
      },
    ],
    show_icons: true,
    position: 'left',
    user_customizable: false,
  },

  // Entity Types Configuration
  entity_types: [
    {
      id: 'lead',
      name_singular: 'Lead',
      name_plural: 'Leads',
      description: 'Potential customers interested in properties',
      icon: 'users',
      has_pipeline: true,
      is_primary: true,
      table_name: 'contacts',
      type_value: 'lead',
    },
    {
      id: 'deal',
      name_singular: 'Negócio',
      name_plural: 'Negócios',
      description: 'Active property sales opportunities',
      icon: 'briefcase',
      has_pipeline: true,
      is_primary: true,
      table_name: 'deals',
    },
    {
      id: 'property',
      name_singular: 'Imóvel',
      name_plural: 'Imóveis',
      description: 'Properties available for sale or rent',
      icon: 'home',
      has_pipeline: false,
      table_name: 'contacts',
      type_value: 'property',
    },
    {
      id: 'contact',
      name_singular: 'Contato',
      name_plural: 'Contatos',
      description: 'General contacts (owners, partners, etc.)',
      icon: 'contact',
      has_pipeline: false,
      table_name: 'contacts',
      type_value: 'contact',
    },
    {
      id: 'activity',
      name_singular: 'Atividade',
      name_plural: 'Atividades',
      description: 'Tasks, calls, meetings, and follow-ups',
      icon: 'calendar',
      has_pipeline: false,
      table_name: 'activities',
    },
  ],

  // Views Configuration
  views: [
    {
      entity_type_id: 'lead',
      type: 'kanban',
      label: 'Funil de Leads',
      is_default: true,
      config: {
        group_by_field: 'stage_id',
        sort_by: {
          field: 'created_at',
          direction: 'desc',
        },
        visible_fields: ['title', 'value', 'assigned_to', 'expected_close_date'],
      },
    },
    {
      entity_type_id: 'lead',
      type: 'list',
      label: 'Lista de Leads',
      is_default: false,
      config: {
        columns: [
          { field: 'title', label: 'Nome', width: 250 },
          { field: 'value', label: 'Valor', width: 120 },
          { field: 'stage_id', label: 'Etapa', width: 150 },
          { field: 'assigned_to', label: 'Responsável', width: 150 },
          { field: 'created_at', label: 'Criado em', width: 120 },
        ],
        sort_by: {
          field: 'created_at',
          direction: 'desc',
        },
      },
    },
    {
      entity_type_id: 'deal',
      type: 'pipeline',
      label: 'Pipeline de Vendas',
      is_default: true,
      config: {
        pipeline_id: 'default_sales_pipeline',
        show_metrics: true,
        collapsed: false,
      },
    },
    {
      entity_type_id: 'deal',
      type: 'list',
      label: 'Lista de Negócios',
      is_default: false,
      config: {
        columns: [
          { field: 'title', label: 'Negócio', width: 250 },
          { field: 'value', label: 'Valor', width: 120 },
          { field: 'stage_id', label: 'Etapa', width: 150 },
          { field: 'expected_close_date', label: 'Previsão', width: 120 },
          { field: 'assigned_to', label: 'Responsável', width: 150 },
        ],
        sort_by: {
          field: 'expected_close_date',
          direction: 'asc',
        },
      },
    },
    {
      entity_type_id: 'property',
      type: 'list',
      label: 'Lista de Imóveis',
      is_default: true,
      config: {
        columns: [
          { field: 'title', label: 'Imóvel', width: 250 },
          { field: 'custom_fields.property_type', label: 'Tipo', width: 120 },
          { field: 'custom_fields.city', label: 'Cidade', width: 150 },
          { field: 'custom_fields.price', label: 'Preço', width: 120 },
          { field: 'custom_fields.status', label: 'Status', width: 120 },
        ],
      },
    },
    {
      entity_type_id: 'contact',
      type: 'list',
      label: 'Lista de Contatos',
      is_default: true,
      config: {
        columns: [
          { field: 'title', label: 'Nome', width: 250 },
          { field: 'custom_fields.email', label: 'Email', width: 200 },
          { field: 'custom_fields.phone', label: 'Telefone', width: 150 },
          { field: 'created_at', label: 'Criado em', width: 120 },
        ],
      },
    },
    {
      entity_type_id: 'activity',
      type: 'calendar',
      label: 'Calendário',
      is_default: true,
      config: {
        date_field: 'scheduled_at',
        default_view: 'week',
      },
    },
  ],

  // Field Presets
  field_presets: [
    {
      entity_type_id: 'lead',
      fields: [
        {
          field_name: 'property_interest',
          field_label: 'Interesse',
          field_type: 'select',
          options: {
            choices: ['Compra', 'Venda', 'Locação', 'Investimento'],
          },
          is_required: false,
          position: 1,
        },
        {
          field_name: 'property_type',
          field_label: 'Tipo de Imóvel',
          field_type: 'select',
          options: {
            choices: ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'],
          },
          is_required: false,
          position: 2,
        },
        {
          field_name: 'budget_min',
          field_label: 'Orçamento Mínimo',
          field_type: 'number',
          options: {
            min: 0,
            placeholder: 'R$ 0,00',
          },
          is_required: false,
          position: 3,
        },
        {
          field_name: 'budget_max',
          field_label: 'Orçamento Máximo',
          field_type: 'number',
          options: {
            min: 0,
            placeholder: 'R$ 0,00',
          },
          is_required: false,
          position: 4,
        },
        {
          field_name: 'preferred_location',
          field_label: 'Localização Preferida',
          field_type: 'text',
          options: {
            placeholder: 'Bairro ou cidade',
          },
          is_required: false,
          position: 5,
        },
      ],
    },
    {
      entity_type_id: 'deal',
      fields: [
        {
          field_name: 'property_id',
          field_label: 'Imóvel Vinculado',
          field_type: 'text',
          options: {
            help_text: 'ID do imóvel relacionado',
          },
          is_required: false,
          position: 1,
        },
        {
          field_name: 'commission_rate',
          field_label: 'Taxa de Comissão (%)',
          field_type: 'number',
          options: {
            min: 0,
            max: 100,
            placeholder: '0.00',
          },
          is_required: false,
          position: 2,
        },
        {
          field_name: 'financing_needed',
          field_label: 'Necessita Financiamento',
          field_type: 'boolean',
          is_required: false,
          position: 3,
        },
      ],
    },
    {
      entity_type_id: 'property',
      fields: [
        {
          field_name: 'property_type',
          field_label: 'Tipo',
          field_type: 'select',
          options: {
            choices: ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'],
          },
          is_required: true,
          position: 1,
        },
        {
          field_name: 'address',
          field_label: 'Endereço',
          field_type: 'text',
          is_required: false,
          position: 2,
        },
        {
          field_name: 'city',
          field_label: 'Cidade',
          field_type: 'text',
          is_required: false,
          position: 3,
        },
        {
          field_name: 'state',
          field_label: 'Estado',
          field_type: 'select',
          options: {
            choices: ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO', 'DF', 'Outro'],
          },
          is_required: false,
          position: 4,
        },
        {
          field_name: 'price',
          field_label: 'Preço',
          field_type: 'number',
          options: {
            min: 0,
            placeholder: 'R$ 0,00',
          },
          is_required: false,
          position: 5,
        },
        {
          field_name: 'bedrooms',
          field_label: 'Quartos',
          field_type: 'number',
          options: {
            min: 0,
          },
          is_required: false,
          position: 6,
        },
        {
          field_name: 'bathrooms',
          field_label: 'Banheiros',
          field_type: 'number',
          options: {
            min: 0,
          },
          is_required: false,
          position: 7,
        },
        {
          field_name: 'area_sqm',
          field_label: 'Área (m²)',
          field_type: 'number',
          options: {
            min: 0,
          },
          is_required: false,
          position: 8,
        },
        {
          field_name: 'status',
          field_label: 'Status',
          field_type: 'select',
          options: {
            choices: ['Disponível', 'Reservado', 'Vendido', 'Alugado', 'Indisponível'],
          },
          is_required: false,
          position: 9,
        },
      ],
    },
    {
      entity_type_id: 'contact',
      fields: [
        {
          field_name: 'email',
          field_label: 'Email',
          field_type: 'text',
          options: {
            placeholder: 'email@exemplo.com',
          },
          is_required: false,
          position: 1,
        },
        {
          field_name: 'phone',
          field_label: 'Telefone',
          field_type: 'text',
          options: {
            placeholder: '(00) 00000-0000',
          },
          is_required: false,
          position: 2,
        },
        {
          field_name: 'cpf_cnpj',
          field_label: 'CPF/CNPJ',
          field_type: 'text',
          is_required: false,
          position: 3,
        },
      ],
    },
  ],

  // Pipeline Configurations
  pipelines: [
    {
      entity_type_id: 'lead',
      name: 'Funil de Leads Padrão',
      is_default: true,
      stages: [
        {
          name: 'Novo Lead',
          color: '#3b82f6',
          position: 0,
        },
        {
          name: 'Contato Inicial',
          color: '#8b5cf6',
          position: 1,
        },
        {
          name: 'Qualificado',
          color: '#ec4899',
          position: 2,
        },
        {
          name: 'Apresentação',
          color: '#f59e0b',
          position: 3,
        },
        {
          name: 'Negociação',
          color: '#10b981',
          position: 4,
        },
        {
          name: 'Convertido',
          color: '#22c55e',
          position: 5,
          is_won: true,
        },
        {
          name: 'Perdido',
          color: '#ef4444',
          position: 6,
          is_lost: true,
        },
      ],
    },
    {
      entity_type_id: 'deal',
      name: 'Pipeline de Vendas Padrão',
      is_default: true,
      stages: [
        {
          name: 'Proposta',
          color: '#3b82f6',
          position: 0,
        },
        {
          name: 'Negociação',
          color: '#8b5cf6',
          position: 1,
        },
        {
          name: 'Documentação',
          color: '#ec4899',
          position: 2,
        },
        {
          name: 'Aprovação Crédito',
          color: '#f59e0b',
          position: 3,
        },
        {
          name: 'Contrato',
          color: '#10b981',
          position: 4,
        },
        {
          name: 'Fechado - Ganho',
          color: '#22c55e',
          position: 5,
          is_won: true,
        },
        {
          name: 'Fechado - Perdido',
          color: '#ef4444',
          position: 6,
          is_lost: true,
        },
      ],
    },
  ],

  // RBAC Presets
  rbac_presets: {
    role_labels: {
      admin: 'Administrador',
      manager: 'Gestor',
      member: 'Corretor',
      viewer: 'Visualizador',
    },
    role_descriptions: {
      admin: 'Acesso total ao sistema',
      manager: 'Gerencia equipe e configurações',
      member: 'Acesso a leads e negócios próprios',
      viewer: 'Visualização apenas',
    },
    default_role: 'member',
  },

  // Settings
  settings: {
    currency: 'BRL',
    currency_symbol: 'R$',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    timezone: 'America/Sao_Paulo',
    enable_property_module: true,
    enable_lead_scoring: false,
    enable_automation: true,
  },
}
