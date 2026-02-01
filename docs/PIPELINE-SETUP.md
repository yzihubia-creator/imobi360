# Pipeline Setup Guide

## Overview
This guide explains how to seed the default Lead Management pipeline with initial stages for your CRM.

## What Gets Created

### Default Pipeline: "Lead Management"
- **Name**: Lead Management
- **Status**: Active
- **Default**: Yes (is_default = true)

### Pipeline Stages (8 stages)

| Position | Stage Name | Color | Type | Purpose |
|----------|-----------|-------|------|---------|
| 0 | New Lead | Gray (#6B7280) | Active | First contact, unprocessed leads |
| 1 | Contacted | Blue (#3B82F6) | Active | Initial contact made |
| 2 | Qualified | Purple (#8B5CF6) | Active | Lead meets criteria, potential customer |
| 3 | Visit Scheduled | Yellow (#F59E0B) | Active | Property visit scheduled |
| 4 | Proposal Sent | Indigo (#6366F1) | Active | Formal proposal delivered |
| 5 | Negotiation | Orange (#F97316) | Active | Price/terms negotiation |
| 6 | Won | Green (#10B981) | **Won** | Deal closed successfully |
| 7 | Lost | Red (#EF4444) | **Lost** | Deal lost/abandoned |

## Installation Methods

### Method 1: Automatic (Recommended)

**Use this if you know your tenant slug**

1. Open Supabase SQL Editor
2. Open `docs/seed-pipeline-auto.sql`
3. Edit line 10 to set your tenant slug:
   ```sql
   \set TENANT_SLUG 'your-tenant-slug'
   ```
4. Execute the entire script
5. The script will:
   - Find your tenant automatically
   - Check if pipeline already exists
   - Create pipeline and all 8 stages
   - Show confirmation messages

**Advantages**:
- No manual UUID copying
- Prevents duplicates
- Shows clear progress messages

### Method 2: Manual UUID

**Use this if Method 1 doesn't work in your SQL client**

1. Get your tenant ID:
   ```sql
   SELECT id FROM tenants WHERE slug = 'your-slug';
   ```
2. Copy the UUID
3. Open `docs/seed-pipeline-leads.sql`
4. Replace `{TENANT_ID}` on line 11 with your UUID
5. Execute the script

## Verification

After running the seed script, verify with:

```sql
-- Open docs/verify-pipeline.sql and run:

-- Check if pipeline exists
SELECT
  t.slug,
  p.name as pipeline,
  p.is_default,
  COUNT(ps.id) as stages
FROM tenants t
JOIN pipelines p ON p.tenant_id = t.id
LEFT JOIN pipeline_stages ps ON ps.pipeline_id = p.id
WHERE t.slug = 'your-tenant-slug'
GROUP BY t.slug, p.name, p.is_default;
```

**Expected Output**:
```
slug              | pipeline           | is_default | stages
------------------|--------------------|-----------:|-------:
your-tenant-slug  | Lead Management    | true       | 8
```

### Detailed Stage View

```sql
SELECT
  ps.position,
  ps.name,
  ps.color,
  ps.is_won,
  ps.is_lost
FROM pipeline_stages ps
JOIN pipelines p ON p.id = ps.pipeline_id
JOIN tenants t ON t.id = p.tenant_id
WHERE t.slug = 'your-tenant-slug'
ORDER BY ps.position;
```

## Using the Pipeline

### Creating a Deal (Lead in Pipeline)

Once the pipeline is set up, you can create deals:

```sql
-- 1. Get the pipeline_id and first stage_id
SELECT
  p.id as pipeline_id,
  ps.id as stage_id
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id
WHERE p.tenant_id = 'YOUR_TENANT_ID'
  AND ps.position = 0; -- First stage (New Lead)

-- 2. Create a deal
INSERT INTO deals (
  tenant_id,
  contact_id,     -- Link to a contact (lead)
  pipeline_id,    -- Use the pipeline_id from above
  stage_id,       -- Use the stage_id from above (position 0)
  title,
  value,
  status
) VALUES (
  'YOUR_TENANT_ID',
  'CONTACT_UUID',
  'PIPELINE_UUID',
  'STAGE_UUID',
  'Apartment Purchase - John Doe',
  450000,
  'open'
);
```

### Moving a Deal Through Stages

```sql
-- Move deal to next stage
UPDATE deals
SET stage_id = 'NEXT_STAGE_UUID',
    updated_at = NOW()
WHERE id = 'DEAL_UUID'
  AND tenant_id = 'YOUR_TENANT_ID';
```

### Closing a Deal as Won

```sql
-- Move to "Won" stage
UPDATE deals
SET stage_id = (
    SELECT id FROM pipeline_stages
    WHERE pipeline_id = 'PIPELINE_UUID'
      AND is_won = TRUE
  ),
  status = 'won',
  closed_at = NOW(),
  updated_at = NOW()
WHERE id = 'DEAL_UUID';
```

### Marking a Deal as Lost

```sql
-- Move to "Lost" stage
UPDATE deals
SET stage_id = (
    SELECT id FROM pipeline_stages
    WHERE pipeline_id = 'PIPELINE_UUID'
      AND is_lost = TRUE
  ),
  status = 'lost',
  closed_at = NOW(),
  updated_at = NOW()
WHERE id = 'DEAL_UUID';
```

## API Integration

Once the pipeline is seeded, the Leads API can use it:

```typescript
// Get default pipeline for tenant
const { data: pipeline } = await supabase
  .from('pipelines')
  .select('*, pipeline_stages(*)')
  .eq('tenant_id', tenantId)
  .eq('is_default', true)
  .single()

// Create new deal in first stage
const firstStage = pipeline.pipeline_stages
  .sort((a, b) => a.position - b.position)[0]

await supabase
  .from('deals')
  .insert({
    tenant_id: tenantId,
    contact_id: contactId,
    pipeline_id: pipeline.id,
    stage_id: firstStage.id,
    title: `${contact.name} - Property Interest`,
    status: 'open'
  })
```

## Customization

### Adding More Stages

```sql
-- Add a custom stage between existing ones
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
  'PIPELINE_UUID',
  'Follow-up Scheduled',
  '#A78BFA', -- Purple 400
  1.5,       -- Position between 1 and 2
  FALSE,
  FALSE
);

-- Reorder positions if needed
UPDATE pipeline_stages
SET position = new_position
WHERE id = 'STAGE_UUID';
```

### Changing Stage Colors

```sql
UPDATE pipeline_stages
SET color = '#NEW_COLOR'
WHERE id = 'STAGE_UUID';
```

### Creating Additional Pipelines

```sql
-- Create a second pipeline for rentals
INSERT INTO pipelines (tenant_id, name, is_default, is_active)
VALUES ('YOUR_TENANT_ID', 'Rental Pipeline', FALSE, TRUE)
RETURNING id;

-- Then add stages for this new pipeline
```

## Troubleshooting

### "Tenant not found" Error
- Check your tenant slug: `SELECT * FROM tenants;`
- Ensure tenant exists before running pipeline seed

### "Default pipeline already exists"
- This is safe - the script won't create duplicates
- To recreate: delete existing pipeline first
  ```sql
  DELETE FROM pipelines WHERE tenant_id = 'YOUR_ID' AND is_default = TRUE;
  ```

### Foreign Key Errors
- Ensure `tenants` table has data
- Check tenant_id exists before inserting pipeline

## Next Steps

After seeding the pipeline:

1. ✅ Pipeline created with 8 stages
2. ⏭️ Create contacts (leads) using Leads API
3. ⏭️ Create deals linking contacts to pipeline stages
4. ⏭️ Build Kanban UI to visualize pipeline
5. ⏭️ Implement drag-and-drop to move deals between stages

## Files Reference

- `seed-pipeline-leads.sql` - Manual UUID version
- `seed-pipeline-auto.sql` - Automatic tenant lookup version
- `verify-pipeline.sql` - Verification queries
- `PIPELINE-SETUP.md` - This guide

---

**Status**: ✅ Ready to execute
**Required**: Tenant must exist in database
**Safe**: Idempotent (checks for existing pipeline)
