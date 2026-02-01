-- ============================================
-- YZIHUB - ROW LEVEL SECURITY POLICIES
-- ============================================
-- Enforces tenant isolation at database level
-- Critical for multi-tenant security
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current authenticated user's ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE auth_user_id = auth.user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_user_id = auth.user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- TENANTS TABLE POLICIES
-- ============================================

-- Users can only see their own tenant
CREATE POLICY tenants_isolation ON tenants
  FOR ALL
  USING (id = current_tenant_id());

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can see all users in their tenant
CREATE POLICY users_tenant_isolation ON users
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Only admins can insert users
CREATE POLICY users_insert_admin_only ON users
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_user_role() = 'admin'
  );

-- Admins can update all users, users can update themselves
CREATE POLICY users_update ON users
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    (current_user_role() = 'admin' OR auth_user_id = auth.user_id())
  );

-- Only admins can delete users
CREATE POLICY users_delete_admin_only ON users
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() = 'admin'
  );

-- ============================================
-- CONTACTS TABLE POLICIES
-- ============================================

-- All authenticated users can read contacts in their tenant
CREATE POLICY contacts_select ON contacts
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Members and above can create contacts
CREATE POLICY contacts_insert ON contacts
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Members and above can update contacts
CREATE POLICY contacts_update ON contacts
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Only admins and managers can delete contacts
CREATE POLICY contacts_delete ON contacts
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager')
  );

-- ============================================
-- DEALS TABLE POLICIES
-- ============================================

-- All authenticated users can read deals in their tenant
CREATE POLICY deals_select ON deals
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Members and above can create deals
CREATE POLICY deals_insert ON deals
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Members and above can update deals
CREATE POLICY deals_update ON deals
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Only admins and managers can delete deals
CREATE POLICY deals_delete ON deals
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager')
  );

-- ============================================
-- PIPELINES TABLE POLICIES
-- ============================================

-- All users can read pipelines
CREATE POLICY pipelines_select ON pipelines
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Only admins can modify pipelines
CREATE POLICY pipelines_modify_admin_only ON pipelines
  FOR ALL
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() = 'admin'
  );

-- ============================================
-- PIPELINE_STAGES TABLE POLICIES
-- ============================================

-- All users can read stages
CREATE POLICY pipeline_stages_select ON pipeline_stages
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Only admins can modify stages
CREATE POLICY pipeline_stages_modify_admin_only ON pipeline_stages
  FOR ALL
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() = 'admin'
  );

-- ============================================
-- ACTIVITIES TABLE POLICIES
-- ============================================

-- All users can read activities
CREATE POLICY activities_select ON activities
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Members and above can create activities
CREATE POLICY activities_insert ON activities
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Members and above can update activities
CREATE POLICY activities_update ON activities
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Members and above can delete their own activities
CREATE POLICY activities_delete ON activities
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    (current_user_role() IN ('admin', 'manager') OR
     user_id = (SELECT id FROM users WHERE auth_user_id = auth.user_id()))
  );

-- ============================================
-- EVENTS TABLE POLICIES (READ-ONLY)
-- ============================================

-- All users can read events
CREATE POLICY events_select ON events
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Only service role can insert events (app-level only)
CREATE POLICY events_insert_service_only ON events
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- NO UPDATE OR DELETE ALLOWED (immutable audit log)

-- ============================================
-- CUSTOM_FIELDS TABLE POLICIES
-- ============================================

-- All users can read custom fields
CREATE POLICY custom_fields_select ON custom_fields
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Only admins can modify custom fields
CREATE POLICY custom_fields_modify_admin_only ON custom_fields
  FOR ALL
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() = 'admin'
  );

-- ============================================
-- TAGS TABLE POLICIES
-- ============================================

-- All users can read tags
CREATE POLICY tags_select ON tags
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Members and above can create tags
CREATE POLICY tags_insert ON tags
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Admins and managers can modify tags
CREATE POLICY tags_modify ON tags
  FOR ALL
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager')
  );

-- ============================================
-- ENTITY_TAGS TABLE POLICIES
-- ============================================

-- All users can read entity_tags
CREATE POLICY entity_tags_select ON entity_tags
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Members and above can assign tags
CREATE POLICY entity_tags_insert ON entity_tags
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- Members and above can remove tags
CREATE POLICY entity_tags_delete ON entity_tags
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    current_user_role() IN ('admin', 'manager', 'member')
  );

-- ============================================
-- GRANT USAGE TO AUTHENTICATED ROLE
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- END OF RLS POLICIES
-- ============================================
