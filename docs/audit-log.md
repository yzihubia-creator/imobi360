# Audit Log (History)

## Overview

The Audit Log provides a read-only, chronological history of all changes and events for Deals and Leads. It's built on top of the existing `events` table and requires no database schema changes.

**Key Features:**
- ✅ Read-only (no edits, no deletes)
- ✅ Tenant-safe and RBAC-aware
- ✅ Real-time event tracking
- ✅ Human-readable event descriptions
- ✅ Clean, minimal UI
- ✅ Zero impact on existing flows

## Architecture

```
┌─────────────┐
│  UI Layer   │  ← Client Component (audit-log.tsx)
└──────┬──────┘
       │ fetch('/api/deals/{id}/audit')
       ↓
┌─────────────┐
│  API Layer  │  ← Route handlers (audit/route.ts)
└──────┬──────┘
       │ fetchAuditLog()
       ↓
┌─────────────┐
│ Data Layer  │  ← Server functions (audit-log/server.ts)
└──────┬──────┘
       │ SELECT * FROM events
       ↓
┌─────────────┐
│  Database   │  ← events table (existing)
└─────────────┘
```

**Separation of Concerns:**
- `lib/audit-log/types.ts` - Types and client-safe utilities
- `lib/audit-log/server.ts` - Server-only fetching and normalization
- `lib/audit-log/index.ts` - Public exports
- Client components import from `/types`
- API routes import from `/server`

## Events Tracked

The audit log displays the following event types from the `events` table:

| Event Type | Description | Example |
|------------|-------------|---------|
| `created` | Record creation | "Created record" |
| `updated` | Field updates | "Updated fields: title, value" |
| `stage_changed` | Deal stage transitions | "Changed stage from 'Qualified' to 'Proposal'" |
| `status_changed` | Deal status changes | "Changed status from 'open' to 'won'" |
| `button_click` | Action field clicks | "Clicked button: Send Email" |
| `deleted` | Record deletion | "Deleted record" |

## API Endpoints

### Get Deal Audit Log

```http
GET /api/deals/{id}/audit
Headers:
  x-tenant-id: {tenant_uuid}
```

**Response:**
```json
{
  "data": [
    {
      "id": "event-uuid",
      "timestamp": "2026-01-31T10:30:00Z",
      "eventType": "stage_changed",
      "actor": "John Silva",
      "action": "Changed stage from 'Qualified' to 'Proposal'",
      "oldValue": "Qualified",
      "newValue": "Proposal",
      "metadata": { ... }
    },
    {
      "id": "event-uuid",
      "timestamp": "2026-01-30T14:15:00Z",
      "eventType": "updated",
      "actor": "Sarah Costa",
      "action": "Updated fields: value, expected_close_date",
      "metadata": { ... }
    },
    {
      "id": "event-uuid",
      "timestamp": "2026-01-29T09:00:00Z",
      "eventType": "created",
      "actor": "System",
      "action": "Created record",
      "metadata": { ... }
    }
  ]
}
```

### Get Lead Audit Log

```http
GET /api/leads/{id}/audit
Headers:
  x-tenant-id: {tenant_uuid}
```

Response format is identical to deals.

## Event Normalization

Raw events from the database are normalized into human-readable entries:

### Actor Determination

The `actor` field is determined from event payload:
1. `payload.user_name` → Direct user name
2. `payload.user_email` → User email
3. `payload.user_id` → Truncated user ID
4. `payload.automation_id` or `payload.webhook_id` → "Automation"
5. Default → "System"

### Action Formatting

Events are mapped to descriptive actions:

**Stage Change:**
```json
{
  "event_type": "stage_changed",
  "payload": {
    "from_stage_name": "Qualified",
    "to_stage_name": "Proposal"
  }
}
```
→ "Changed stage from 'Qualified' to 'Proposal'"

**Field Update:**
```json
{
  "event_type": "updated",
  "payload": {
    "updated_fields": ["title", "value"]
  }
}
```
→ "Updated fields: title, value"

