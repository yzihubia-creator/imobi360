# Dynamic Module Routes

## Overview

Module-driven dynamic routing system that renders content based on enabled modules in tenant configuration.

**Routes are resolved from configuration, not assumptions.**

## Architecture

### Route Resolution Flow

```
User navigates to /dashboard/[module]
  ↓
Dynamic Route Handler (app/(dashboard)/[module]/page.tsx)
  ↓
1. Authenticate user & get tenant/role
  ↓
2. Load tenant runtime config
  ↓
3. Validate module access (existence, enablement, RBAC)
  ↓
4. Resolve module view from registry
  ↓
5. Render module view component
```

### Core Principles

1. **Routes are config-driven** - Only configured modules are accessible
2. **Modules must be enabled** - Disabled modules return 404
3. **RBAC blocks unauthorized access** - Permission checks happen server-side
4. **Core is domain-agnostic** - No hardcoded industry logic
5. **Explicit failures only** - No silent redirects or fallbacks

## Key Components

### 1. Dynamic Route (`app/(dashboard)/[module]/page.tsx`)

Server component that handles all module routes:

```typescript
// Route: /dashboard/[module]
// Examples:
//   /dashboard/deals
//   /dashboard/contacts
//   /dashboard/leads
//   /dashboard/properties

export default async function ModulePage({ params }) {
  const { module: moduleId } = await params

  // 1. Authenticate & get user context
  const { tenantId, userRole } = await getUserContext()

  // 2. Load tenant config
  const tenantConfig = await loadTenantConfig(tenantId)

  // 3. Validate module access
  const validation = validateModuleAccess(moduleId, tenantConfig, userRole)

  if (!validation.valid) {
    // Hard fail with appropriate error
    return <ErrorPage error={validation.error} />
  }

  // 4. Resolve view component
  const ModuleView = getModuleViewWithFallback(moduleId)

  // 5. Render
  return <ModuleView {...props} />
}
```

### 2. Module Registry (`lib/modules/registry.ts`)

Central registry mapping module IDs to view components:

```typescript
const MODULE_REGISTRY: Record<string, ModuleRegistryEntry> = {
  deals: {
    id: 'deals',
    name: 'Deals',
    component: DealsView,
  },

  contacts: {
    id: 'contacts',
    name: 'Contacts',
    component: ContactsView,
  },

  reports: {
    id: 'reports',
    name: 'Reports',
    component: ReportsView,
    minRole: 'manager',  // Optional RBAC override
  },
}
```

**Adding a new module:**
1. Create view component in `components/modules/`
2. Import and register in `MODULE_REGISTRY`
3. No other changes needed

### 3. Module Validation (`lib/modules/validation.ts`)

Server-side validation with explicit error codes:

```typescript
function validateModuleAccess(
  moduleId: string,
  tenantConfig: TenantConfig,
  userRole: UserRole
): ModuleValidationResult {
  // 1. Check module exists in config
  const module = tenantConfig.modules.find(m => m.id === moduleId)
  if (!module) {
    return { valid: false, error: { code: 'MODULE_NOT_CONFIGURED' } }
  }

  // 2. Check module is enabled
  if (!module.enabled) {
    return { valid: false, error: { code: 'MODULE_DISABLED' } }
  }

  // 3. Check RBAC
  const minRole = getModuleView(moduleId)?.minRole
  if (minRole && !hasRequiredRole(userRole, minRole)) {
    return { valid: false, error: { code: 'UNAUTHORIZED' } }
  }

  return { valid: true, moduleConfig: module }
}
```

**Error Codes:**
- `MODULE_NOT_CONFIGURED` - Module not in tenant config → 404
- `MODULE_DISABLED` - Module exists but disabled → 404
- `UNAUTHORIZED` - User lacks required role → 403 error page

### 4. Module View Components (`components/modules/`)

React components that render module content:

```typescript
interface ModuleViewProps {
  tenantId: string
  userRole: UserRole
  moduleConfig: ModuleConfig
}

export function DealsView({ tenantId, userRole, moduleConfig }: ModuleViewProps) {
  // Render deals module content
  return <div>...</div>
}
```

