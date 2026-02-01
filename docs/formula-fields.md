# Formula Fields

## Overview

Formula Fields are dynamic fields that compute values at read time based on other fields in the record. Similar to Airtable formulas, they are:

- **Computed, not stored** - Values calculated on every GET request
- **Read-only** - Cannot be edited via UI or API
- **Pure functions** - No side effects, no events, no automations
- **Deterministic** - Same inputs always produce same output
- **Tenant-safe** - Cannot access cross-tenant data

## Architecture

```
API GET Request → Fetch Record → Resolve Formula Fields → Merge Computed Values → Return Response
```

**Key Principles:**
- Values never persist to database
- Evaluation happens server-side only
- No client-side computation
- No formula-triggered automations
- Fail-safe on errors (returns null)

## Field Configuration

### Database Schema

Formula fields are stored in `custom_fields` table with special configuration:

```sql
INSERT INTO custom_fields (
  tenant_id,
  entity_type,
  field_name,
  field_label,
  field_type,
  options,
  position
) VALUES (
  'tenant-uuid',
  'deal',
  'commission',
  'Commission (10%)',
  'number',
  '{
    "kind": "formula",
    "expression": "value * 0.1",
    "dependencies": ["value"],
    "return_type": "number"
  }',
  20
);
```

### Configuration Schema

```typescript
interface FormulaConfig {
  // Identifier for formula fields
  kind: 'formula'

  // Formula expression
  expression: string

  // Fields this formula depends on
  dependencies: string[]

  // Expected return type
  return_type: 'number' | 'string' | 'boolean'
}
```

### Expression Syntax

**Operators:**
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `=`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: (via functions)

**Functions:**
- `IF(condition, valueIfTrue, valueIfFalse)`
- `AND(arg1, arg2, ...)`
- `OR(arg1, arg2, ...)`
- `NOT(arg)`
- `SUM(arg1, arg2, ...)`
- `MULTIPLY(arg1, arg2, ...)`
- `DIVIDE(num, denom)`
- `CONCAT(arg1, arg2, ...)`
- `UPPER(text)`
- `LOWER(text)`
- `TRIM(text)`
- `ROUND(number)`
- `CEIL(number)`
- `FLOOR(number)`
- `ABS(number)`
- `MAX(arg1, arg2, ...)`
- `MIN(arg1, arg2, ...)`

**Variables:**
- System fields: `value`, `status`, `title`, etc.
- Custom fields: `custom_field_name`
- Nested fields: `contact.name`, `stage.position`

**Literals:**
- Numbers: `10`, `3.14`, `-5`
- Strings: `"hello"`, `'world'`
- Booleans: `true`, `false`
- Null: `null`

## Example Formulas

### 1. Commission Calculation

```json
{
  "kind": "formula",
  "expression": "value * 0.1",
  "dependencies": ["value"],
  "return_type": "number"
}
```

Computes 10% commission on deal value.

### 2. Deal Status Summary

```json
{
  "kind": "formula",
  "expression": "CONCAT(title, ' - ', status)",
  "dependencies": ["title", "status"],
  "return_type": "string"
}
```

Combines title and status into one field.

### 3. High Value Flag

```json
{
  "kind": "formula",
  "expression": "IF(value > 100000, true, false)",
  "dependencies": ["value"],
  "return_type": "boolean"
}
```

Flags deals over $100k.

### 4. Conditional Commission

```json
{
  "kind": "formula",
  "expression": "IF(status = 'won', value * 0.1, 0)",
  "dependencies": ["status", "value"],
  "return_type": "number"
}
```

Only calculates commission for won deals.

### 5. Contact Info

```json
{
  "kind": "formula",
  "expression": "CONCAT(contact.name, ' <', contact.email, '>')",
  "dependencies": ["contact.name", "contact.email"],
  "return_type": "string"
}
```

Formats contact name and email.

### 6. Days Since Creation

```json
{
  "kind": "formula",
  "expression": "DIVIDE(NOW() - created_at, 86400)",
  "dependencies": ["created_at"],
  "return_type": "number"
}
```

