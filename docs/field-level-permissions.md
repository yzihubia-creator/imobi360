# Field-Level Permissions (RBAC)

## Overview

The CRM implements fine-grained Role-Based Access Control (RBAC) at the field level for Deals and Contacts/Leads. Permissions are enforced both in the backend (API layer) and reflected in the frontend (UI).

## Architecture

```
User Request → Middleware (inject role) → API Route (validate permissions) → Database
                                              ↓
                                        403 if forbidden
```

Frontend:
```
Component → usePermissions hook → Field rendered with permissions → Optimistic update (if allowed)
```

## User Roles

| Role    | Level | Description |
|---------|-------|-------------|
| `viewer` | 1 | Read-only access |
| `member` | 2 | Can edit basic fields |
| `manager` | 3 | Can edit most fields, including privileged ones |
| `admin` | 4 | Full access to all fields |

## Permission Matrix

### Deal Fields

| Field | Admin | Manager | Member | Viewer |
|-------|-------|---------|--------|--------|
| `id`, `tenant_id`, `created_at`, `updated_at` | ❌ | ❌ | ❌ | ❌ |
| `title` | ✅ | ✅ | ✅ | ❌ |
| `value` | ✅ | ✅ | ✅ | ❌ |
| `expected_close_date` | ✅ | ✅ | ✅ | ❌ |
| `custom_fields` | ✅ | ✅ | ✅ | ❌ |
| `stage_id` | ✅ | ✅ | ❌ | ❌ |
| `status` | ✅ | ✅ | ❌ | ❌ |
| `contact_id` | ✅ | ✅ | ❌ | ❌ |
| `closed_at` | ✅ | ✅ | ❌ | ❌ |
| `pipeline_id` | ✅ | ❌ | ❌ | ❌ |
| `assigned_to` | ✅ | ❌ | ❌ | ❌ |

### Contact/Lead Fields

| Field | Admin | Manager | Member | Viewer |
|-------|-------|---------|--------|--------|
| `id`, `tenant_id`, `created_at`, `updated_at` | ❌ | ❌ | ❌ | ❌ |
| `name` | ✅ | ✅ | ✅ | ❌ |
| `email` | ✅ | ✅ | ✅ | ❌ |
| `phone` | ✅ | ✅ | ✅ | ❌ |
| `source` | ✅ | ✅ | ✅ | ❌ |
| `custom_fields` | ✅ | ✅ | ✅ | ❌ |
| `type` | ✅ | ✅ | ❌ | ❌ |
| `status` | ✅ | ✅ | ❌ | ❌ |
| `assigned_to` | ✅ | ❌ | ❌ | ❌ |

## Backend Implementation

### Middleware

The middleware automatically injects `x-user-role` header into all authenticated requests:

```typescript
// middleware.ts
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .eq('tenant_id', tenantId)
  .single()

if (userData?.role) {
  requestHeaders.set('x-user-role', userData.role)
}
```

### API Route Validation

All PATCH endpoints validate permissions before processing updates:

```typescript
import { validateUpdatePermissions } from '@/lib/permissions'

const userRole = request.headers.get('x-user-role') as UserRole

// Validate field-level permissions
const permissionCheck = validateUpdatePermissions(
  { userRole, entityType: 'deal' },
  body
)

if (!permissionCheck.valid) {
  return NextResponse.json(
    {
      error: 'Permission denied',
      details: `You do not have permission to modify: ${permissionCheck.forbiddenFields.join(', ')}`,
      forbidden_fields: permissionCheck.forbiddenFields,
    },
    { status: 403 }
  )
}
```

### Response Format

Unauthorized field updates return HTTP 403:

```json
{
  "error": "Permission denied",
  "details": "You do not have permission to modify: pipeline_id, assigned_to",
  "forbidden_fields": ["pipeline_id", "assigned_to"]
}
```

## Frontend Implementation

### Using the Permission Hook

```typescript
import { usePermissions } from '@/hooks/use-permissions'

function DealEditor({ userRole }: { userRole: UserRole }) {
  const { canEdit, canView, isViewer } = usePermissions({
    userRole,
    entityType: 'deal'
  })

  return (
    <div>
      {canEdit('title') && (
        <input name="title" />
      )}

      {canView('value') && !canEdit('value') && (
        <span className="text-muted-foreground">
          Value: {formatCurrency(deal.value)}
        </span>
      )}

      {canEdit('pipeline_id') ? (
        <PipelineSelector />
      ) : (
        <span className="opacity-60 cursor-not-allowed">
          {deal.pipeline.name}
        </span>
      )}
    </div>
  )
}
```

### Inline Editable Field Component

Use the `InlineEditableField` component for field-level permission-aware inline editing:

```typescript
import { InlineEditableField } from '@/components/shared/inline-editable-field'

function DealTitle({ deal, userRole, onUpdate }) {
  return (
    <InlineEditableField
      value={deal.title}
      fieldName="title"
      userRole={userRole}
      entityType="deal"
      onSave={async (newValue) => {
        await onUpdate({ title: newValue })
      }}
      placeholder="Enter deal title"
    />
  )
}
```

**Features:**
- Automatically checks permissions
- Disables editing if user lacks permission
- Shows visual cues (cursor, opacity)
- Displays tooltip on hover
- Optimistic updates only if allowed

### Permission-Aware Forms

```typescript
function DealForm({ userRole }) {
  const { canEdit } = usePermissions({ userRole, entityType: 'deal' })

  return (
    <form>
      <input
        name="title"
        disabled={!canEdit('title')}
      />

      <select
        name="pipeline_id"
        disabled={!canEdit('pipeline_id')}
      >
        {/* options */}
      </select>

      {!canEdit('pipeline_id') && (
        <p className="text-xs text-muted-foreground">
          Only admins can change pipeline
        </p>
      )}
    </form>
  )
}
```

