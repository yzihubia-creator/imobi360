// ============================================================================
// IMOBI360 - TYPESCRIPT TYPES
// Gerado a partir do schema PostgreSQL
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export enum LeadStatus {
  NOVO = 'novo',
  QUALIFICANDO = 'qualificando',
  LEAD_QUENTE = 'lead_quente',
  VISITA_AGENDADA = 'visita_agendada',
  PROPOSTA_ENVIADA = 'proposta_enviada',
  NEGOCIACAO = 'negociacao',
  FECHADO = 'fechado',
  PERDIDO = 'perdido',
}

export enum LeadScore {
  ALTO = 'alto',
  MEDIO = 'medio',
  BAIXO = 'baixo',
}

export enum LeadSource {
  GOOGLE_ADS = 'google_ads',
  META_ADS = 'meta_ads',
  INSTAGRAM = 'instagram',
  WHATSAPP_SITE = 'whatsapp_site',
  INDICACAO = 'indicacao',
  ORGANICO = 'organico',
  OUTRO = 'outro',
}

export enum PropertyType {
  APARTAMENTO = 'apartamento',
  CASA = 'casa',
  COMERCIAL = 'comercial',
  LOTE = 'lote',
  TERRENO = 'terreno',
}

export enum PropertyPurpose {
  COMPRA = 'compra',
  ALUGUEL = 'aluguel',
  TROCA = 'troca',
  PERMUTA = 'permuta',
}

export enum PropertyOrientation {
  NORTE = 'norte',
  SUL = 'sul',
  LESTE = 'leste',
  OESTE = 'oeste',
  NORDESTE = 'nordeste',
  NOROESTE = 'noroeste',
  SUDESTE = 'sudeste',
  SUDOESTE = 'sudoeste',
  NASCENTE = 'nascente',
  POENTE = 'poente',
}

export enum PropertyStatus {
  PENDENTE = 'pendente',
  PUBLICADO = 'publicado',
  DESPUBLICADO = 'despublicado',
  VENDIDO = 'vendido',
  ALUGADO = 'alugado',
}

export enum ContractStatus {
  PREPARACAO = 'preparacao',
  ENVIADO = 'enviado',
  AGUARDANDO = 'aguardando',
  ASSINADO = 'assinado',
  CANCELADO = 'cancelado',
}

export enum ContractType {
  COMPRA_VENDA = 'compra_venda',
  LOCACAO = 'locacao',
  TROCA = 'troca',
  PERMUTA = 'permuta',
}

export enum FinancialStatus {
  PREVISTO = 'previsto',
  A_RECEBER = 'a_receber',
  RECEBIDO = 'recebido',
  ATRASADO = 'atrasado',
  CANCELADO = 'cancelado',
}

export enum FinancialType {
  RECEITA = 'receita',
  DESPESA = 'despesa',
}

export enum FinancialCategory {
  COMISSAO = 'comissao',
  ALUGUEL = 'aluguel',
  ANUNCIOS = 'anuncios',
  FIXO = 'fixo',
  PORTAL_IMOBILIARIO = 'portal_imobiliario',
  OPERACIONAL = 'operacional',
  OUTRO = 'outro',
}

export enum UserRole {
  ADMIN = 'admin',
  GESTOR = 'gestor',
  VENDEDOR = 'vendedor',
  VISUALIZADOR = 'visualizador',
}

