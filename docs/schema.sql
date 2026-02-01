-- ============================================
-- YZIHUB - CANONICAL DATABASE SCHEMA
-- Product: IMOBI360 CRM
-- Version: 1.0.0
-- Status: PRODUCTION
-- Last Updated: 2026-02-01
-- ============================================
--
-- IMPORTANT: This is the single source of truth for YZIHUB database structure.
-- Do NOT apply changes directly to production without review.
-- All schema changes MUST update this file.
--
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- Tenant Plans (SaaS tier)
CREATE TYPE tenant_plan AS ENUM ('free', 'pro', 'enterprise');

-- Tenant Status (lifecycle)
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'cancelled');

-- User Roles (RBAC)
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member', 'viewer');

-- Contact Types (leads vs customers)
CREATE TYPE contact_type AS ENUM ('lead', 'customer', 'partner', 'other');

-- Contact Status (lifecycle)
CREATE TYPE contact_status AS ENUM ('active', 'inactive', 'archived');

-- Deal Status (sales outcome)
CREATE TYPE deal_status AS ENUM ('open', 'won', 'lost');

-- Activity Types (interactions)
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note');

-- Activity Status (completion state)
CREATE TYPE activity_status AS ENUM ('pending', 'completed', 'cancelled');

-- Event Types (audit log)
CREATE TYPE event_type AS ENUM (
  'created',
  'updated',
  'deleted',
  'stage_changed',
  'status_changed'
);

-- Custom Field Types (dynamic fields)
CREATE TYPE field_type AS ENUM (
  'text',
  'number',
  'date',
  'select',
  'multiselect',
  'boolean'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- --------------------------------------------
-- tenants: Multi-tenant root
-- --------------------------------------------
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  plan tenant_plan NOT NULL DEFAULT 'free',
  status tenant_status NOT NULL DEFAULT 'active',
  business_type TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tenants_slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
  CONSTRAINT tenants_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

COMMENT ON TABLE tenants IS 'Multi-tenant root entity. One row per customer organization.';
COMMENT ON COLUMN tenants.slug IS 'URL-safe unique identifier for tenant (e.g., acme-corp)';
COMMENT ON COLUMN tenants.business_type IS 'Type of business: Imobiliária, Corretor autônomo, Incorporadora, Outro';
COMMENT ON COLUMN tenants.onboarding_completed_at IS 'Timestamp when tenant completed onboarding flow';
COMMENT ON COLUMN tenants.settings IS 'Tenant-level configuration (JSONB for flexibility)';

-- --------------------------------------------
-- users: Team members (per tenant)
-- --------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  auth_user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT users_email_unique_per_tenant UNIQUE (tenant_id, email),
  CONSTRAINT users_auth_user_id_unique UNIQUE (auth_user_id),
  CONSTRAINT users_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

COMMENT ON TABLE users IS 'Team members within a tenant. Links to Supabase auth.users via auth_user_id.';
COMMENT ON COLUMN users.auth_user_id IS 'Reference to auth.users.id (Supabase Authentication)';
COMMENT ON COLUMN users.role IS 'RBAC role: admin > manager > member > viewer';

-- --------------------------------------------
-- contacts: Leads & Customers
-- --------------------------------------------
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type contact_type NOT NULL DEFAULT 'lead',
  status contact_status NOT NULL DEFAULT 'active',
  source TEXT,
  assigned_to UUID,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_contacts_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_contacts_assigned_to FOREIGN KEY (assigned_to)
    REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT contacts_email_format CHECK (
    email IS NULL OR email ~* '^[^@]+@[^@]+\.[^@]+$'
  )
);

COMMENT ON TABLE contacts IS 'Leads and customers. Type field distinguishes lifecycle stage.';
COMMENT ON COLUMN contacts.type IS 'lead = potential customer, customer = paying customer';
COMMENT ON COLUMN contacts.source IS 'Lead source (e.g., website, referral, facebook)';
COMMENT ON COLUMN contacts.custom_fields IS 'Dynamic fields defined in custom_fields table';

