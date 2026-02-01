import crypto from 'crypto'

interface N8nWebhookPayload {
  tenant_id: string
  entity_type: string
  entity_id: string
  event_type: string
  event_id: string
  payload: Record<string, any>
  timestamp: string
}

interface SendWebhookOptions {
  url: string
  payload: N8nWebhookPayload
  secret?: string
  retries?: number
}

/**
 * Generates HMAC signature for webhook payload
 * Uses SHA256 with a shared secret
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Sends a webhook to n8n with signed payload
 * Implements retry logic with exponential backoff
 */
export async function sendWebhook({
  url,
  payload,
  secret,
  retries = 3,
}: SendWebhookOptions): Promise<{ success: boolean; error?: string }> {
  const payloadString = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'iMobi360-CRM/1.0',
  }

  // Add signature if secret is provided
  if (secret) {
    headers['X-Webhook-Signature'] = signPayload(payloadString, secret)
  }

  // Add timestamp for replay protection
  headers['X-Webhook-Timestamp'] = payload.timestamp

  let lastError: string | undefined

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10s timeout
      })

      if (response.ok) {
        return { success: true }
      }

      // Non-retryable errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  return { success: false, error: lastError || 'Max retries exceeded' }
}

/**
 * Validates incoming webhook signature from n8n
 * Used to verify callbacks/confirmations from n8n
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signPayload(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
