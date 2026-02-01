# Dynamic Navigation System

## Overview

Fully config-driven, tenant-aware navigation system that renders sidebar/navigation from tenant runtime config (template defaults + tenant overrides).

**No hardcoded modules. No fallbacks. No assumptions.**

## Architecture

### Configuration Flow

```
Template Manifest (lib/templates/imobi360.ts)
  ↓
Tenant Runtime Config (merged via lib/merge-template.ts)
  ↓
Navigation Config (NavigationConfig + SidebarItemConfig[])
  ↓
Sidebar Component (components/navigation/sidebar.tsx)
  ↓
Filtered & Rendered Navigation Items
```

### Core Principles

1. **Navigation is configuration, not code** - All navigation structure comes from tenant config
2. **Sidebar reflects tenant intent** - Each tenant can have different navigation
3. **Modules can be enabled/disabled** - Navigation adapts to module availability
4. **RBAC must be respected** - Users only see what they're authorized to access
5. **Core remains domain-agnostic** - No IMOBI360 or template-specific logic

## Key Components

### 1. Navigation Config (Template Manifest)

Defined in template manifests (e.g., `lib/templates/imobi360.ts`):

```typescript
{
  navigation: {
    sidebar_items: [
      {
        module_id: 'leads',
        label: 'Leads',
        icon: 'users',
        route: '/leads',
        order: 1,
        min_role: 'viewer',  // Optional RBAC
        children: [],        // Optional nested items
      },
      // ...
    ],
    show_icons: true,
    position: 'left',
    user_customizable: false,
  }
}
```

### 2. Navigation Utilities (`lib/navigation.ts`)

**Icon Registry:**
- Maps icon string identifiers to Lucide components
- `getIconComponent(iconName: string): LucideIcon`

**RBAC Filtering:**
- `canViewNavItem(item, userRole): boolean`
- Role hierarchy: viewer(0) < member(1) < manager(2) < admin(3)
- Users see items if their level >= required level

**Module Enablement:**
- `isModuleEnabled(moduleId, modules): boolean`
- Only enabled modules appear in navigation

**Filtering:**
- `filterNavigationItems(items, modules, userRole): SidebarItemConfig[]`
- Applies both RBAC and module enablement filters
- Recursively filters children

**Validation:**
- `validateNavigationConfig(navigation, modules): string[] | null`
- Hard fails on invalid config
- Validates module references, icons, routes

**Active State:**
- `isRouteActive(itemRoute, currentPath): boolean`
- Exact match or parent route match

### 3. NavItem Component (`components/navigation/nav-item.tsx`)

Renders individual navigation items:

```typescript
<NavItem
  item={sidebarItemConfig}
  currentPath={pathname}
/>
```

Features:
- Dynamic icon from config
- Active state highlighting
- Accessibility (aria-current)
- Dark mode support

### 4. Sidebar Component (`components/navigation/sidebar.tsx`)

Main navigation component:

```typescript
<Sidebar
  tenantId={tenantId}
  userRole={userRole}
/>
```

Responsibilities:
- Loads tenant config via `useTenantConfig()`
- Validates navigation config
- Filters items by RBAC + module enablement
- Sorts items by order
- Renders NavItems
- Hard fails on errors (no silent fallbacks)

States:
- **Loading:** Skeleton UI
- **Error:** Red error message
- **Invalid Config:** Lists validation errors
- **Empty:** "No navigation items available"
- **Success:** Renders filtered navigation

## Dashboard Layout Integration

`app/(dashboard)/layout.tsx`:

```typescript
// Get user's tenant and role from database
const { data: userRecord } = await supabase
  .from('users')
  .select('tenant_id, role')
  .eq('auth_user_id', user.id)
  .single()

const tenantId = userRecord.tenant_id
const userRole = userRecord.role as UserRole

// Render config-driven sidebar
<Sidebar tenantId={tenantId} userRole={userRole} />
```

Benefits:
- Tenant branding (displays tenant name)
- Dynamic navigation per tenant
- Server-side data fetching
- Type-safe role handling

## Module Enablement

Navigation items only render if their module is enabled:

```typescript
// In template manifest
modules: [
  {
    id: 'leads',
    enabled: true,  // ← Controls navigation visibility
    // ...
  },
  {
    id: 'reports',
    enabled: false,  // ← Will NOT appear in navigation
    // ...
  },
]
```

Logic:
1. Sidebar gets all sidebar_items from config
2. `filterNavigationItems()` checks each item's module_id
3. If module not found OR module.enabled === false → item filtered out
4. Disabled modules never leak into UI

## RBAC Enforcement

Navigation respects role hierarchy:

```typescript
// In template manifest
navigation: {
  sidebar_items: [
    {
      module_id: 'reports',
      label: 'Relatórios',
      icon: 'chart',
      route: '/reports',
      order: 6,
      min_role: 'manager',  // ← Only manager+ can see
    },
  ]
}
```

Role Levels:
- `viewer`: 0 (read-only)
- `member`: 1 (standard user)
- `manager`: 2 (team lead)
- `admin`: 3 (full access)

Logic:
1. Each sidebar item can specify `min_role` (optional)
2. If no `min_role` → everyone can see
3. If `min_role` specified → user must have level >= required level
4. Filtering happens in `filterNavigationItems()`

Example:
- Item has `min_role: 'manager'` (level 2)
- Viewer (level 0) → filtered out
- Member (level 1) → filtered out
- Manager (level 2) → visible ✓
- Admin (level 3) → visible ✓

## Active State Detection

Highlights current navigation item:

