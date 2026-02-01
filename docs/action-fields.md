# Action Fields (Button Fields)

## Overview

Action Fields are dynamic fields of type "button" that trigger automations when clicked. They act as first-class automation triggers, emitting events to the events table and dispatching webhooks to n8n.

## Architecture

```
User clicks button → UI validates RBAC → API executes action → Event emitted → n8n webhook
                                              ↓
                                         403 if forbidden
```

**Key Principles:**
- UI only emits intent; backend performs execution
- All executions are tenant-safe and RBAC-aware
- Button fields DO NOT store values
- Execution is idempotent (handled by event system)
- Failures are explicit (no silent errors)

## Field Configuration

### Database Schema

Action fields are stored in the `custom_fields` table with `field_type = 'button'`:

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
  'send_proposal',
  'Send Proposal',
  'button',
  '{
    "action": "webhook",
    "automation_key": "send_proposal",
    "label": "Send Proposal",
    "variant": "default",
    "confirm_message": "Are you sure you want to send the proposal?",
    "required_role": "member",
    "payload_template": {
      "deal_title": "{record.title}",
      "deal_value": "{record.value}",
      "contact_email": "{record.contact.email}",
      "user_id": "{user.id}"
    }
  }',
  10
);
```

### Configuration Options

```typescript
interface ActionFieldConfig {
  // Type of action (required)
  action: 'webhook' | 'event'

  // Automation key for n8n routing (optional)
  automation_key?: string

  // Direct webhook URL (optional, falls back to N8N_WEBHOOK_URL)
  webhook_url?: string

  // Payload template with variable substitution (optional)
  payload_template?: Record<string, any>

  // Button label (optional, defaults to field_label)
  label?: string

  // Button variant (optional)
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'

  // Confirmation message (optional)
  confirm_message?: string