(Note: NOW() would need to be implemented)

### 7. Multi-Field Sum

```json
{
  "kind": "formula",
  "expression": "SUM(value, custom_fee, custom_discount)",
  "dependencies": ["value", "custom_fee", "custom_discount"],
  "return_type": "number"
}
```

Sums multiple fields.

### 8. Nested Conditions

```json
{
  "kind": "formula",
  "expression": "IF(status = 'won', 'Closed Won', IF(status = 'lost', 'Closed Lost', 'Open'))",
  "dependencies": ["status"],
  "return_type": "string"
}
```

Translates status codes to labels.

## API Integration

### GET Response

Formula values are included in `computed_fields`:

```json
{
  "data": {
    "id": "deal-uuid",
    "title": "Enterprise Deal",
    "value": 500000,
    "status": "won",
    "computed_fields": {
      "commission": 50000,
      "high_value": true,
      "status_summary": "Enterprise Deal - won"
    }
  }
}
```

### PATCH Validation

Attempts to update formula fields return 403:

```bash
PATCH /api/deals/{id}
{
  "commission": 60000
}
```

Response:
```json
{
  "error": "Cannot update formula fields",
  "details": "Formula fields are read-only: commission",
  "formula_fields": ["commission"]
}
```

## Frontend Usage

### Display Component

```typescript
import { FormulaFieldDisplay } from '@/components/shared/formula-field-display'

function DealCard({ deal }) {
  return (
    <div>
      <label>Commission</label>
      <FormulaFieldDisplay
        value={deal.computed_fields.commission}
        returnType="number"
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
| `returnType` | 'number' \| 'string' \| 'boolean' | ✅ | Type for formatting |
| `className` | string | ❌ | Additional CSS |
| `showIcon` | boolean | ❌ | Show calculator icon |

### Visual Design

Formula fields have distinctive styling:
- Dashed border
- Muted background
- Calculator icon (optional)
- Cursor: not-allowed
- Tooltip: "Computed field (read-only)"

## Backend Implementation

### Formula Evaluation

```typescript
import { resolveFormulaFields } from '@/lib/formula-engine'

// In API route after fetching record
const formulaValues = await resolveFormulaFields(
  tenantId,
  'deal',
  dealData
)

const response = {
  ...dealData,
  computed_fields: formulaValues
}
```

### Validation

```typescript
import { isFormulaField } from '@/lib/formula-engine'

// Block formula field updates
for (const fieldName of Object.keys(updateBody)) {
  const isFormula = await isFormulaField(tenantId, 'deal', fieldName)
  if (isFormula) {
    return res.status(403).json({
      error: 'Cannot update formula fields'
    })
  }
}
```

## n8n Integration

Formula fields are resolved before sending to n8n:

```json
{
  "tenant_id": "uuid",
  "entity_type": "deal",
  "entity_id": "uuid",
  "payload": {
    "title": "Deal Title",
    "value": 500000,
    "computed_fields": {
      "commission": 50000,
      "high_value": true
    }
  }
}
```

n8n can use computed values directly without recalculation.

## Safety & Constraints

### No Arbitrary Code Execution

The formula engine uses a custom parser - never `eval()` or `Function()`:

```typescript
// SAFE ✅
evaluateExpression("value * 0.1", { value: 1000 })

// UNSAFE ❌ (not used)
eval("value * 0.1")
```

### Tenant Isolation

Formulas only access fields from the current record:

```typescript
// ACCESSIBLE ✅
value, title, status, contact.name

// NOT ACCESSIBLE ❌
other_deals.value, cross_tenant_data
```

### Error Handling

Invalid formulas fail gracefully:

```typescript
// Invalid expression
"unknown_function(value)"

// Returns
{
  success: false,
  error: "Unknown function: unknown_function"
}