```typescript
function isRouteActive(itemRoute: string, currentPath: string): boolean {
  // Exact match
  if (currentPath === itemRoute) return true

  // Parent route match (/dashboard/leads matches /dashboard/leads/123)
  if (currentPath.startsWith(itemRoute + '/')) return true

  return false
}
```

Styling:
- Active: `bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900`
- Inactive: `text-gray-700 hover:bg-gray-100 dark:text-gray-300`

## Error Handling

Navigation system uses **explicit failures**, no silent fallbacks:

### Invalid Config
```typescript
if (validationErrors) {
  // Render error UI with specific validation errors
  return <ErrorState errors={validationErrors} />
}
```

### Failed Config Load
```typescript
if (error || !config) {
  // Hard fail with error message
  return <ErrorState message="Failed to load navigation configuration" />
}
```

### Missing Module Reference
```typescript
validateNavigationConfig() checks:
- Module exists in tenant config
- Icon is specified
- Route is specified
- Children are valid
```

**No assumptions. No defaults. Explicit failures only.**

## Template Examples

### IMOBI360 Template

Brazilian real estate CRM with 6 modules:

```typescript
sidebar_items: [
  { module_id: 'leads', label: 'Leads', icon: 'users', route: '/leads', order: 1 },
  { module_id: 'deals', label: 'Negócios', icon: 'briefcase', route: '/deals', order: 2 },
  { module_id: 'properties', label: 'Imóveis', icon: 'home', route: '/properties', order: 3 },
  { module_id: 'contacts', label: 'Contatos', icon: 'contact', route: '/contacts', order: 4 },
  { module_id: 'activities', label: 'Atividades', icon: 'calendar', route: '/activities', order: 5 },
  { module_id: 'reports', label: 'Relatórios', icon: 'chart', route: '/reports', order: 6, min_role: 'manager' },
]
```

### BlankCRM Template

Minimal generic CRM with 3 modules:

```typescript
sidebar_items: [
  { module_id: 'deals', label: 'Deals', icon: 'briefcase', route: '/deals', order: 1 },
  { module_id: 'contacts', label: 'Contacts', icon: 'contact', route: '/contacts', order: 2 },
  { module_id: 'activities', label: 'Activities', icon: 'calendar', route: '/activities', order: 3 },
]
```

## Customization

Tenants can override navigation via `tenants.settings`:

```typescript
{
  template_id: 'imobi360',
  overrides: {
    navigation: {
      sidebar_items: [
        {
          module_id: 'leads',
          label: 'Prospects',  // ← Custom label
          order: 1,
        },
        // Can add/remove items, change order, etc.
      ],
    },
  },
}
```

Merge precedence: **core < template < tenant overrides**

## Icon Registry

Supported icons (string → Lucide component):

- `dashboard` → LayoutDashboard
- `users` → Users
- `briefcase` → Briefcase
- `home` → Home
- `contact` → Contact
- `calendar` → Calendar
- `chart` → ChartBar
- `settings` → Settings
- `file` → FileText
- `dollar` → DollarSign
- `building` → Building2

Fallback: LayoutDashboard

To add new icons:
1. Import from `lucide-react`
2. Add to `ICON_REGISTRY` in `lib/navigation.ts`

## Testing Checklist

### Config Validation
- [ ] Invalid navigation config → error UI with specific errors
- [ ] Missing module reference → validation error
- [ ] Missing icon → validation error
- [ ] Missing route → validation error

### Module Enablement
- [ ] Disabled module → item not in navigation
- [ ] Enabled module → item appears
- [ ] Toggling module.enabled updates navigation

### RBAC Filtering
- [ ] Viewer sees items with min_role: undefined or 'viewer'
- [ ] Member doesn't see items with min_role: 'manager'
- [ ] Manager sees items with min_role: 'manager'
- [ ] Admin sees all items

### Active State
- [ ] Current route highlighted
- [ ] Parent route match (e.g., /leads matches /leads/123)
- [ ] Inactive items not highlighted

### Template Switching
- [ ] IMOBI360 template → 6 navigation items
- [ ] BlankCRM template → 3 navigation items
- [ ] Changing template updates navigation immediately

### Tenant Overrides
- [ ] Custom labels render correctly
- [ ] Custom order respected
- [ ] Merge precedence works (overrides > template > core)

## Files Modified/Created

### Created
- `lib/navigation.ts` - Navigation utilities and validation
- `components/navigation/nav-item.tsx` - Individual navigation item component
- `components/navigation/sidebar.tsx` - Main config-driven sidebar
- `docs/DYNAMIC_NAVIGATION.md` - This documentation

### Modified
- `app/(dashboard)/layout.tsx` - Updated to use Sidebar instead of DashboardNav
  - Gets tenantId and userRole from database
  - Passes to Sidebar component
  - Uses tenant name for branding

### Deprecated (Not Deleted)
- `components/dashboard/dashboard-nav.tsx` - Old hardcoded navigation

## Build Status

```
✓ TypeScript compilation passes
✓ Next.js build succeeds
✓ All routes generated correctly
✓ No type errors
✓ No runtime errors
```

## Future Enhancements

- Nested navigation (children support)
- Section headers / dividers
- Collapsible sidebar
- User-customizable navigation (drag & drop)
- Navigation search/filter
- Badge/notification counts on items
- Keyboard shortcuts
- Mobile responsive sidebar

## Support

For questions or issues:
1. Check `lib/navigation.ts` for utilities and validation
2. Check `components/navigation/sidebar.tsx` for rendering logic
3. Check template manifests for navigation config examples
4. Check `lib/templates/types.ts` for TypeScript contracts