**Button Click:**
```json
{
  "event_type": "updated",
  "payload": {
    "action": "button_click",
    "field_name": "send_proposal"
  }
}
```
→ "Clicked button: send_proposal"

## Frontend Integration

### UI Component

The `<AuditLog>` component displays audit history:

```tsx
import { AuditLog } from '@/components/shared/audit-log'

function DealHistoryTab({ dealId }: { dealId: string }) {
  return (
    <div>
      <h3>History</h3>
      <AuditLog entityType="deal" entityId={dealId} />
    </div>
  )
}
```

**Props:**
- `entityType`: 'deal' | 'lead'
- `entityId`: Record ID
- `className?`: Optional CSS classes

### Visual Design

The audit log uses a timeline-style layout:
- Vertical line connecting events
- Color-coded event icons
- Relative timestamps ("2h ago", "Yesterday")
- Actor attribution
- Chronological order (most recent first)

**Event Icons:**
- 🟢 Created → Green dot
- 🔵 Updated → Blue dot
- 🟣 Stage Changed → Purple GitBranch icon
- 🟠 Status Changed → Orange dot
- 🔴 Deleted → Red dot

### Timestamp Formatting

Timestamps use relative formatting for recent events:
- < 1 min → "Just now"
- < 1 hour → "15m ago"
- < 24 hours → "3h ago"
- < 7 days → "2d ago"
- Older → "Jan 15, 2:30 PM"

## Deal Drawer Integration

The audit log is integrated as a "History" tab in the Deal Drawer:

**File:** `components/deals/deal-drawer.tsx`

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>

  <TabsContent value="history">
    <AuditLog entityType="deal" entityId={deal.id} />
  </TabsContent>
</Tabs>
```

The "History" tab shows:
- Header with icon and description
- Full audit log component
- Clean separation from other tabs

## Security & RBAC

### Tenant Isolation

All audit log queries enforce tenant isolation:

```typescript
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('tenant_id', tenantId)  // ← Mandatory
  .eq('entity_type', entityType)
  .eq('entity_id', entityId)
```

### Permission Levels

Read access to audit logs:
- ✅ **Viewer**: Can read audit logs
- ✅ **User**: Can read audit logs
- ✅ **Admin**: Can read audit logs

No write access:
- ❌ All roles: Cannot edit or delete audit entries

### Cross-Tenant Protection

API routes verify record ownership before returning audit logs:

```typescript
// Verify deal belongs to tenant
const { data: deal } = await supabase
  .from('deals')
  .select('id')
  .eq('id', dealId)
  .eq('tenant_id', tenantId)
  .single()

if (!deal) {
  return 404
}

// Only then fetch audit log
const auditLog = await fetchAuditLog(tenantId, 'deal', dealId)
```

## Performance

### Query Optimization

Audit log queries are optimized:
- Indexed on `(tenant_id, entity_type, entity_id, created_at)`
- Limited to last 50 entries by default
- Ordered by `created_at DESC`
- Single query per request

### Response Times

Expected performance:
- 50 events: ~50-100ms
- 500 events: ~100-200ms (if limit increased)

### Caching Considerations

Audit logs are real-time and not cached:
- Events may appear immediately after actions
- No stale data
- Always current

For high-traffic scenarios, consider:
- HTTP caching headers (Cache-Control: max-age=60)
- Client-side caching in UI state
- Pagination for very large histories

## Limitations

### Current Scope

- ✅ Last 50 events per record
- ✅ Chronological ordering
- ✅ Basic event types
- ❌ No filtering UI
- ❌ No search
- ❌ No pagination UI
- ❌ No export

### Event Coverage

Not all actions create events:
- ✅ Record creation (created)
- ✅ Field updates (updated)
- ✅ Stage changes (stage_changed)
- ✅ Status changes (status_changed)
- ✅ Button clicks (button_click)
- ❌ View events (not tracked)
- ❌ Export events (not tracked)
- ❌ Permission changes (not tracked)

### Future Enhancements

Potential improvements:
- [ ] Filtering by event type
- [ ] Search in event descriptions
- [ ] Pagination UI (load more)
- [ ] Export to CSV
- [ ] Event type icons customization
- [ ] Diff view for field changes
- [ ] Event grouping by time
- [ ] User avatars for actors

## Troubleshooting

### No Events Showing

**Problem:** Audit log is empty

**Solutions:**
1. Check if events are being emitted for the record
2. Verify tenant_id matches
3. Check entity_type is correct ('deal' or 'contact')
4. Inspect events table directly:
   ```sql
   SELECT * FROM events
   WHERE entity_id = '{record_id}'
   AND tenant_id = '{tenant_id}'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### Events Not Real-Time

