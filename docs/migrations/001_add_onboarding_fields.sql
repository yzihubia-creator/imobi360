-- ============================================
-- MIGRATION: Add Onboarding Fields
-- Version: 001
-- Date: 2026-02-01
-- ============================================
-- Adds fields required for V1 onboarding flow

-- Add onboarding_completed_at to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add business_type to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS business_type TEXT;

COMMENT ON COLUMN tenants.onboarding_completed_at IS 'Timestamp when tenant completed onboarding flow';
COMMENT ON COLUMN tenants.business_type IS 'Type of business: Imobiliária, Corretor autônomo, Incorporadora, Outro';

-- Update existing active tenants to mark onboarding as completed
-- (Prevents breaking existing installations)
UPDATE tenants
SET onboarding_completed_at = created_at
WHERE status = 'active'
  AND onboarding_completed_at IS NULL;