// API response includes null
computed_fields: {
  invalid_formula: null
}
```

### No Side Effects

Formulas CANNOT:
- Trigger automations
- Emit events
- Modify data
- Call external APIs
- Access database

### Dependency Resolution

Missing dependencies return null:

```json
{
  "expression": "value + custom_fee",
  "dependencies": ["value", "custom_fee"]
}
```

If `custom_fee` is null:
```typescript
result = 1000 + null  // = 1000 (graceful handling)
```

## Performance Considerations

### Computation Cost

- Formulas computed on every GET request
- Simple expressions: <1ms
- Complex nested formulas: ~5ms
- Multiple formulas: ~10-20ms total

### Optimization Tips

1. **Minimize dependencies**: Only include fields actually used
2. **Avoid deep nesting**: Keep formulas simple
3. **Cache at API layer**: Use HTTP caching for read-heavy endpoints
4. **Batch requests**: Fetch multiple records in one request

## Limitations

### Current Limitations

- ✅ Basic math operators
- ✅ String concatenation
- ✅ Conditional logic (IF)
- ✅ Common functions
- ❌ Date/time manipulation (not yet implemented)
- ❌ Regex matching
- ❌ Lookups to other records
- ❌ Aggregations across multiple records

### Future Enhancements

- [ ] Date functions (NOW, DATE_ADD, DATE_DIFF)
- [ ] Lookup fields (reference other records)
- [ ] Rollup fields (aggregate child records)
- [ ] Array operations
- [ ] Custom functions per tenant
- [ ] Formula validation UI
- [ ] Formula testing sandbox

## Troubleshooting

### Formula Not Computing

**Problem:** `computed_fields` is empty or missing field

**Solutions:**
1. Check `kind: 'formula'` is set in custom_fields
2. Verify `dependencies` array includes all referenced fields
3. Check expression syntax is valid
4. Look for errors in server logs

### Wrong Value Computed

**Problem:** Formula returns unexpected result

**Solutions:**
1. Verify dependencies match expression
2. Check operator precedence
3. Test expression in isolation
4. Ensure fields have expected types

### Formula Field Appears Editable

**Problem:** UI allows editing formula field

**Solutions:**
1. Verify component uses `FormulaFieldDisplay`
2. Check field config has `kind: 'formula'`
3. Ensure inline edit checks formula status
4. Clear browser cache

### 403 on Valid Updates

**Problem:** PATCH fails even for non-formula fields

**Solutions:**
1. Check request body doesn't include formula fields
2. Verify field names match database exactly
3. Check RBAC permissions separately
4. Review API error details

## Best Practices

1. **Keep formulas simple**: Easier to debug and maintain
2. **Document complex formulas**: Add comments in field_label
3. **Test edge cases**: null values, division by zero, etc.
4. **Use descriptive names**: `commission_amount` not `calc1`
5. **Validate dependencies**: Ensure referenced fields exist
6. **Monitor performance**: Check API response times
7. **Provide defaults**: Handle null/undefined gracefully

## Security

### Input Validation

All formula inputs are validated:
- Expression syntax checked
- Dependencies validated against schema
- Return type enforced
- No arbitrary code execution

### Tenant Isolation

Formulas CANNOT access:
- Other tenants' data
- System tables
- Environment variables
- File system

### Type Safety

TypeScript ensures type safety throughout:
- Formula config is typed
- Evaluation context is typed
- Return values are coerced to declared type

## Examples by Use Case

### Sales Commission Tracking

```sql
-- Base commission (10%)
{
  "expression": "value * 0.1",
  "return_type": "number"
}

-- Tiered commission
{
  "expression": "IF(value > 100000, value * 0.15, value * 0.1)",
  "return_type": "number"
}
```

### Deal Scoring

```sql
-- Simple score
{
  "expression": "IF(value > 50000, 100, 50)",
  "return_type": "number"
}

-- Weighted score
{
  "expression": "SUM(value_score, stage_score, age_score)",
  "return_type": "number"
}
```

### Status Indicators

```sql
-- At risk flag
{
  "expression": "AND(status = 'open', days_since_update > 7)",
  "return_type": "boolean"
}

-- Priority label
{
  "expression": "IF(value > 100000, 'High', IF(value > 50000, 'Medium', 'Low'))",
  "return_type": "string"
}
```

This completes the Formula Fields implementation! 🎉
