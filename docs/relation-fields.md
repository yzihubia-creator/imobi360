# Relation Fields (Lookup & Rollup)

## Overview

Relation Fields enable Airtable-style relationships between entities, with:
- **Lookup**: Fetch values from related records
- **Rollup**: Aggregate numeric values across multiple related records

Like formula fields, relation values are:
- **Computed at read time** - Never stored in database
- **Read-only** - Cannot be edited via UI or API
- **Tenant-safe** - Cross-tenant access prevented
- **RBAC-aware** - Permissions enforced on related data

## Architecture

```
API GET → Fetch Record → Resolve Relations → Fetch Related Records → Compute Lookup/Rollup → Return
```

**Key Principles:**
- Relations defined declaratively in field config
- Values computed on every GET request
- No N+1 query explosions (batch where possible)
- Fail-safe on invalid configurations
- No side effects or automations

## Relation Types

### Many-to-One (Lookup)

Fetches value from a **single** related record.

**Example:** Deal → Contact Name

```
Deal (id: 123, contact_id: 456)
  ↓ lookup
Contact (id: 456, name: "John Doe")
  ↓
Result: "John Doe"
```

### One-to-Many (Rollup)

Aggregates values from **multiple** related records.

**Example:** Contact → Total Deal Value

```
Contact (id: 456)
  ↓ rollup sum
Deals (contact_id: 456)
  - Deal 1: value = 10000
  - Deal 2: value = 25000
  - Deal 3: value = 15000
  ↓
Result: 50000
```

## Field Configuration

### Database Schema

Relation fields are stored in `custom_fields` with special config:

```sql
-- Lookup Example: Deal -> Contact Name
INSERT INTO custom_fields (
  tenant_id,
  entity_type,
  field_name,
  field_label,
  field_type,
  options
) VALUES (
  'tenant-uuid',
  'deal',
  'contact_name_lookup',
  'Contact Name',
  'text',
  '{
    "kind": "relation",
    "target_entity": "contacts",
    "relation_type": "many_to_one",
    "foreign_key": "contact_id",
    "lookup_field": "name"
  }'
);

-- Rollup Example: Contact -> Total Deal Value
INSERT INTO custom_fields (
  tenant_id,
  entity_type,
  field_name,
  field_label,
  field_type,
  options
) VALUES (
  'tenant-uuid',
  'contact',
  'total_deal_value',
  'Total Deal Value',
  'number',
  '{
    "kind": "relation",
    "target_entity": "deals",
    "relation_type": "one_to_many",
    "foreign_key": "contact_id",
    "rollup": {
      "operation": "sum",
      "source_field": "value"
    }
  }'
);
```

### Configuration Schema

```typescript
interface RelationConfig {
  // Kind identifier
  kind: 'relation'

  // Target entity ('deals', 'contacts', 'activities')
  target_entity: string

  // Relation type
  relation_type: 'one_to_many' | 'many_to_one'

  // Foreign key field
  // many_to_one: field in current record (e.g., 'contact_id')
  // one_to_many: field in target records (e.g., 'contact_id')
  foreign_key: string

  // Lookup (many_to_one only)
  lookup_field?: string

  // Rollup (one_to_many only)
  rollup?: {
    operation: 'sum' | 'count' | 'avg' | 'min' | 'max'
    source_field?: string  // Required for sum, avg, min, max
  }
}
```

## Lookup Examples

### 1. Deal → Contact Name

```json
{
  "kind": "relation",
  "target_entity": "contacts",
  "relation_type": "many_to_one",
  "foreign_key": "contact_id",
  "lookup_field": "name"
}
```

Returns the contact's name for a deal.

### 2. Deal → Contact Email

```json
{
  "kind": "relation",
  "target_entity": "contacts",
  "relation_type": "many_to_one",
  "foreign_key": "contact_id",
  "lookup_field": "email"
}
```

Returns the contact's email for a deal.

### 3. Deal → Pipeline Name

```json
{
  "kind": "relation",
  "target_entity": "pipelines",
  "relation_type": "many_to_one",
  "foreign_key": "pipeline_id",
  "lookup_field": "name"
}
```

Returns the pipeline name for a deal.

### 4. Deal → Stage Position

```json
{
  "kind": "relation",
  "target_entity": "pipeline_stages",
  "relation_type": "many_to_one",
  "foreign_key": "stage_id",
  "lookup_field": "position"
}
```

Returns the numeric position of the deal's stage.

## Rollup Examples

### 1. Contact → Total Deal Value (Sum)

