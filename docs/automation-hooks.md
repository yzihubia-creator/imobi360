# Automation Hooks - n8n Integration

## Overview

The CRM implements a native automation hook system that integrates with n8n workflows. Events are captured in the database and dispatched to n8n webhooks for processing.

## Architecture

```
CRM Action → Event Emitter → Events Table → Dispatcher → n8n Webhook
                                                              ↓
                                                      n8n Workflow
```

## Event Types

### Deal Events
- `created` - New deal created
- `updated` - Deal fields updated
- `stage_changed` - Deal moved between pipeline stages
- `status_changed` - Deal status changed (open/won/lost)

### Contact Events
- `created` - New contact/lead created
- `updated` - Contact fields updated

### Button Field Events
- `updated` with `action: 'button_click'` - Custom button clicked

## Event Payload Structure

All events sent to n8n include:

```json
{
  "tenant_id": "uuid",
  "entity_type": "deal | contact | pipeline | activity",
  "entity_id": "uuid",
  "event_type": "created | updated | deleted | stage_changed | status_changed",
  "event_id": "uuid",
  "payload": {
    // Event-specific data
  },
  "timestamp": "ISO 8601 timestamp"
}
```

### Stage Changed Payload
```json
{
  "from_stage_id": "uuid",
  "to_stage_id": "uuid",
  "from_stage_name": "Qualification",
  "to_stage_name": "Proposal"
}
```

### Status Changed Payload
```json
{
  "from_status": "open",
  "to_status": "won"
}
```

### Button Click Payload
```json
{
  "action": "button_click",
  "field_name": "send_proposal",
  // Additional metadata
}
```

## Configuration

### Environment Variables

```bash
# n8n webhook URL (required)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/crm-events

# Webhook signing secret (optional but recommended)
N8N_WEBHOOK_SECRET=your-secret-key-here

# Dispatcher authorization secret (required)
DISPATCH_SECRET=your-dispatch-secret-here
```

### Webhook Signature

Webhooks are signed using HMAC-SHA256 when `N8N_WEBHOOK_SECRET` is configured.

The signature is sent in the `X-Webhook-Signature` header.

#### Validating in n8n

```javascript
// In n8n Code node
const crypto = require('crypto');

const signature = $webhookHeaders['x-webhook-signature'];
const secret = 'your-secret-key-here';
const body = JSON.stringify($input.all());

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

return $input.all();
```

## Event Dispatcher

### Manual Trigger

Trigger event processing manually:

```bash
curl -X POST https://your-crm.com/api/webhooks/n8n/dispatch \
  -H "X-Dispatch-Secret: your-dispatch-secret-here"
```

### Tenant-Specific Dispatch

Process events for a specific tenant only:

```bash
curl -X POST "https://your-crm.com/api/webhooks/n8n/dispatch?tenant_id=uuid" \
  -H "X-Dispatch-Secret: your-dispatch-secret-here"
```

### Automated Dispatch (Recommended)

#### Vercel Cron

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/webhooks/n8n/dispatch",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Configure cron authorization in Vercel:
- Set `CRON_SECRET` in Vercel environment
- Update dispatcher to accept `Authorization: Bearer [CRON_SECRET]`

#### GitHub Actions

Create `.github/workflows/dispatch-events.yml`:

```yaml
name: Dispatch Events

on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Dispatch
        run: |
          curl -X POST ${{ secrets.CRM_URL }}/api/webhooks/n8n/dispatch \
            -H "X-Dispatch-Secret: ${{ secrets.DISPATCH_SECRET }}"
```

## n8n Workflow Setup

### Webhook Trigger

1. Add **Webhook** node
2. Configure:
   - **HTTP Method**: POST
   - **Path**: `/crm-events`
   - **Authentication**: None (signature validated in workflow)

### Signature Validation

Add **Code** node after webhook:

```javascript
const crypto = require('crypto');

const signature = $webhookHeaders['x-webhook-signature'];
const secret = '{{ $env.WEBHOOK_SECRET }}';
const payload = JSON.stringify($input.all()[0].json.body);

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}

return $input.all();
```

### Route by Entity Type