  // Minimum role required (optional, uses field-level RBAC by default)
  required_role?: 'viewer' | 'member' | 'manager' | 'admin'
}
```

## Payload Template Variables

Templates support variable substitution using `{path.to.value}` syntax:

| Variable | Description | Example |
|----------|-------------|---------|
| `{record.*}` | Fields from the entity | `{record.title}`, `{record.value}` |
| `{user.id}` | ID of user executing action | `{user.id}` |
| `{tenant.id}` | Tenant ID | `{tenant.id}` |
| `{context.entity_type}` | Entity type | `deal` or `contact` |
| `{context.entity_id}` | Entity ID | UUID |
| `{context.field_name}` | Action field name | `send_proposal` |
| `{context.automation_key}` | Automation key | From config |

### Example Templates

**Send Proposal:**
```json
{
  "payload_template": {
    "action": "send_proposal",
    "deal": {
      "id": "{context.entity_id}",
      "title": "{record.title}",
      "value": "{record.value}",
      "stage": "{record.stage.name}"
    },
    "contact": {
      "name": "{record.contact.name}",
      "email": "{record.contact.email}"
    },
    "executed_by": "{user.id}"
  }
}
```

**Create Task:**
```json
{
  "payload_template": {
    "task_type": "follow_up",
    "title": "Follow up on {record.title}",
    "assigned_to": "{record.assigned_to}",
    "due_date": "+3 days"
  }
}
```

## Backend Implementation

### Executing Actions

Actions are executed via dedicated endpoints:

**Deals:**
```
POST /api/deals/{id}/actions
```

**Leads:**
```
POST /api/leads/{id}/actions
```

**Request Body:**
```json
{
  "field_name": "send_proposal",
  "context": {
    // Optional additional context
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "event_id": "uuid",
  "executed_at": "2026-02-01T10:30:00Z",
  "message": "Action executed successfully"
}
```

**Permission Denied (403):**
```json
{
  "error": "Action execution failed",
  "details": "Permission denied"
}
```

**Not Found (404):**
```json
{
  "error": "Action field not found",
  "details": "Field \"invalid_field\" is not configured as an action field"
}
```

**Execution Error (500):**
```json
{
  "error": "Action execution failed",
  "details": "Failed to emit event: ..."
}
```

### Execution Flow

1. **Validate Request:**
   - Check tenant context
   - Parse request body
   - Validate field_name

2. **Fetch Entity:**
   - Get deal/contact with tenant validation
   - Return 404 if not found

3. **Get Action Config:**
   - Fetch field config from custom_fields
   - Validate field_type = 'button'
   - Return 404 if not configured

4. **Execute Action:**
   - Validate RBAC permissions
   - Check required_role if specified
   - Build payload from template
   - Emit event to events table
   - Dispatch webhook to n8n

5. **Return Result:**
   - 200 on success
   - 403 on permission denied
   - 500 on execution error

### Permission Validation

Action fields use the existing RBAC system with an additional optional `required_role`:

```typescript
// Field-level RBAC (default)
const canExecute = checkPermission(
  { userRole, entityType, field: fieldName },
  'write'
)

// Additional role requirement (if configured)
if (config.required_role) {
  if (!hasRequiredRole(userRole, config.required_role)) {
    return { error: 'Requires higher role' }
  }
}
```

## Frontend Implementation

### Using the Hook

```typescript
import { useActionField } from '@/hooks/use-action-field'

function DealActions({ dealId }) {
  const { execute, isExecuting, lastError } = useActionField()

  const handleSendProposal = async () => {
    const result = await execute({
      entityType: 'deal',
      entityId: dealId,
      fieldName: 'send_proposal',
    })

    if (result.success) {
      console.log('Proposal sent!', result.event_id)
    } else {
      console.error('Failed:', result.error)
    }
  }

  return (
    <button onClick={handleSendProposal} disabled={isExecuting}>
      {isExecuting ? 'Sending...' : 'Send Proposal'}
    </button>
  )
}
```

### Using the Component

```typescript
import { ActionFieldButton } from '@/components/shared/action-field-button'

function DealCard({ deal, userRole }) {
  return (
    <div>
      <h3>{deal.title}</h3>

      <ActionFieldButton
        fieldName="send_proposal"
        label="Send Proposal"
        entityType="deal"
        entityId={deal.id}
        userRole={userRole}
        variant="default"
        confirmMessage="Send proposal to client?"
        onSuccess={(result) => {
          console.log('Success!', result.event_id)
        }}
        onError={(error) => {
          console.error('Failed:', error)
        }}
      />
    </div>
  )
}
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fieldName` | string | ✅ | Action field name |
| `label` | string | ✅ | Button text |
| `entityType` | 'deal' \| 'contact' | ✅ | Entity type |
| `entityId` | string | ✅ | Entity ID |
| `userRole` | UserRole | ✅ | Current user's role |
| `variant` | ButtonVariant | ❌ | Button style |
| `confirmMessage` | string | ❌ | Confirmation prompt |
| `onSuccess` | function | ❌ | Success callback |
| `onError` | function | ❌ | Error callback |
| `className` | string | ❌ | Additional CSS classes |

## n8n Integration

### Webhook Payload

Actions send the following payload to n8n:

```json
{
  "tenant_id": "uuid",
  "entity_type": "deal",
  "entity_id": "uuid",
  "event_type": "updated",
  "event_id": "uuid",
  "payload": {
    "action": "button_click",
    "field_name": "send_proposal",
    "automation_key": "send_proposal",
    "user_id": "uuid",
    // ...payload from template
  },
  "timestamp": "2026-02-01T10:30:00Z"
}
```

### n8n Workflow Setup

**1. Webhook Trigger:**
```
Webhook Node
  - HTTP Method: POST
  - Path: /crm-events
```

**2. Filter by Action:**
```javascript
// Filter node
return [
  {
    send_proposal: $json.payload.automation_key === 'send_proposal'
  }
];
```

**3. Process Action:**
```javascript
// Code node
const deal = $json.payload.deal;
const contact = $json.payload.contact;

// Your automation logic here
// e.g., send email, create PDF, update CRM, etc.

return { success: true };
```

### Example Workflows

**Send Proposal Email:**
```
Webhook → Filter (send_proposal) → Get Deal Details → Generate PDF → Send Email → Update Deal
```

**Create Follow-up Task:**
```
Webhook → Filter (create_task) → HTTP Request (POST /api/activities) → Slack Notification
```

**Update External System:**
```
Webhook → Filter (sync_to_external) → HTTP Request (External API) → Log Result
```

## Common Use Cases

### 1. Send Documents

```sql
-- Configuration
{
  "action": "webhook",
  "automation_key": "send_contract",
  "label": "Send Contract",
  "variant": "default",
  "confirm_message": "Send contract to {record.contact.name}?",
  "payload_template": {
    "document_type": "contract",
    "deal_id": "{context.entity_id}",
    "recipient": "{record.contact.email}",
    "deal_value": "{record.value}"
  }
}
```

### 2. Create Tasks

```sql
-- Configuration
{
  "action": "webhook",
  "automation_key": "schedule_call",
  "label": "Schedule Call",
  "variant": "outline",
  "payload_template": {
    "task_type": "call",
    "title": "Call {record.contact.name}",
    "due_date": "+1 day",
    "assigned_to": "{user.id}"
  }
}
```

### 3. Update Status

```sql
-- Configuration
{
  "action": "webhook",
  "automation_key": "mark_won",
  "label": "Mark as Won",
  "variant": "default",
  "required_role": "manager",
  "confirm_message": "Mark this deal as won?",
  "payload_template": {
    "new_status": "won",
    "won_date": "now",
    "won_by": "{user.id}"
  }
}
```

### 4. External Sync

```sql
-- Configuration
{
  "action": "webhook",
  "automation_key": "sync_to_erp",
  "label": "Sync to ERP",
  "variant": "secondary",
  "required_role": "admin",
  "webhook_url": "https://erp.company.com/api/sync",
  "payload_template": {
    "deal_id": "{context.entity_id}",
    "title": "{record.title}",
    "value": "{record.value}",
    "customer_id": "{record.contact.id}"
  }
}
```

## Security

### Tenant Isolation

All action executions are tenant-scoped:

```typescript
// API validates tenant
const { data: deal } = await supabase
  .from('deals')
  .select('*')
  .eq('id', dealId)
  .eq('tenant_id', tenantId) // ← Tenant isolation
  .single()
```

### RBAC Enforcement

Permissions are validated before execution:

```typescript
// Field-level permission
const canExecute = checkPermission(
  { userRole, entityType, field: fieldName },
  'write'
)

// Action-specific role requirement
if (config.required_role) {
  if (!hasRequiredRole(userRole, config.required_role)) {
    return { error: 'Insufficient role' }
  }
}
```

### Idempotency

Events table prevents duplicate execution:

```typescript
// Event includes unique identifiers
{
  tenant_id,
  entity_type,
  entity_id,
  event_type,
  payload: {
    action: 'button_click',
    field_name,
    timestamp
  }
}
```

## Best Practices

1. **Use automation_key:** Always set a unique automation_key for n8n routing
2. **Validate permissions:** Set required_role for sensitive actions
3. **Confirm destructive actions:** Use confirm_message for irreversible operations
4. **Keep payloads small:** Only include necessary data in payload_template
5. **Handle async results:** Actions don't wait for n8n completion
6. **Log failures:** Monitor event dispatch failures in n8n
7. **Test in sandbox:** Use separate webhook_url for testing

## Troubleshooting

### Button Not Appearing

**Problem:** Action button doesn't render in UI

**Solutions:**
1. Verify custom_field exists with field_type = 'button'
2. Check entity_type matches ('deal' vs 'contact')
3. Verify userRole is passed to component
4. Check browser console for errors

### Permission Denied

**Problem:** User gets 403 when clicking button

**Solutions:**
1. Check user role in database
2. Verify required_role in field config
3. Ensure field-level RBAC allows write access
4. Check middleware injects x-user-role header

### Action Not Triggering

**Problem:** Button clicks don't trigger automation

**Solutions:**
1. Check event was created in events table
2. Verify N8N_WEBHOOK_URL is configured
3. Check n8n workflow is active
4. Verify automation_key matches n8n filter
5. Check n8n logs for incoming webhooks

### Payload Variables Not Replaced

**Problem:** Variables like {record.title} not substituted

**Solutions:**
1. Verify entity has the field (e.g., deal.title exists)
2. Check variable syntax (use dot notation)
3. Ensure record data is passed to executor
4. Check for typos in template paths

## Future Enhancements

- [ ] Batch actions (execute on multiple entities)
- [ ] Scheduled actions (execute at specific time)
- [ ] Conditional buttons (show only when conditions met)
- [ ] Action history UI
- [ ] Retry failed actions
- [ ] Custom icons for buttons
- [ ] Progress tracking for long-running actions
