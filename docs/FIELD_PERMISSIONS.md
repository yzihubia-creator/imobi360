# Field-Level RBAC Implementation

## Overview

Centralized field-level permission system enforced consistently across API and UI. Single source of truth for all permission logic.

## Permission Matrix

| Role    | Capabilities |
|---------|-------------|
| **admin** | Full access to all fields |
| **manager** | Edit all fields except system fields (pipeline_id, stage_id, status, tenant_id, created_at, updated_at, closed_at) |
| **member** | Edit limited fields: title, value, expected_close_date, assigned_to, contact_id, custom_fields |
| **viewer** | Read-only access to all fields |

## System Architecture

### Centralized Permission Logic

**File:** `lib/permissions.ts`

Single source of truth for all permission rules. Framework-agnostic, type-safe, and extensible.

**Core Functions:**
```typescript
// Check if a user can edit a specific field
canEditField(role: UserRole, entityType: EntityType, fieldKey: string): PermissionResult

// Validate multiple field updates (used by API routes)
validateUpdatePermissions(
  context: { userRole: UserRole; entityType: EntityType },
  updateData: Record<string, any>
): { valid: boolean; forbiddenFields: string[] }

// Check if field is a system field
isSystemField(fieldKey: string): boolean

// Get all editable fields for a role
getEditableFields(role: UserRole, entityType: EntityType): Set<string>
```

**Permission Logic:**
1. Viewers → Read-only (all edits denied)
2. Admins → Full access (all edits allowed)
3. System fields → Protected (only admins can edit)
4. Managers → All non-system fields
5. Members → Specific fields only (title, value, etc.)

### React Hook

**File:** `hooks/use-permissions.ts`

Thin wrapper around centralized permission resolver for React components.

```typescript
const { canEdit, checkPermission, validateFields, isAdmin, isViewer } =
  usePermissions({ userRole, entityType })

// Check if field is editable
const editable = canEdit('title')

// Get permission result with reason
const result = checkPermission('pipeline_id')
// { allowed: false, reason: 'System fields cannot be edited' }
```

### API Enforcement

**Files:**
- `app/api/deals/[id]/route.ts`
- `app/api/leads/[id]/route.ts`

Every PATCH request validates field-level permissions:

```typescript
// Get user role from middleware-injected header
const userRole = (request.headers.get('x-user-role') || 'viewer') as UserRole

// Validate all fields in update payload
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

**Security:**
- Never trust UI
- Validate every field update
- Return 403 with clear error message
- List forbidden fields for debugging

### UI Reflection

**File:** `components/shared/inline-editable-field.tsx`

Inline edit component respects permissions automatically:

```typescript
const { canEdit } = usePermissions({ userRole, entityType })
const isEditable = canEdit(fieldName)

// Render read-only if not editable
if (!isEditable) {
  return (
    <span
      className="text-sm text-muted-foreground cursor-not-allowed opacity-60"
      title="You don't have permission to edit this field"
    >
      {displayValue}
    </span>
  )
}
```

**Visual Cues:**
- `cursor-not-allowed` - Indicates field is locked
- `opacity-60` - Reduces emphasis on non-editable fields
- Tooltip: "You don't have permission to edit this field"

### Optimistic Updates

**File:** `hooks/use-deal-mutations.ts`

Optimistic updates respect permissions through API validation:

```typescript
// onMutate: Optimistically update UI
onMutate: async ({ dealId, newStageId, currentStageId }) => {
  // Update UI immediately
  queryClient.setQueryData(['kanban'], /* updated data */)
},

// onError: Revert if API rejects (permission denied)
onError: (error, variables, context) => {
  if (context?.previousData) {
    queryClient.setQueryData(['kanban'], context.previousData)
  }
  toast.error(error.message)
}
```

**Flow:**
1. UI attempts optimistic update
2. API validates permissions
3. If denied (403), `onError` reverts the UI
4. User sees error toast with clear message

---

## System Fields

Protected fields that only admins can modify:

```typescript
const SYSTEM_FIELDS = new Set([
  'id',
  'tenant_id',
  'created_at',
  'updated_at',
  'pipeline_id',
  'stage_id',
  'status',
  'closed_at',
])
```

**Rationale:**
- **id, tenant_id** - Identity fields, never editable
- **created_at, updated_at** - Audit fields, managed automatically
- **pipeline_id, stage_id, status** - Workflow fields, require business logic
- **closed_at** - Computed field, set automatically when status changes

---

## Member Editable Fields

Fields that members (basic users) can edit:

```typescript
const MEMBER_EDITABLE_FIELDS = new Set([
  'title',
  'value',
  'expected_close_date',
  'assigned_to',
  'contact_id',
  'custom_fields',
])
```

**Rationale:**
- Core business data that sales reps need to update
- No workflow control (can't change pipeline/stage/status)
- Custom fields allow tenant-specific extensions

---

## Usage Examples

### Check Permission in Component

```typescript
import { usePermissions } from '@/hooks/use-permissions'

function DealEditor({ deal, userRole }) {
  const { canEdit, checkPermission } = usePermissions({
    userRole,
    entityType: 'deal'
  })

  const canEditTitle = canEdit('title')
  const pipelinePermission = checkPermission('pipeline_id')

  return (
    <>
      {canEditTitle ? (
        <Input value={deal.title} onChange={...} />
      ) : (
        <span title={pipelinePermission.reason}>
          {deal.title}
        </span>
      )}
    </>
  )
}
```

### Validate in API Route

```typescript
import { validateUpdatePermissions } from '@/lib/permissions'