Add **Switch** node:

```javascript
// Switch on entity_type
return [
  {
    contact: $json.entity_type === 'contact',
    deal: $json.entity_type === 'deal',
  }
];
```

### Route by Event Type

Add **Switch** node for deal events:

```javascript
return [
  {
    created: $json.event_type === 'created',
    stage_changed: $json.event_type === 'stage_changed',
    status_changed: $json.event_type === 'status_changed',
  }
];
```

## Example Workflows

### 1. Notify on Deal Won

```
Webhook Trigger
  → Filter (event_type = status_changed AND to_status = won)
    → Slack Notification
```

### 2. Auto-create Task on Stage Change

```
Webhook Trigger
  → Filter (event_type = stage_changed)
    → HTTP Request (POST /api/activities)
```

### 3. Send Proposal on Button Click

```
Webhook Trigger
  → Filter (action = button_click AND field_name = send_proposal)
    → Get Deal Data
      → Generate PDF
        → Send Email
          → Update Deal Custom Field
```

## Idempotency

Events are marked as `processed` after successful delivery to prevent duplicates.

If delivery fails:
- Retries 3 times with exponential backoff
- Non-retryable errors (4xx except 429) mark as processed immediately
- Other failures remain unprocessed for next dispatch cycle

## Monitoring

### Check Dispatcher Status

```bash
curl https://your-crm.com/api/webhooks/n8n/dispatch
```

Response:
```json
{
  "service": "n8n-event-dispatcher",
  "status": "ready",
  "webhook_url_configured": true,
  "webhook_secret_configured": true
}
```

### Check Callback Receiver

```bash
curl https://your-crm.com/api/webhooks/n8n/callback
```

### Query Unprocessed Events

```sql
SELECT COUNT(*) FROM events WHERE processed = false;
```

## Error Handling

### Graceful Degradation

Event emission failures do not block API responses. If event emission fails:
- Error is logged
- API request continues successfully
- Event dispatcher will retry on next cycle

### Failed Deliveries

Check dispatcher response for partial failures:

```json
{
  "success": true,
  "processed": 45,
  "failed": 2,
  "errors": [
    "Event uuid-1: HTTP 500: Internal Server Error",
    "Event uuid-2: Timeout"
  ]
}
```

HTTP 207 (Multi-Status) indicates partial success.

## Security

### Tenant Isolation

All events include `tenant_id` and are scoped to tenant context. n8n workflows MUST filter by `tenant_id` to prevent cross-tenant data access.

### Signature Validation

Always validate webhook signatures in n8n to prevent unauthorized requests.

### Transport Security

Use HTTPS for all webhook URLs. Never send webhooks over HTTP in production.

## Advanced Usage

### Custom Event Emitters

Create custom automation triggers:

```typescript
import { emitEvent } from '@/lib/events/emitter'

await emitEvent({
  tenantId: 'uuid',
  entityType: 'deal',
  entityId: dealId,
  eventType: 'updated',
  payload: {
    action: 'custom_action',
    metadata: {
      // your data
    }
  }
})
```

### Button Fields with Automations

Define button field in custom_fields:

```json
{
  "entity_type": "deal",
  "field_name": "send_proposal",
  "field_type": "button",
  "options": {
    "label": "Send Proposal",
    "action": "emit_event"
  }
}
```

When clicked, emits:

```json
{
  "event_type": "updated",
  "payload": {
    "action": "button_click",
    "field_name": "send_proposal"
  }
}
```

## Troubleshooting

### Events not dispatching

1. Check `N8N_WEBHOOK_URL` is configured
2. Verify `DISPATCH_SECRET` is set
3. Check dispatcher is being triggered (cron/manual)
4. Query unprocessed events count

### Signature validation failing

1. Ensure `N8N_WEBHOOK_SECRET` matches between CRM and n8n
2. Check signature header name is `X-Webhook-Signature`
3. Verify payload serialization matches (use raw body)

### Workflow not triggering

1. Check webhook URL is accessible
2. Verify n8n workflow is active
3. Check n8n webhook logs for incoming requests
4. Test with manual webhook trigger in n8n