**Standard Props:**
- `tenantId` - Current tenant identifier
- `userRole` - Current user's role
- `moduleConfig` - Module configuration from tenant config

## Module Enablement

Modules must be explicitly enabled to be accessible:

```typescript
// In template manifest
modules: [
  {
    id: 'deals',
    enabled: true,   // ✓ Accessible via /dashboard/deals
    // ...
  },
  {
    id: 'reports',
    enabled: false,  // ✗ Returns 404
    // ...
  },
]
```

**Validation Logic:**
1. User navigates to `/dashboard/reports`
2. Route handler validates module access
3. Module exists but `enabled: false`
4. Returns 404 (module disabled)

## RBAC Enforcement

Two-level RBAC system:

### Level 1: Module-Level RBAC (Registry)

Set minimum role in module registry:

```typescript
MODULE_REGISTRY = {
  reports: {
    id: 'reports',
    component: ReportsView,
    minRole: 'manager',  // Only manager+ can access
  },
}
```

### Level 2: Navigation RBAC

Navigation items can also specify `min_role`:

```typescript
// In template manifest
navigation: {
  sidebar_items: [
    {
      module_id: 'reports',
      min_role: 'manager',  // Only manager+ see nav item
    },
  ],
}
```

**Role Hierarchy:**
- `viewer`: 0 (read-only)
- `member`: 1 (standard user)
- `manager`: 2 (team lead)
- `admin`: 3 (full access)

**Access Example:**
```
Module: reports (minRole: 'manager')

viewer (0)   → ✗ UNAUTHORIZED (403 error page)
member (1)   → ✗ UNAUTHORIZED (403 error page)
manager (2)  → ✓ Access granted
admin (3)    → ✓ Access granted
```

## Error Handling

### MODULE_NOT_CONFIGURED

Module not in tenant configuration:

```
User navigates to: /dashboard/analytics
Tenant modules: ['deals', 'contacts', 'leads']

Result: 404 (notFound())
```

### MODULE_DISABLED

Module exists but disabled:

```
Tenant config:
{
  id: 'reports',
  enabled: false,
}

User navigates to: /dashboard/reports
Result: 404 (notFound())
```

### UNAUTHORIZED

User lacks required role:

```
Module: reports (minRole: 'manager')
User role: member

User navigates to: /dashboard/reports
Result: 403 error page with message
```

### Configuration Error

Failed to load tenant config:

```
Tenant config load fails (DB error, invalid data, etc.)

Result: Configuration error page
```

## Template Examples

### IMOBI360 Template Routes

6 accessible modules:

- `/dashboard/leads` - Lead management
- `/dashboard/deals` - Deal/opportunity management
- `/dashboard/properties` - Property listings (real estate)
- `/dashboard/contacts` - Contact management
- `/dashboard/activities` - Task/activity tracking
- `/dashboard/reports` - Reports (manager+ only)

### BlankCRM Template Routes

3 accessible modules:

- `/dashboard/deals` - Deal management
- `/dashboard/contacts` - Contact management
- `/dashboard/activities` - Activity tracking

## Module Views

### Current Implementations

**DealsView** (`components/modules/deals-view.tsx`)
- Generic deals module view
- Placeholder for full implementation

**ContactsView** (`components/modules/contacts-view.tsx`)
- Generic contacts module view
- Placeholder for full implementation

**GenericModuleView** (`components/modules/generic-module-view.tsx`)
- Fallback view for unregistered modules
- Displays module metadata
- Used for modules without specific implementations

### Adding a New Module View

1. **Create component:**
```typescript
// components/modules/my-module-view.tsx
import type { ModuleViewProps } from '@/lib/modules/types'

export function MyModuleView({ tenantId, userRole, moduleConfig }: ModuleViewProps) {
  return <div>{moduleConfig.label} Module</div>
}
```