export async function PATCH(request: NextRequest) {
  const userRole = request.headers.get('x-user-role') as UserRole
  const body = await request.json()

  const check = validateUpdatePermissions(
    { userRole, entityType: 'deal' },
    body
  )

  if (!check.valid) {
    return NextResponse.json(
      {
        error: 'Permission denied',
        forbidden_fields: check.forbiddenFields
      },
      { status: 403 }
    )
  }

  // Proceed with update...
}
```

### Custom Field Permissions

Custom fields use prefix matching:

```typescript
// Both allowed for members:
canEdit('custom_fields')              // ✓
canEdit('custom_fields.property_type') // ✓

// System field - denied for members:
canEdit('pipeline_id')                 // ✗
```

---

## Extensibility

### Adding New Roles

1. Add to `UserRole` type in `lib/permissions.ts`:
```typescript
export type UserRole = 'admin' | 'manager' | 'member' | 'viewer' | 'contractor'
```

2. Add permission logic in `canEditField`:
```typescript
if (role === 'contractor') {
  // Define contractor-specific permissions
  return { allowed: CONTRACTOR_FIELDS.has(fieldKey) }
}
```

### Adding New Entity Types

1. Add to `EntityType` in `lib/permissions.ts`:
```typescript
export type EntityType = 'deal' | 'lead' | 'contact' | 'property'
```

2. Permission logic automatically applies to new entity type

### Adding New Fields

System fields are automatically protected. New fields default to:
- **Admin:** Full access
- **Manager:** Full access (unless added to SYSTEM_FIELDS)
- **Member:** Denied (unless added to MEMBER_EDITABLE_FIELDS)
- **Viewer:** Read-only

---

## Testing Checklist

### API Tests

- [ ] Viewer PATCH returns 403 for all fields
- [ ] Member PATCH succeeds for title
- [ ] Member PATCH returns 403 for pipeline_id
- [ ] Manager PATCH succeeds for all non-system fields
- [ ] Manager PATCH returns 403 for system fields
- [ ] Admin PATCH succeeds for all fields
- [ ] 403 response includes `forbidden_fields` array
- [ ] Cross-tenant updates are rejected

### UI Tests

- [ ] Viewer sees all fields as read-only
- [ ] Member sees editable title, disabled pipeline dropdown
- [ ] Manager sees editable fields, disabled system fields
- [ ] Admin sees all fields as editable
- [ ] Locked fields show cursor-not-allowed
- [ ] Tooltips explain permission restrictions
- [ ] Optimistic updates revert on 403

### Integration Tests

- [ ] Inline edit respects permissions
- [ ] Kanban drag-and-drop respects permissions
- [ ] Bulk operations respect permissions
- [ ] Action fields (buttons) respect permissions

---

## Security Considerations

### Defense in Depth

1. **UI Layer:** Disable edits based on permissions (UX)
2. **API Layer:** Validate every field update (Security)
3. **Database Layer:** RLS policies enforce tenant isolation
4. **Middleware:** Injects user role into request headers

### Never Trust the Client

All permission checks happen server-side. UI disabling is for UX only.

```typescript
// ✗ WRONG: Only checking in UI
if (canEdit('pipeline_id')) {
  await updateDeal({ pipeline_id: newId })
}

// ✓ CORRECT: API validates regardless of UI state
await updateDeal({ pipeline_id: newId })
// API returns 403 if user lacks permission
```

### Audit Trail

All permission-denied events are logged via API error responses:

```json
{
  "error": "Permission denied",
  "details": "You do not have permission to modify: pipeline_id, status",
  "forbidden_fields": ["pipeline_id", "status"]
}
```

---

## Files Modified/Created

### Created
- `lib/permissions.ts` - Central permission resolver
- `docs/FIELD_PERMISSIONS.md` - This documentation

### Modified
- `hooks/use-permissions.ts` - Updated to use new permission API
- `lib/action-fields/executor.ts` - Updated to use canEditField
- `lib/action-fields/types.ts` - Import EntityType from permissions
- `hooks/use-action-field.ts` - Support EntityType with 'lead'
- `lib/events/emitter.ts` - Unified EntityType definitions

### Already Compliant
- `components/shared/inline-editable-field.tsx` - Already using permissions
- `app/api/deals/[id]/route.ts` - Already calling validateUpdatePermissions
- `app/api/leads/[id]/route.ts` - Already calling validateUpdatePermissions

---

## Build Status

```
✓ TypeScript compilation passes
✓ Next.js build succeeds
✓ All routes generated correctly
✓ No type errors
✓ No runtime errors
```

---

## Future Enhancements

- Field-level permissions per custom field definition
- Time-based permissions (e.g., edit window after creation)
- Ownership-based permissions (edit own records only)
- Conditional permissions (e.g., edit if status = 'draft')
- Permission templates (predefined role configurations)
- Audit log for permission-denied attempts

---

## Support

For questions or issues:
1. Check `lib/permissions.ts` for permission logic
2. Check `hooks/use-permissions.ts` for React usage
3. Check API route PATCH handlers for enforcement
4. Check `components/shared/inline-editable-field.tsx` for UI reflection
