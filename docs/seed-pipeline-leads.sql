-- ============================================
-- SEED: Default Lead Pipeline & Stages
-- ============================================
-- This script creates the default pipeline for Lead management
-- with all standard stages for the real estate sales funnel
-- ============================================

-- IMPORTANT: Replace {TENANT_ID} with your actual tenant UUID
-- Get it from: SELECT id FROM tenants WHERE slug = 'your-slug';

DO $$
DECLARE
  v_tenant_id UUID := '{TENANT_ID}'; -- REPLACE THIS
  v_pipeline_id UUID;
BEGIN

  -- ============================================
  -- 1. CREATE DEFAULT LEAD PIPELINE
  -- ============================================
  INSERT INTO pipelines (tenant_id, name, is_default, is_active)
  VALUES (v_tenant_id, 'Lead Management', TRUE, TRUE)
  RETURNING id INTO v_pipeline_id;

  RAISE NOTICE 'Created pipeline with ID: %', v_pipeline_id;

  -- ============================================
  -- 2. CREATE PIPELINE STAGES
  -- ============================================

  -- Stage 1: New Lead (Gray)
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'New Lead', '#6B7280', 0, FALSE, FALSE);

  -- Stage 2: Contacted (Blue)
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'Contacted', '#3B82F6', 1, FALSE, FALSE);

  -- Stage 3: Qualified (Purple)
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'Qualified', '#8B5CF6', 2, FALSE, FALSE);

  -- Stage 4: Visit Scheduled (Yellow)
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'Visit Scheduled', '#F59E0B', 3, FALSE, FALSE);

  -- Stage 5: Proposal Sent (Indigo)
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'Proposal Sent', '#6366F1', 4, FALSE, FALSE);

  -- Stage 6: Negotiation (Orange)
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'Negotiation', '#F97316', 5, FALSE, FALSE);

  -- Stage 7: Won (Green) - Final success stage
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'Won', '#10B981', 6, TRUE, FALSE);

  -- Stage 8: Lost (Red) - Final failure stage
  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES (v_tenant_id, v_pipeline_id, 'Lost', '#EF4444', 7, FALSE, TRUE);

  RAISE NOTICE 'Created 8 pipeline stages for Lead Management';

END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after executing the script above to verify:
--
-- SELECT
--   p.name as pipeline_name,
--   p.is_default,
--   ps.name as stage_name,
--   ps.color,
--   ps.position,
--   ps.is_won,
--   ps.is_lost
-- FROM pipelines p
-- JOIN pipeline_stages ps ON ps.pipeline_id = p.id
-- WHERE p.tenant_id = '{TENANT_ID}'
-- ORDER BY ps.position;
-- ============================================

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
-- 1. Get your tenant_id:
--    SELECT id FROM tenants WHERE slug = 'your-slug';
--
-- 2. Replace {TENANT_ID} in line 11 with the actual UUID
--
-- 3. Execute this entire script in Supabase SQL Editor
--
-- 4. Verify with the query above
--
-- 5. Now you can create deals that reference these stages!
-- ============================================
