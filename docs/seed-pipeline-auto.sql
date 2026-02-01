-- ============================================
-- AUTO-SEED: Default Lead Pipeline & Stages
-- ============================================
-- This version automatically finds your tenant by slug
-- No manual UUID replacement needed!
-- ============================================

-- STEP 1: Set your tenant slug here:
\set TENANT_SLUG 'minha-imobiliaria'

-- STEP 2: Execute this entire script

DO $$
DECLARE
  v_tenant_id UUID;
  v_pipeline_id UUID;
  v_tenant_slug TEXT := :'TENANT_SLUG';
BEGIN

  -- Find tenant by slug
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE slug = v_tenant_slug;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant with slug "%" not found', v_tenant_slug;
  END IF;

  RAISE NOTICE 'Found tenant: % (ID: %)', v_tenant_slug, v_tenant_id;

  -- Check if default pipeline already exists
  IF EXISTS (
    SELECT 1 FROM pipelines
    WHERE tenant_id = v_tenant_id AND is_default = TRUE
  ) THEN
    RAISE NOTICE 'Default pipeline already exists for this tenant';
    RETURN;
  END IF;

  -- ============================================
  -- CREATE DEFAULT LEAD PIPELINE
  -- ============================================
  INSERT INTO pipelines (tenant_id, name, is_default, is_active)
  VALUES (v_tenant_id, 'Lead Management', TRUE, TRUE)
  RETURNING id INTO v_pipeline_id;

  RAISE NOTICE 'Created pipeline: Lead Management (ID: %)', v_pipeline_id;

  -- ============================================
  -- CREATE PIPELINE STAGES
  -- ============================================

  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES
    (v_tenant_id, v_pipeline_id, 'New Lead', '#6B7280', 0, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Contacted', '#3B82F6', 1, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Qualified', '#8B5CF6', 2, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Visit Scheduled', '#F59E0B', 3, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Proposal Sent', '#6366F1', 4, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Negotiation', '#F97316', 5, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Won', '#10B981', 6, TRUE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Lost', '#EF4444', 7, FALSE, TRUE);

  RAISE NOTICE 'Created 8 pipeline stages';
  RAISE NOTICE '✓ Pipeline setup complete!';

END $$;