## Custom Field Permissions

Custom fields support additional permission configuration:

```typescript
interface CustomFieldConfig {
  isEditable?: boolean
  requiredRole?: UserRole
}
```

Example:
```json
{
  "entity_type": "deal",
  "field_name": "internal_notes",
  "field_type": "text",
  "options": {
    "isEditable": true,
    "requiredRole": "manager"
  }
}
```

This field will only be editable by managers and admins.

## Permission Rules

Defined in `lib/permissions/rules.ts`:

**System Fields** (never editable):
- `id`, `tenant_id`, `created_at`, `updated_at`

**Privileged Fields** (manager+ only):
- `pipeline_id`, `assigned_to`

**Member Editable Fields**:
- `title`, `value`, `expected_close_date`, `custom_fields`
- `name`, `email`, `phone`, `source`

**Manager Editable Fields** (includes all member fields + ):
- `stage_id`, `status`, `contact_id`, `closed_at`, `type`

## Extending Permissions

### Adding a New Field Rule

Edit `lib/permissions/rules.ts`:

```typescript
const NEW_RESTRICTED_FIELDS = new Set([
  'sensitive_field',
])

export function canWriteField(context: PermissionContext): PermissionResult {
  // Add your custom logic
  if (NEW_RESTRICTED_FIELDS.has(field)) {
    if (userRole !== 'admin') {
      return {
        allowed: false,
        reason: 'Only admins can edit this field'
      }
    }
  }

  // ... rest of logic
}
```

### Adding Ownership-Based Permissions

```typescript
export function canWriteField(context: PermissionContext): PermissionResult {
  const { userRole, field, isOwner } = context

  // Members can only edit their own deals
  if (userRole === 'member' && !isOwner) {
    return {
      allowed: false,
      reason: 'You can only edit deals assigned to you'
    }
  }

  // ... rest of logic
}
```

Then pass `isOwner` from API:

```typescript
const permissionCheck = validateUpdatePermissions(
  {
    userRole,
    entityType: 'deal',
    isOwner: currentDeal.assigned_to === userId
  },
  body
)
```

## Testing Permissions

### Backend Tests

```typescript
describe('Deal PATCH permissions', () => {
  it('should reject member trying to change pipeline', async () => {
    const response = await fetch('/api/deals/123', {
      method: 'PATCH',
      headers: {
        'x-tenant-id': 'tenant-1',
        'x-user-role': 'member',
      },
      body: JSON.stringify({ pipeline_id: 'new-pipeline' })
    })

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.forbidden_fields).toContain('pipeline_id')
  })

  it('should allow manager to change stage', async () => {
    const response = await fetch('/api/deals/123', {
      method: 'PATCH',
      headers: {
        'x-tenant-id': 'tenant-1',
        'x-user-role': 'manager',
      },
      body: JSON.stringify({ stage_id: 'new-stage' })
    })

    expect(response.status).toBe(200)
  })
})
```

### Frontend Tests

```typescript
import { renderHook } from '@testing-library/react'
import { usePermissions } from '@/hooks/use-permissions'

test('member cannot edit pipeline_id', () => {
  const { result } = renderHook(() =>
    usePermissions({ userRole: 'member', entityType: 'deal' })
  )

  expect(result.current.canEdit('pipeline_id')).toBe(false)
})

test('admin can edit all fields', () => {
  const { result } = renderHook(() =>
    usePermissions({ userRole: 'admin', entityType: 'deal' })
  )

  expect(result.current.canEdit('pipeline_id')).toBe(true)
  expect(result.current.canEdit('assigned_to')).toBe(true)
})
```

## Security Best Practices

1. **Never Trust Client**: Always validate permissions server-side
2. **Tenant Isolation**: All permission checks include tenant validation
3. **Fail Secure**: Default to `viewer` role if role cannot be determined
4. **Audit Trail**: Log all permission denials for security monitoring
5. **Least Privilege**: Grant minimum necessary permissions

## Troubleshooting

### Permission Denied Errors

**Problem**: User gets 403 when trying to edit a field

**Solutions**:
1. Check user role in database: `SELECT role FROM users WHERE id = 'user-id'`
2. Verify middleware is injecting `x-user-role` header
3. Check permission rules in `lib/permissions/rules.ts`
4. Verify field name matches exactly (e.g., `stage_id` not `stageId`)

### UI Not Reflecting Permissions

**Problem**: Fields appear editable but API rejects

**Solutions**:
1. Ensure `userRole` is passed to `usePermissions` hook
2. Check `InlineEditableField` receives correct `userRole` prop
3. Verify frontend permission logic matches backend rules
4. Clear browser cache and reload

### Custom Fields Not Editable

**Problem**: Custom fields show as read-only

**Solutions**:
1. Check custom field configuration in database
2. Verify `isEditable` is not set to `false`
3. Check `requiredRole` doesn't exceed user's role
4. Ensure `custom_fields` is in `MEMBER_EDITABLE_FIELDS` set

## Performance Considerations

- Permission checks are cached per request (no additional DB queries)
- Frontend hook uses `useMemo` to avoid re-computation
- Middleware fetches role once per request
- No N+1 queries for batch field checks

## Future Enhancements

- [ ] Per-field audit logging
- [ ] Time-based permissions (e.g., edit only during business hours)
- [ ] Conditional permissions based on deal stage/status
- [ ] Permission delegation (admin temporarily grants permission)
- [ ] UI for managing role permissions
- [ ] Granular custom field permissions in UI