export enum TenantPlan {
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELED = 'canceled',
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  plan: TenantPlan;
  status: TenantStatus;
  trial_ends_at?: Date;
  max_users: number;
  max_leads: number;
  max_properties: number;
  max_storage_mb: number;
  settings: Record<string, any>;
  logo_url?: string;
  primary_color: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface User {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  auth_id?: string;
  role: UserRole;
  is_active: boolean;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Lead {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email?: string;
  cpf_cnpj?: string;
  status: LeadStatus;
  score?: LeadScore;
  score_value?: number;
  profile_summary?: string;
  source: LeadSource;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  interest_type?: PropertyType;
  budget_min?: number;
  budget_max?: number;
  desired_region?: string[];
  timeline?: string;
  assigned_to?: string;
  last_interaction?: Date;
  next_follow_up?: Date;
  visit_scheduled_at?: Date;
  enriched: boolean;
  enrichment_data: Record<string, any>;
  webhook_url?: string;
  automation_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Property {
  id: string;
  tenant_id: string;
  property_code: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  title?: string;
  description?: string;
  neighborhood: string;
  street?: string;
  number?: string;
  complement?: string;
  city: string;
  state: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parking_spaces?: number;
  orientation?: PropertyOrientation;
  amenities?: string[];
  price: number;
  condominium_fee?: number;
  iptu?: number;
  photos: string[];
  video_url?: string;
  virtual_tour_url?: string;
  status: PropertyStatus;
  is_published: boolean;
  published_at?: Date;
  broker_code?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  approval_webhook_url?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Contract {
  id: string;
  tenant_id: string;
  contract_code: string;
  lead_id?: string;
  property_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_cpf_cnpj: string;
  client_address?: string;
  type: ContractType;
  status: ContractStatus;
  sent_at?: Date;
  signed_at?: Date;
  broker_id?: string;
  follow_up_responsible_id?: string;
  document_url?: string;
  days_without_return: number;
  calculated_status?: string;
  manager_notes?: string;
  email_webhook_url?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Financial {
  id: string;
  tenant_id: string;
  financial_code: string;
  type: FinancialType;
  category: FinancialCategory;
  description: string;
  lead_id?: string;
  property_id?: string;
  contract_id?: string;
  broker_id?: string;
  expected_amount: number;
  received_amount: number;
  difference: number;
  expected_date: Date;
  payment_date?: Date;
  reference_month?: string;
  status: FinancialStatus;
  days_overdue: number;
  calculated_status?: string;
  has_alert: boolean;
  alert_message?: string;
  revenue_source?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Activity {
  id: string;
  tenant_id: string;
  lead_id?: string;
  property_id?: string;
  contract_id?: string;
  user_id?: string;
  type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface WhatsAppMessage {
  id: string;
  tenant_id: string;
  lead_id?: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  content?: string;
  media_url?: string;
  is_read: boolean;
  is_bot: boolean;
  whatsapp_id?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface RadarInsight {
  id: string;
  date: Date;
  keyword: string;
  search_volume?: number;
  trend_score?: number;
  region?: string;
  property_type?: PropertyType;
  price_range?: string;
  raw_data: Record<string, any>;
  created_at: Date;
}

export interface AnalyticsCache {
  id: string;
  tenant_id: string;
  metric_type: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  value: Record<string, any>;
  created_at: Date;
}

// ============================================================================
// REQUEST/RESPONSE TYPES (API)
// ============================================================================

export interface CreateLeadRequest {
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  interest_type?: PropertyType;
  budget_min?: number;
  budget_max?: number;
  desired_region?: string[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  phone?: string;
  email?: string;
  status?: LeadStatus;
  score?: LeadScore;
  profile_summary?: string;
  interest_type?: PropertyType;
  budget_min?: number;
  budget_max?: number;
  desired_region?: string[];
  timeline?: string;
  assigned_to?: string;
  visit_scheduled_at?: Date;
}

export interface CreatePropertyRequest {
  type: PropertyType;
  purpose: PropertyPurpose;
  title?: string;
  description?: string;
  neighborhood: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  area?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parking_spaces?: number;
  orientation?: PropertyOrientation;
  amenities?: string[];
  price: number;
  condominium_fee?: number;
  iptu?: number;
  broker_code?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
}

export interface CreateContractRequest {
  lead_id?: string;
  property_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_cpf_cnpj: string;
  client_address?: string;
  type: ContractType;
  broker_id?: string;
}

export interface CreateFinancialRequest {
  type: FinancialType;
  category: FinancialCategory;
  description: string;
  lead_id?: string;
  property_id?: string;
  contract_id?: string;
  broker_id?: string;
  expected_amount: number;
  expected_date: Date;
  reference_month?: string;
  revenue_source?: string;
}

// ============================================================================
// VIEW TYPES (Para dashboards e relatórios)
// ============================================================================

export interface SalesPipeline {
  tenant_id: string;
  tenant_name: string;
  status: LeadStatus;
  lead_count: number;
  potential_value: number;
}

export interface MonthlyFinancial {
  tenant_id: string;
  reference_month: string;
  type: FinancialType;
  total_expected: number;
  total_received: number;
  total_difference: number;
}

export interface BrokerPerformance {
  broker_id: string;
  broker_name: string;
  tenant_id: string;
  total_leads: number;
  closed_deals: number;
  conversion_rate: number;
  total_commission: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LeadWithRelations = Lead & {
  assigned_user?: User;
  properties?: Property[];
  contracts?: Contract[];
  financial?: Financial[];
  activities?: Activity[];
  whatsapp_messages?: WhatsAppMessage[];
};

export type PropertyWithRelations = Property & {
  leads?: Lead[];
  contracts?: Contract[];
};

export type ContractWithRelations = Contract & {
  lead?: Lead;
  property?: Property;
  broker?: User;
  financial?: Financial[];
};

export type FinancialWithRelations = Financial & {
  lead?: Lead;
  property?: Property;
  contract?: Contract;
  broker?: User;
};

// ============================================================================
// FILTER TYPES (Para queries)
// ============================================================================

export interface LeadFilters {
  status?: LeadStatus | LeadStatus[];
  score?: LeadScore | LeadScore[];
  source?: LeadSource | LeadSource[];
  assigned_to?: string;
  created_after?: Date;
  created_before?: Date;
  budget_min?: number;
  budget_max?: number;
  search?: string; // Full-text search
}

export interface PropertyFilters {
  type?: PropertyType | PropertyType[];
  purpose?: PropertyPurpose | PropertyPurpose[];
  status?: PropertyStatus | PropertyStatus[];
  neighborhood?: string | string[];
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  parking_spaces?: number;
  search?: string;
}

export interface FinancialFilters {
  type?: FinancialType;
  status?: FinancialStatus | FinancialStatus[];
  category?: FinancialCategory | FinancialCategory[];
  reference_month?: string;
  broker_id?: string;
  expected_date_from?: Date;
  expected_date_to?: Date;
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// WEBHOOK PAYLOADS
// ============================================================================

export interface LeadWebhookPayload {
  event: 'lead.created' | 'lead.updated' | 'lead.status_changed';
  tenant_id: string;
  lead: Lead;
  changes?: Partial<Lead>;
}

export interface ContractWebhookPayload {
  event: 'contract.sent' | 'contract.signed' | 'contract.updated';
  tenant_id: string;
  contract: Contract;
}

export interface PropertyWebhookPayload {
  event: 'property.published' | 'property.sold' | 'property.updated';
  tenant_id: string;
  property: Property;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface DashboardMetrics {
  total_leads: number;
  leads_this_month: number;
  leads_growth: number; // Percentual
  conversion_rate: number;
  pipeline_value: number;
  closed_deals_this_month: number;
  revenue_this_month: number;
  revenue_vs_expected: number; // Percentual
  avg_deal_size: number;
  avg_time_to_close: number; // Em dias
}

export interface LeadsBySource {
  source: LeadSource;
  count: number;
  percentage: number;
  conversion_rate: number;
}

export interface LeadsByStatus {
  status: LeadStatus;
  count: number;
  percentage: number;
  value: number;
}

export interface MonthlyRevenue {
  month: string;
  expected: number;
  received: number;
  difference: number;
}

// ============================================================================
// FORM TYPES (Para validação com Zod)
// ============================================================================

export type LeadFormData = Omit<CreateLeadRequest, 'source'> & {
  source?: LeadSource;
};

export type PropertyFormData = CreatePropertyRequest;

export type ContractFormData = CreateContractRequest;

export type FinancialFormData = CreateFinancialRequest;