**Problem:** Recent events don't appear immediately

**Solutions:**
1. Check event emission in API routes
2. Verify `emitEvent()` calls are not failing silently
3. Check console for errors
4. Refresh the audit log component

### Permission Errors

**Problem:** 401 or 403 when fetching audit log

**Solutions:**
1. Ensure `x-tenant-id` header is set
2. Verify record exists and belongs to tenant
3. Check user has read permission
4. Review API route middleware

### Slow Loading

**Problem:** Audit log takes too long to load

**Solutions:**
1. Check database indexes on events table
2. Review event count (may exceed 50)
3. Optimize network requests
4. Add loading states in UI
5. Consider pagination if needed

## Best Practices

### Event Emission

When emitting events, include relevant context:

```typescript
// Good: Include descriptive fields
emitEvent({
  tenantId,
  entityType: 'deal',
  entityId: deal.id,
  eventType: 'updated',
  payload: {
    updated_fields: ['title', 'value'],
    user_name: 'John Silva',
    user_email: 'john@example.com',
  }
})

// Avoid: Minimal context
emitEvent({
  tenantId,
  entityType: 'deal',
  entityId: deal.id,
  eventType: 'updated',
  payload: {}  // Missing context
})
```

### UI Integration

Keep audit logs visually distinct:
- Use separate tab (not mixed with notes)
- Clear labeling ("History", "Audit Log")
- Read-only indicators
- Minimal, clean design

### Error Handling

Handle audit log failures gracefully:
- Don't block main UI if audit fails
- Show friendly error messages
- Log errors for debugging
- Provide retry option if needed

## Examples by Use Case

### Deal Lifecycle Tracking

Track a deal from creation to close:

```
[History Tab]

🔵 2h ago
Changed status from "open" to "won"
by John Silva

🟣 5h ago
Changed stage from "Negotiation" to "Closed Won"
by John Silva

🔵 1d ago
Updated fields: value, expected_close_date
by Sarah Costa

🟣 3d ago
Changed stage from "Proposal" to "Negotiation"
by John Silva

🟢 5d ago
Created record
by System
```

### Compliance & Auditing

Track who changed what and when for compliance:

```sql
-- Find all changes to a specific deal
SELECT
  created_at,
  event_type,
  payload->>'user_name' as actor,
  payload->>'updated_fields' as fields_changed
FROM events
WHERE entity_type = 'deal'
  AND entity_id = '{deal_id}'
  AND tenant_id = '{tenant_id}'
ORDER BY created_at DESC;
```

### Debugging Automation

Trace automation execution:

```
[History Tab]

🔵 10m ago
Automation dispatched
by Automation

🔵 15m ago
Clicked button: Send Proposal
by John Silva
```

## Complete Implementation

This audit log implementation includes:

**Backend:**
- `lib/audit-log/types.ts` - Types and utilities
- `lib/audit-log/server.ts` - Server-side logic
- `lib/audit-log/index.ts` - Public exports
- `app/api/deals/[id]/audit/route.ts` - Deal API
- `app/api/leads/[id]/audit/route.ts` - Lead API

**Frontend:**
- `components/shared/audit-log.tsx` - Display component
- `components/deals/deal-drawer.tsx` - Integration (History tab)

**Documentation:**
- `docs/audit-log.md` - This file

All components are production-ready and follow YZIHUB standards.
