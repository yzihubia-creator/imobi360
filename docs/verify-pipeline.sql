-- ============================================
-- VERIFY PIPELINE SETUP
-- ============================================
-- Run this to check your pipeline configuration
-- ============================================

-- OPTION 1: Check all pipelines for all tenants
SELECT
  t.name as tenant_name,
  t.slug as tenant_slug,
  p.name as pipeline_name,
  p.is_default,
  p.is_active,
  COUNT(ps.id) as stage_count
FROM tenants t
JOIN pipelines p ON p.tenant_id = t.id
LEFT JOIN pipeline_stages ps ON ps.pipeline_id = p.id
GROUP BY t.name, t.slug, p.name, p.is_default, p.is_active
ORDER BY t.name, p.name;

-- OPTION 2: Detailed view of stages for a specific tenant
-- Replace 'your-tenant-slug' with your actual tenant slug
SELECT
  t.name as tenant,
  p.name as pipeline,
  ps.position,
  ps.name as stage_name,
  ps.color,
  CASE
    WHEN ps.is_won THEN '✓ Won'
    WHEN ps.is_lost THEN '✗ Lost'
    ELSE '• Active'
  END as stage_type
FROM tenants t
JOIN pipelines p ON p.tenant_id = t.id
JOIN pipeline_stages ps ON ps.pipeline_id = p.id
WHERE t.slug = 'minha-imobiliaria'
ORDER BY ps.position;

-- OPTION 3: Check if default pipeline exists
SELECT
  t.slug,
  EXISTS (
    SELECT 1 FROM pipelines
    WHERE tenant_id = t.id AND is_default = TRUE
  ) as has_default_pipeline
FROM tenants t;

-- OPTION 4: Count deals per stage (useful after adding deals)
SELECT
  ps.name as stage,
  ps.position,
  COUNT(d.id) as deal_count,
  SUM(d.value) as total_value
FROM pipeline_stages ps
LEFT JOIN deals d ON d.stage_id = ps.id AND d.status = 'open'
GROUP BY ps.id, ps.name, ps.position
ORDER BY ps.position;