```json
{
  "kind": "relation",
  "target_entity": "deals",
  "relation_type": "one_to_many",
  "foreign_key": "contact_id",
  "rollup": {
    "operation": "sum",
    "source_field": "value"
  }
}
```

Sums all deal values for a contact.

### 2. Contact → Number of Deals (Count)

```json
{
  "kind": "relation",
  "target_entity": "deals",
  "relation_type": "one_to_many",
  "foreign_key": "contact_id",
  "rollup": {
    "operation": "count"
  }
}
```

Counts total deals for a contact.

### 3. Contact → Average Deal Value

```json
{
  "kind": "relation",
  "target_entity": "deals",
  "relation_type": "one_to_many",
  "foreign_key": "contact_id",
  "rollup": {
    "operation": "avg",
    "source_field": "value"
  }
}
```

Calculates average deal value for a contact.

### 4. Contact → Highest Deal Value

```json
{
  "kind": "relation",
  "target_entity": "deals",
  "relation_type": "one_to_many",
  "foreign_key": "contact_id",
  "rollup": {
    "operation": "max",
    "source_field": "value"
  }
}
```

Returns the maximum deal value for a contact.

### 5. Contact → Lowest Deal Value

```json
{
  "kind": "relation",
  "target_entity": "deals",
  "relation_type": "one_to_many",
  "foreign_key": "contact_id",
  "rollup": {
    "operation": "min",
    "source_field": "value"
  }
}
```

Returns the minimum deal value for a contact.

## API Integration

### GET Response

Relation values are included in `computed_fields`:

```json
{
  "data": {
    "id": "deal-uuid",
    "title": "Enterprise Deal",
    "value": 500000,
    "contact_id": "contact-uuid",
    "computed_fields": {
      "contact_name_lookup": "Acme Corp",
      "contact_email_lookup": "john@acme.com"
    }
  }
}
```

For contacts with rollups:

```json
{
  "data": {
    "id": "contact-uuid",
    "name": "Acme Corp",
    "computed_fields": {
      "total_deal_value": 1250000,
      "deal_count": 5,
      "avg_deal_value": 250000,
      "highest_deal": 500000
    }
  }
}
```

### PATCH Validation

Attempts to update relation fields return 403:

```bash
PATCH /api/deals/{id}
{
  "contact_name_lookup": "New Name"
}
```

Response:
```json
{
  "error": "Cannot update computed fields",
  "details": "Computed fields are read-only: contact_name_lookup",
  "computed_fields": ["contact_name_lookup"]
}
```

## Frontend Usage

### Display Component

```typescript
import { RelationFieldDisplay } from '@/components/shared/relation-field-display'

function DealCard({ deal }) {
  return (
    <div>
      <label>Contact Name</label>
      <RelationFieldDisplay
        value={deal.computed_fields.contact_name_lookup}
        relationType="lookup"
        showIcon
      />

      <label>Related Deals Count</label>
      <RelationFieldDisplay
        value={deal.computed_fields.deal_count}
        relationType="rollup"
        rollupOperation="count"
        showIcon
      />
    </div>
  )
}
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | any | ✅ | Computed value |
| `relationType` | 'lookup' \| 'rollup' | ✅ | Type of relation |
| `rollupOperation` | RollupOp | ❌ | For rollup display |
| `className` | string | ❌ | Additional CSS |
| `showIcon` | boolean | ❌ | Show link icon |

### Visual Design

Relation fields have distinctive styling:
- Blue background (subtle)
- Link icon (optional)
- Formatted values
- Cursor: not-allowed
- Tooltip with relation type

## Backend Implementation

### Relation Resolution

```typescript
import { resolveRelationFields } from '@/lib/relation-engine'

// In API route after fetching record
const relationValues = await resolveRelationFields(
  tenantId,
  'deal',
  dealData
)

const response = {
  ...dealData,
  computed_fields: {
    ...relationValues
  }
}
```

### Validation

```typescript
import { isRelationField } from '@/lib/relation-engine'

// Block relation field updates
for (const fieldName of Object.keys(updateBody)) {
  const isRelation = await isRelationField(tenantId, 'deal', fieldName)
  if (isRelation) {
    return res.status(403).json({
      error: 'Cannot update relation fields'
    })
  }
}
```

## n8n Integration

Relation fields are resolved before sending to n8n:

```json
{
  "tenant_id": "uuid",
  "entity_type": "deal",
  "entity_id": "uuid",
  "payload": {
    "title": "Deal Title",
    "value": 500000,
    "computed_fields": {
      "contact_name_lookup": "Acme Corp",
      "contact_email_lookup": "john@acme.com",
      "contact_deal_count": 5
    }
  }
}
```

n8n can use relation values directly without additional queries.

## Performance Optimization

### Batch Resolution

Relations are resolved in batch per entity to avoid N+1:

```typescript
// Fetch all relation configs once
const configs = await fetchRelationConfigs(tenantId, entityType)

