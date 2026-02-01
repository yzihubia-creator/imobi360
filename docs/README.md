# Database Documentation

This folder contains all database-related scripts and documentation for the YZIHUB CRM project.

## Files Overview

### Schema & Setup

#### `imobi360-schema.sql` (6.5 KB)
Core database schema with all tables, enums, and foreign keys.

**Contents**:
- 11 tables (tenants, users, contacts, pipelines, pipeline_stages, deals, activities, events, custom_fields, tags, entity_tags)
- 9 enums (tenant_plan, tenant_status, user_role, contact_type, contact_status, deal_status, activity_type, activity_status, event_type)
- Foreign key constraints
- Multi-tenancy structure

**When to use**: Initial database setup or schema reference

#### `SETUP-DATABASE.md` (4.8 KB)
Step-by-step guide for initial database setup.

**When to use**: First-time database configuration

---

### Seed Data

#### `supabase-seed.sql` (4.1 KB)
Legacy seed script with sample tenant, users, properties, and leads.

**Status**: ⚠️ Outdated (uses old table structure)
**Note**: Needs update to match current schema

---

### Pipeline Seeding ⭐ NEW

#### `seed-pipeline-leads.sql` (3.7 KB)
Manual UUID version for seeding default Lead Management pipeline.

**Features**:
- Creates "Lead Management" pipeline
- Creates 8 standard stages (New Lead → Won/Lost)
- Requires manual tenant_id replacement
- Full PostgreSQL procedure
- Includes verification query

**When to use**: If you prefer explicit control and manual UUID input

#### `seed-pipeline-auto.sql` (2.3 KB) ⭐ RECOMMENDED
Automatic tenant lookup version for seeding pipeline.

**Features**:
- Finds tenant by slug automatically
- No manual UUID replacement needed
- Prevents duplicate pipelines
- Idempotent (safe to re-run)
- Clear progress messages

**When to use**: Best for most users, easiest setup

#### `verify-pipeline.sql` (1.6 KB)
Verification queries to confirm pipeline setup.

**Contents**:
- 4 different verification views
- Stage count and deal statistics
- Default pipeline checks
- Tenant-specific queries

**When to use**: After running pipeline seed scripts

#### `PIPELINE-SETUP.md` (6.8 KB)
Complete guide for pipeline setup and usage.

**Contents**:
- Installation methods (automatic & manual)
- Stage configuration details
- Verification instructions
- API integration examples
- Customization guide
- Troubleshooting section

**When to use**: Reference for pipeline setup and management

---

## Quick Start Guide

### 1. Initial Database Setup

```bash
# Execute schema in Supabase SQL Editor
1. Open imobi360-schema.sql
2. Execute entire script
3. Verify tables created
```

### 2. Create Tenant

```sql
-- In Supabase SQL Editor
INSERT INTO tenants (name, slug, email, plan, status)
VALUES ('Your Company', 'your-company', 'you@company.com', 'pro', 'active')
RETURNING id;
```

### 3. Seed Pipeline (Recommended Method)

```bash
# Use automatic version
1. Open seed-pipeline-auto.sql
2. Edit line 10: \set TENANT_SLUG 'your-company'
3. Execute entire script
4. Verify with verify-pipeline.sql
```

### 4. Verify Setup

```sql
-- Run from verify-pipeline.sql
SELECT
  t.name as tenant,
  p.name as pipeline,
  COUNT(ps.id) as stages
FROM tenants t
JOIN pipelines p ON p.tenant_id = t.id
LEFT JOIN pipeline_stages ps ON ps.pipeline_id = p.id
WHERE t.slug = 'your-company'
GROUP BY t.name, p.name;

-- Expected: 1 pipeline with 8 stages
```

---

## Execution Order

Follow this sequence for a fresh database:

1. ✅ `imobi360-schema.sql` - Create all tables and enums
2. ✅ Create tenant manually (SQL INSERT)
3. ✅ Create Supabase Auth user
4. ✅ Link auth user to tenant via users table
5. ✅ `seed-pipeline-auto.sql` - Seed default pipeline
6. ✅ `verify-pipeline.sql` - Confirm setup
7. ⏭️ Use application (Leads API, Kanban UI, etc.)

---

## File Status

| File | Status | Purpose |
|------|--------|---------|
| `imobi360-schema.sql` | ✅ Current | Core schema |
| `SETUP-DATABASE.md` | ✅ Current | Setup guide |
| `supabase-seed.sql` | ⚠️ Outdated | Sample data |
| `seed-pipeline-leads.sql` | ✅ Current | Pipeline (manual) |
| `seed-pipeline-auto.sql` | ✅ Current | Pipeline (auto) ⭐ |
| `verify-pipeline.sql` | ✅ Current | Verification |
| `PIPELINE-SETUP.md` | ✅ Current | Pipeline guide |

---

## Common Tasks

### Add Another Pipeline

```sql
INSERT INTO pipelines (tenant_id, name, is_default, is_active)
VALUES ('YOUR_TENANT_ID', 'Rental Pipeline', FALSE, TRUE);
```

### Add Custom Stage

```sql
INSERT INTO pipeline_stages (
  tenant_id,
  pipeline_id,
  name,
  color,
  position,
  is_won,
  is_lost
) VALUES (
  'YOUR_TENANT_ID',
  'PIPELINE_ID',
  'Custom Stage',
  '#A78BFA',
  2.5, -- Between existing stages
  FALSE,
  FALSE
);
```

### Check Pipeline Status

```sql
SELECT * FROM pipelines WHERE tenant_id = 'YOUR_TENANT_ID';
SELECT * FROM pipeline_stages WHERE pipeline_id = 'PIPELINE_ID' ORDER BY position;
```

---

## Troubleshooting

### "Tenant not found" Error
Check tenant exists: `SELECT * FROM tenants;`

### "Default pipeline already exists"
Safe to ignore. Script won't create duplicates.

### Foreign Key Errors
Ensure tenant_id and pipeline_id exist before inserting stages.

### Schema Mismatch
Re-run `imobi360-schema.sql` to reset structure.

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Enums](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Multi-tenancy Patterns](https://docs.supabase.com/guides/auth/row-level-security)

---

**Last Updated**: January 27, 2026
**Schema Version**: 1.0
**Pipeline Version**: 1.0
