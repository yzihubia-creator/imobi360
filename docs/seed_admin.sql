-- ============================================
-- YZIHUB - ADMIN SEED
-- ============================================
-- Creates initial admin tenant, user, and workspace
-- Safe to re-run (idempotent)
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_pipeline_id UUID;
BEGIN

  -- ============================================
  -- 1. CREATE ADMIN TENANT
  -- ============================================

  INSERT INTO tenants (
    slug,
    name,
    email,
    plan,
    status
  )
  VALUES (
    'yzihub-admin',
    'YZIHUB Admin',
    'admin@yzihub.com',
    'enterprise',
    'active'
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Tenant created/updated: % (ID: %)', 'yzihub-admin', v_tenant_id;

  -- ============================================
  -- 2. CREATE ADMIN USER
  -- ============================================

  INSERT INTO users (
    tenant_id,
    name,
    email,
    role,
    is_active
  )
  VALUES (
    v_tenant_id,
    'System Administrator',
    'admin@yzihub.com',
    'admin',
    TRUE
  )
  ON CONFLICT (tenant_id, email) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW()
  RETURNING id INTO v_user_id;

  RAISE NOTICE 'Admin user created/updated: % (ID: %)', 'admin@yzihub.com', v_user_id;

  -- ============================================
  -- 3. CREATE DEFAULT PIPELINE
  -- ============================================

  INSERT INTO pipelines (
    tenant_id,
    name,
    is_default,
    is_active
  )
  VALUES (
    v_tenant_id,
    'Sales Pipeline',
    TRUE,
    TRUE
  )
  ON CONFLICT (tenant_id, name) DO UPDATE
  SET
    is_default = EXCLUDED.is_default,
    is_active = EXCLUDED.is_active
  RETURNING id INTO v_pipeline_id;

  RAISE NOTICE 'Default pipeline created/updated: % (ID: %)', 'Sales Pipeline', v_pipeline_id;

  -- ============================================
  -- 4. CREATE PIPELINE STAGES
  -- ============================================

  INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, color, position, is_won, is_lost)
  VALUES
    (v_tenant_id, v_pipeline_id, 'New Lead', '#6B7280', 0, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Contacted', '#3B82F6', 1, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Qualified', '#8B5CF6', 2, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Proposal', '#6366F1', 3, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Negotiation', '#F59E0B', 4, FALSE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Won', '#10B981', 5, TRUE, FALSE),
    (v_tenant_id, v_pipeline_id, 'Lost', '#EF4444', 6, FALSE, TRUE)
  ON CONFLICT (pipeline_id, name) DO UPDATE
  SET
    color = EXCLUDED.color,
    position = EXCLUDED.position,
    is_won = EXCLUDED.is_won,
    is_lost = EXCLUDED.is_lost;

  RAISE NOTICE 'Pipeline stages created/updated (7 stages)';

  -- ============================================
  -- SUCCESS
  -- ============================================

  RAISE NOTICE '✓ Admin seed complete!';
  RAISE NOTICE 'Tenant: yzihub-admin';
  RAISE NOTICE 'Admin Email: admin@yzihub.com';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create auth user in Supabase Auth with email: admin@yzihub.com';
  RAISE NOTICE '2. Link auth user to domain user:';
  RAISE NOTICE '   UPDATE users SET auth_user_id = (SELECT id FROM auth.users WHERE email = ''admin@yzihub.com'') WHERE id = ''%'';', v_user_id;

END $$;