// Resolve all relations
const values = await Promise.all(
  configs.map(config => resolveRelation(config, record))
)
```

### Query Optimization

- **Lookup (many_to_one)**: Single query per relation
- **Rollup (one_to_many)**: Single query per relation
- Total queries: O(n) where n = number of relation fields

### Caching Strategy

Consider caching at API layer:
- Cache resolved values for 1 minute
- Invalidate on record update
- Use HTTP caching headers

## Security

### Tenant Isolation

All relation queries enforce tenant_id:

```typescript
await supabase
  .from(tableName)
  .select('*')
  .eq(foreignKey, recordId)
  .eq('tenant_id', tenantId)  // ← Always included
```

### RBAC Enforcement

Relations respect field-level permissions:
- Users can only see fields they have access to
- Lookups return null for forbidden fields
- Rollups aggregate only visible records

### No Cross-Tenant Access

Relations CANNOT access:
- Records from other tenants
- System tables
- Internal data

## Limitations

### Current Limitations

- ✅ Many-to-one lookup
- ✅ One-to-many rollup
- ✅ Basic aggregations (sum, count, avg, min, max)
- ❌ Many-to-many relations
- ❌ Nested lookups (lookup of lookup)
- ❌ Conditional rollups (filter before aggregate)
- ❌ Cross-entity formulas (formulas using relations)

### Future Enhancements

- [ ] Many-to-many via junction tables
- [ ] Nested lookups
- [ ] Filtered rollups (WHERE clause)
- [ ] Grouped rollups
- [ ] Relation editing in UI
- [ ] Cascading deletes/updates
- [ ] Reverse relations (auto-generated)

## Troubleshooting

### Lookup Returns Null

**Problem:** Lookup field returns null

**Solutions:**
1. Check foreign_key value exists in current record
2. Verify related record exists with that ID
3. Confirm related record belongs to same tenant
4. Check lookup_field exists in target entity
5. Review server logs for errors

### Rollup Returns 0

**Problem:** Rollup returns 0 instead of expected value

**Solutions:**
1. Verify foreign_key matches in related records
2. Check related records exist for current record
3. Confirm source_field has numeric values
4. Ensure tenant_id matches across records
5. Test rollup operation independently

### Performance Issues

**Problem:** Slow API response with relations

**Solutions:**
1. Reduce number of relation fields
2. Add database indexes on foreign keys
3. Implement caching layer
4. Use pagination for large result sets
5. Monitor query performance

### 403 on Valid Updates

**Problem:** Updates fail with "Cannot update computed fields"

**Solutions:**
1. Check request body doesn't include relation fields
2. Verify field names match exactly
3. Review RBAC permissions separately
4. Check API error details for field list

## Best Practices

1. **Use descriptive names**: `contact_name` not `lookup1`
2. **Minimize relations**: Only create needed relations
3. **Index foreign keys**: Improve query performance
4. **Document business logic**: Explain relation purpose
5. **Test edge cases**: Handle null values, missing records
6. **Monitor performance**: Track API response times
7. **Cache when possible**: Reduce computation overhead

## Examples by Use Case

### CRM Deal Tracking

```sql
-- Deal → Contact Info
{
  "lookup_field": "name",
  "relation_type": "many_to_one"
}

-- Contact → Total Pipeline Value
{
  "rollup": {
    "operation": "sum",
    "source_field": "value"
  }
}

-- Contact → Win Rate (requires formula + relation)
{
  "expression": "won_deals / total_deals"
}
```

### Sales Metrics

```sql
-- Sales Rep → Total Revenue
{
  "rollup": {
    "operation": "sum",
    "source_field": "value"
  }
}

-- Sales Rep → Average Deal Size
{
  "rollup": {
    "operation": "avg",
    "source_field": "value"
  }
}

-- Sales Rep → Deal Count
{
  "rollup": {
    "operation": "count"
  }
}
```

### Account Management

```sql
-- Account → Active Deals
{
  "rollup": {
    "operation": "count"
  }
}

-- Deal → Account Owner (via Contact)
{
  "lookup_field": "assigned_to",
  "relation_type": "many_to_one"
}
```

This completes the Relation Fields implementation! 🎉