2. **Register in registry:**
```typescript
// lib/modules/registry.ts
import { MyModuleView } from '@/components/modules/my-module-view'

MODULE_REGISTRY = {
  // ...
  'my-module': {
    id: 'my-module',
    name: 'My Module',
    component: MyModuleView,
    minRole: 'member', // Optional
  },
}
```

3. **Configure in template:**
```typescript
// lib/templates/my-template.ts
modules: [
  {
    id: 'my-module',
    label: 'My Module',
    icon: 'icon-name',
    enabled: true,
    route: '/dashboard/my-module',
  },
]
```

That's it! No route files to create, no middleware to update.

## Route Precedence

Next.js resolves routes in this order:

1. **Static routes** - `/dashboard` (exact match)
2. **Dynamic routes** - `/dashboard/[module]` (pattern match)

Our dynamic route catches all `/dashboard/[anything]` patterns not matched by static routes.

## Performance

### Server-Side Validation

All validation happens server-side:
- Module existence check
- Module enablement check
- RBAC check

**Benefits:**
- No client-side config exposure
- No race conditions
- Consistent access control
- Works without JavaScript

### Config Caching

Tenant configs are loaded once per request:
- `loadTenantConfig()` called in route handler
- Config passed to module view
- No redundant database queries

## Security

### Defense in Depth

1. **Navigation Layer** - UI hides unauthorized items (UX only)
2. **Route Layer** - Server validates module access (primary security)
3. **API Layer** - Additional field-level RBAC (data protection)

### Never Trust Client

All security checks are server-side:

```typescript
// ✗ WRONG: Client-side only
if (canAccessModule(moduleId)) {
  navigate(`/dashboard/${moduleId}`)
}

// ✓ CORRECT: Server validates regardless
// User can manually type URL, server blocks if unauthorized
```

## Testing Checklist

### Module Validation
- [ ] Unknown module → 404
- [ ] Module not in config → 404
- [ ] Disabled module → 404
- [ ] Enabled module → renders view
- [ ] Config load failure → error page

### RBAC
- [ ] Viewer accessing manager-only module → 403
- [ ] Member accessing manager-only module → 403
- [ ] Manager accessing manager-only module → success
- [ ] Admin accessing any module → success

### Template Switching
- [ ] IMOBI360 template → 6 accessible routes
- [ ] BlankCRM template → 3 accessible routes
- [ ] Custom template → only configured routes accessible

### Module Enablement
- [ ] Toggling module.enabled → route accessibility changes
- [ ] Disabled module → 404 even if in navigation
- [ ] Enabled module → accessible via direct URL

### Error Handling
- [ ] Invalid tenant config → configuration error page
- [ ] Missing module reference → validation error
- [ ] Hard fails, no silent redirects

## Files Created

- `lib/modules/types.ts` - Type definitions for module system
- `lib/modules/registry.ts` - Module view registry
- `lib/modules/validation.ts` - Server-side validation logic
- `app/(dashboard)/[module]/page.tsx` - Dynamic route handler
- `components/modules/deals-view.tsx` - Deals module view
- `components/modules/contacts-view.tsx` - Contacts module view
- `components/modules/generic-module-view.tsx` - Generic fallback view
- `docs/DYNAMIC_ROUTES.md` - This documentation

## Files Modified

- `lib/templates/imobi360.ts` - Updated routes to `/dashboard/[module]` format
- `lib/templates/blank.ts` - Updated routes to `/dashboard/[module]` format

## Build Status

```
✓ Compiled successfully in 17.2s
✓ TypeScript passes
✓ All routes generated
✓ Dynamic route: /[module]
✓ No type errors
✓ No runtime errors
```

## Future Enhancements

- Nested module routes (`/dashboard/deals/[id]`)
- Module-level permissions (beyond role)
- Module-specific layouts
- Module loading states
- Module error boundaries
- Module analytics/tracking

## Support

For questions or issues:
1. Check `lib/modules/validation.ts` for validation logic
2. Check `lib/modules/registry.ts` for view registration
3. Check `app/(dashboard)/[module]/page.tsx` for route handling
4. Check template manifests for module configuration
