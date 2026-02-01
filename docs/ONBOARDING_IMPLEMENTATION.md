# Onboarding Implementation (V1)

## Overview

Canonical onboarding flow for YZIHUB/IMOBI360. Runs after authentication and before dashboard access. This is the production V1 implementation designed for scale.

## Routing Rules (Enforced by Middleware)

```
Unauthenticated → /login
Authenticated + onboarding NOT completed → /onboarding
Authenticated + onboarding completed → /dashboard
```

### Onboarding Completion Condition

A tenant is considered "onboarded" if:
- `tenants.onboarding_completed_at IS NOT NULL` OR
- `tenants.status = 'active'`

## Flow Steps

### Step 1: Welcome
**Route:** `/onboarding`

**Content:**
- Headline: "Vamos configurar seu espaço em menos de 2 minutos"
- Subtext: "Isso nos ajuda a preparar o IMOBI360 do jeito certo pra você."
- CTA: "Começar"

**Fields:** None (welcome screen only)

---

### Step 2: Business Information
**Content:**
- Title: "Informações do negócio"
- Subtitle: "Como devemos chamar sua empresa?"

**Fields:**
1. **business_name** (required, text input)
   - Maps to: `tenants.name`
   - Also generates: `tenants.slug` (auto-generated from name)

2. **business_type** (required, select)
   - Options:
     - Imobiliária
     - Corretor autônomo
     - Incorporadora
     - Outro
   - Maps to: `tenants.business_type`

---

### Step 3: User Role
**Content:**
- Title: "Qual é o seu papel aqui?"
- Subtitle: "Isso nos ajuda a configurar as permissões certas."

**Fields:**
- **userRole** (required, radio)
  - Options:
    - Dono(a) → `admin`
    - Gestor(a) → `manager`
    - Corretor(a) → `member`
  - Maps to: `users.role`

---

### Step 4: Pipeline
**Content:**
- Title: "Pipeline de vendas"
- Subtitle: "Como você costuma trabalhar seus leads?"

**Options:**
1. **Pipeline padrão** (recommended)
   - Uses existing default pipeline (already seeded)
   - Shows stage preview: Novo Lead → Contato → Qualificado → Proposta → Negociação → Ganho/Perdido

2. **Ajustar depois**
   - Allows customization in settings later

**Behavior:**
- No pipeline creation happens here
- Default pipeline is already seeded via `seed_admin.sql`
- Choice is informational only

---

### Step 5: Completion
**Content:**
- Title: "Seu espaço está pronto"
- Subtitle: "Tudo configurado! Você já pode começar a usar o IMOBI360."
- Shows success state with business name confirmation
- CTA: "Ir para o Dashboard"

**On Submit:**
Updates via `/api/onboarding/complete`:
```sql
UPDATE tenants SET
  name = [businessName],
  slug = [generated-slug],
  business_type = [businessType],
  status = 'active',
  onboarding_completed_at = NOW()
WHERE id = [tenantId];

UPDATE users SET
  role = [userRole]
WHERE auth_user_id = [authUserId]
  AND tenant_id = [tenantId];
```

Then redirects to `/dashboard`.

---

## Database Schema Changes

### Migration: `001_add_onboarding_fields.sql`

Added to `tenants` table:
```sql
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS business_type TEXT;
```

**Backward Compatibility:**
Existing active tenants are automatically marked as onboarded:
```sql
UPDATE tenants
SET onboarding_completed_at = created_at
WHERE status = 'active'
  AND onboarding_completed_at IS NULL;
```

### Updated Schema

Updated `docs/schema.sql`:
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  plan tenant_plan NOT NULL DEFAULT 'free',
  status tenant_status NOT NULL DEFAULT 'active',
  business_type TEXT,                    -- NEW
  onboarding_completed_at TIMESTAMPTZ,   -- NEW
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## File Structure

### Created Files

```
app/(onboarding)/
├── layout.tsx                          # Minimal centered layout
└── onboarding/
    └── page.tsx                        # Onboarding page wrapper

components/onboarding/
└── onboarding-stepper.tsx             # Client-side stepper component

app/api/onboarding/
└── complete/
    └── route.ts                        # Completion API endpoint

docs/migrations/
└── 001_add_onboarding_fields.sql      # Database migration
```

### Modified Files

```
middleware.ts                           # Added onboarding routing logic
docs/schema.sql                         # Updated canonical schema
src/types/supabase.ts                   # Added new fields to types
```

---

## Middleware Logic

The middleware enforces strict routing rules:

```typescript
// 1. Unauthenticated users → /login
if (!user && (isDashboardRoute || isOnboardingRoute)) {
  return redirect('/login')
}

// 2. Authenticated users
if (user) {
  const onboardingCompleted =
    tenant?.onboarding_completed_at !== null ||
    tenant?.status === 'active'

  // Not onboarded + trying to access dashboard → /onboarding
  if (!onboardingCompleted && isDashboardRoute) {
    return redirect('/onboarding')
  }

  // Already onboarded + trying to access onboarding → /dashboard
  if (onboardingCompleted && isOnboardingRoute) {
    return redirect('/dashboard')
  }

  // Already onboarded + trying to access login → /dashboard
  if (onboardingCompleted && isAuthRoute) {
    return redirect('/dashboard')
  }

  // Not onboarded + trying to access login → /onboarding
  if (!onboardingCompleted && isAuthRoute) {
    return redirect('/onboarding')
  }
}
```