-- --------------------------------------------
-- pipelines: Sales Pipeline Configuration
-- --------------------------------------------
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_pipelines_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT pipelines_name_unique_per_tenant UNIQUE (tenant_id, name)
);

COMMENT ON TABLE pipelines IS 'Sales pipeline configurations. Tenants can have multiple pipelines.';
COMMENT ON COLUMN pipelines.is_default IS 'Default pipeline for new deals (only one per tenant)';

-- --------------------------------------------
-- pipeline_stages: Pipeline Stages/Steps
-- --------------------------------------------
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  pipeline_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  position INTEGER NOT NULL,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  is_lost BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_pipeline_stages_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_pipeline_stages_pipeline FOREIGN KEY (pipeline_id)
    REFERENCES pipelines(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT pipeline_stages_name_unique_per_pipeline
    UNIQUE (pipeline_id, name),
  CONSTRAINT pipeline_stages_position_unique_per_pipeline
    UNIQUE (pipeline_id, position),
  CONSTRAINT pipeline_stages_color_format CHECK (
    color IS NULL OR color ~* '^#[0-9A-F]{6}$'
  ),
  CONSTRAINT pipeline_stages_not_both_won_lost CHECK (
    NOT (is_won = TRUE AND is_lost = TRUE)
  )
);

COMMENT ON TABLE pipeline_stages IS 'Stages within a pipeline. Position determines order.';
COMMENT ON COLUMN pipeline_stages.is_won IS 'Mark deals in this stage as won';
COMMENT ON COLUMN pipeline_stages.is_lost IS 'Mark deals in this stage as lost';

-- --------------------------------------------
-- deals: Sales Opportunities
-- --------------------------------------------
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contact_id UUID,
  pipeline_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  title TEXT NOT NULL,
  value NUMERIC(15, 2),
  status deal_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_deals_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_deals_pipeline FOREIGN KEY (pipeline_id)
    REFERENCES pipelines(id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_stage FOREIGN KEY (stage_id)
    REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  CONSTRAINT fk_deals_assigned_to FOREIGN KEY (assigned_to)
    REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT deals_value_positive CHECK (value IS NULL OR value >= 0),
  CONSTRAINT deals_closed_at_for_closed_deals CHECK (
    (status != 'open') = (closed_at IS NOT NULL)
  )
);

COMMENT ON TABLE deals IS 'Sales opportunities. Moves through pipeline stages.';
COMMENT ON COLUMN deals.value IS 'Deal value in tenant currency (2 decimal precision)';
COMMENT ON COLUMN deals.closed_at IS 'Timestamp when deal was won or lost';

-- --------------------------------------------
-- activities: Tasks, Calls, Meetings
-- --------------------------------------------
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contact_id UUID,
  deal_id UUID,
  user_id UUID NOT NULL,
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status activity_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_activities_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_deal FOREIGN KEY (deal_id)
    REFERENCES deals(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT activities_completed_at_for_completed CHECK (
    (status = 'completed') = (completed_at IS NOT NULL)
  )
);

COMMENT ON TABLE activities IS 'Customer interactions: calls, emails, meetings, tasks, notes.';
COMMENT ON COLUMN activities.contact_id IS 'Optional link to contact';
COMMENT ON COLUMN activities.deal_id IS 'Optional link to deal';

-- --------------------------------------------
-- events: Audit Log & Automation Trigger
-- --------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type event_type NOT NULL,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_events_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT events_processed_at_for_processed CHECK (
    (processed = TRUE) = (processed_at IS NOT NULL)
  )
);

COMMENT ON TABLE events IS 'Audit log + automation trigger queue. Immutable by design.';
COMMENT ON COLUMN events.entity_type IS 'Entity type (deal, contact, activity, etc.)';
COMMENT ON COLUMN events.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN events.payload IS 'Event-specific data (changed fields, user info, etc.)';
COMMENT ON COLUMN events.processed IS 'Marks if automation processed this event';

-- --------------------------------------------
-- custom_fields: Dynamic Field Definitions
-- --------------------------------------------
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type field_type NOT NULL,
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_custom_fields_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT custom_fields_unique_per_entity
    UNIQUE (tenant_id, entity_type, field_name)
);

COMMENT ON TABLE custom_fields IS 'Dynamic field definitions. Airtable-style extensibility.';
COMMENT ON COLUMN custom_fields.entity_type IS 'deal, contact, activity, etc.';
COMMENT ON COLUMN custom_fields.field_name IS 'Programmatic field name (snake_case)';
COMMENT ON COLUMN custom_fields.field_label IS 'Human-readable label';
COMMENT ON COLUMN custom_fields.options IS 'Field-specific config (select options, formulas, etc.)';

-- --------------------------------------------
-- tags: Tagging System
-- --------------------------------------------
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_tags_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT tags_name_unique_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT tags_color_format CHECK (
    color IS NULL OR color ~* '^#[0-9A-F]{6}$'
  )
);

COMMENT ON TABLE tags IS 'Tag definitions. Can be applied to any entity via entity_tags.';

-- --------------------------------------------
-- entity_tags: Tag Assignments
-- --------------------------------------------
CREATE TABLE entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_entity_tags_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_entity_tags_tag FOREIGN KEY (tag_id)
    REFERENCES tags(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT entity_tags_unique_assignment
    UNIQUE (tenant_id, tag_id, entity_type, entity_id)
);

COMMENT ON TABLE entity_tags IS 'Many-to-many tag assignments. Flexible entity_type pattern.';
COMMENT ON COLUMN entity_tags.entity_type IS 'deal, contact, activity, etc.';

-- ============================================
-- INDEXES (Performance)
-- ============================================

-- Tenant lookup indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_deals_tenant_id ON deals(tenant_id);
CREATE INDEX idx_pipelines_tenant_id ON pipelines(tenant_id);
CREATE INDEX idx_pipeline_stages_tenant_id ON pipeline_stages(tenant_id);
CREATE INDEX idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_custom_fields_tenant_id ON custom_fields(tenant_id);
CREATE INDEX idx_tags_tenant_id ON tags(tenant_id);
CREATE INDEX idx_entity_tags_tenant_id ON entity_tags(tenant_id);

-- Foreign key indexes
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_pipeline_id ON deals(pipeline_id);
CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_deal_id ON activities(deal_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_entity_tags_tag_id ON entity_tags(tag_id);

-- Composite indexes (tenant + entity lookups)
CREATE INDEX idx_events_tenant_entity ON events(tenant_id, entity_type, entity_id);
CREATE INDEX idx_custom_fields_tenant_entity ON custom_fields(tenant_id, entity_type);
CREATE INDEX idx_entity_tags_tenant_entity ON entity_tags(tenant_id, entity_type, entity_id);

-- Events processing index
CREATE INDEX idx_events_unprocessed ON events(tenant_id, processed, created_at)
  WHERE processed = FALSE;

-- Activity scheduling index
CREATE INDEX idx_activities_scheduled ON activities(tenant_id, scheduled_at)
  WHERE status = 'pending' AND scheduled_at IS NOT NULL;

-- Email lookup (case-insensitive)
CREATE INDEX idx_users_email_lower ON users(tenant_id, LOWER(email));
CREATE INDEX idx_contacts_email_lower ON contacts(tenant_id, LOWER(email))
  WHERE email IS NOT NULL;

-- ============================================
-- TRIGGERS (Automated Behaviors)
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEMA VERSION
-- ============================================

CREATE TABLE IF NOT EXISTS schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial canonical schema for YZIHUB IMOBI360');

-- ============================================
-- END OF CANONICAL SCHEMA
-- ============================================