**Middleware Matcher:**
```typescript
matcher: [
  '/dashboard/:path*',
  '/leads/:path*',
  '/imoveis/:path*',
  '/contratos/:path*',
  '/financeiro/:path*',
  '/analytics/:path*',
  '/login',
  '/onboarding',  // NEW
]
```

---

## UX Features

### Progress Indicator
- Shows "Passo X de 5"
- Visual progress bars (filled vs unfilled)
- Updates on each step

### Validation
- Real-time field validation
- Clear error messages in Portuguese
- Prevents progression without required fields

### Loading States
- Disabled buttons during API calls
- Spinner with descriptive text ("Preparando...")
- Prevents double submission

### Navigation
- "Voltar" button on steps 3-4
- "Continuar" button on steps 2-4
- "Ir para o Dashboard" on step 5
- No back button on step 1 (welcome)

### Accessibility
- Keyboard navigation
- Focus management
- ARIA labels on radio buttons
- Semantic HTML structure
- Screen reader friendly

### Theme Support
- Respects light/dark/system theme
- Uses theme-aware colors (`bg-background`, `text-muted-foreground`, etc.)
- Consistent with login UX

---

## API Endpoint

### `POST /api/onboarding/complete`

**Request Body:**
```json
{
  "tenantId": "uuid",
  "businessName": "string",
  "businessType": "Imobiliária" | "Corretor autônomo" | "Incorporadora" | "Outro",
  "slug": "string",
  "userRole": "admin" | "manager" | "member"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing required fields
- `401` - Unauthorized (no session)
- `500` - Server error

**Security:**
- Requires authenticated session
- Uses Supabase RLS policies
- Validates tenant ownership
- No service role bypass

---

## Slug Generation

Business name is converted to URL-safe slug:

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')                    // Decompose accents
    .replace(/[\u0300-\u036f]/g, '')    // Remove accent marks
    .replace(/[^a-z0-9]+/g, '-')        // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')            // Remove leading/trailing hyphens
}
```

**Examples:**
- "Imobiliária Exemplo" → `imobiliaria-exemplo`
- "João's Real Estate" → `joaos-real-estate`
- "Corretor 123" → `corretor-123`

---

## Testing Checklist

### Manual Tests
- [ ] Unauthenticated user redirects to /login
- [ ] New user after login redirects to /onboarding
- [ ] Cannot access /dashboard before onboarding
- [ ] Cannot access /login after starting onboarding
- [ ] All 5 steps display correctly
- [ ] Field validation works (business name, type, role)
- [ ] Back button works on steps 3-4
- [ ] Cannot skip steps
- [ ] Slug generates correctly from business name
- [ ] API completes onboarding successfully
- [ ] Redirects to /dashboard after completion
- [ ] Cannot access /onboarding after completion
- [ ] Session persists through onboarding
- [ ] Theme (light/dark) works correctly
- [ ] Mobile responsive layout

### Build Tests
- [x] TypeScript compilation passes
- [x] Next.js build succeeds
- [x] All routes generate correctly
- [x] No type errors in middleware
- [x] API route is accessible

---

## Production Deployment

### 1. Apply Migration

Run the migration on your Supabase database:

```bash
psql $DATABASE_URL -f docs/migrations/001_add_onboarding_fields.sql
```

Or apply via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `001_add_onboarding_fields.sql`
3. Execute query

### 2. Verify Existing Tenants

Check that existing active tenants are marked as onboarded:

```sql
SELECT id, name, status, onboarding_completed_at
FROM tenants
WHERE status = 'active';
```

All should have `onboarding_completed_at` populated.

### 3. Deploy to Vercel

```bash
git push origin main
```

Vercel will automatically build and deploy.

### 4. Test Flow

1. Create a new test user in Supabase Auth
2. Log in via `/login`
3. Verify redirect to `/onboarding`
4. Complete all steps
5. Verify redirect to `/dashboard`
6. Log out and log back in
7. Verify direct access to `/dashboard` (no onboarding)

---

## Future Enhancements (Out of Scope)

- Multi-language support (currently Portuguese only)
- Skip onboarding option for invited users
- Pre-fill business info from OAuth profile
- Team invitations during onboarding
- Custom pipeline creation wizard
- Import data during onboarding
- Guided tour after onboarding

---

## Notes

- **No rework needed** - This is the canonical V1 implementation
- **Backward compatible** - Existing tenants automatically marked as onboarded
- **Type-safe** - Full TypeScript coverage
- **RLS compliant** - Respects all security policies
- **Premium UX** - Matches login quality level
- **Mobile ready** - Responsive design
- **Theme aware** - Supports light/dark/system

---

## Support

For implementation questions or issues, refer to:
- `docs/schema.sql` - Database structure
- `docs/migrations/001_add_onboarding_fields.sql` - Migration script
- `middleware.ts` - Routing logic
- `components/onboarding/onboarding-stepper.tsx` - UI implementation
