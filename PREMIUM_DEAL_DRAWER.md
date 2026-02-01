# Premium Deal Drawer - Executive-Level UI

## Overview
High-impact, premium deal view designed for executive-level users. Clean, scannable in under 5 seconds, with strong visual hierarchy.

## Location
`components/deals/deal-drawer.tsx`

## Design Philosophy

### Premium SaaS Aesthetic
- **Linear-inspired**: Clean lines, calm colors, confident spacing
- **Executive-level**: Information density without clutter
- **Scannable**: Key information visible at a glance
- **Polished**: Professional typography and micro-interactions

## Visual Hierarchy

### 1. Header (Most Prominent)
```
┌─────────────────────────────────┐
│ Deal Title (2xl, bold)          │
│ [Status Badge]                  │
│ Pipeline • Stage (muted)        │
└─────────────────────────────────┘
```

**Purpose**: Immediate context of what deal this is and its current status.

**Elements**:
- Title: 2xl font, semibold
- Status badge: Color-coded (blue/green/red)
- Pipeline breadcrumb: Small, muted

### 2. Deal Value (Hero Section)
```
┌─────────────────────────────────┐
│     ┌─────────────────┐         │
│     │   Deal Value    │         │
│     │   R$ 150.000    │ ← 4xl   │
│     └─────────────────┘         │
└─────────────────────────────────┘
```

**Purpose**: The most critical metric - deal worth.

**Design**:
- Centered in highlighted box
- 4xl font size (extra large)
- Primary color
- Background: primary/5 with subtle border
- Rounded corners

### 3. Details Section (Metadata)
```
DETAILS
─────────────────
👤 Assigned to
   John Doe

📅 Expected close
   Feb 15, 2026

🕐 Created
   Jan 10, 2026
```

**Purpose**: Supporting information for context.

**Design**:
- Section header: Uppercase, small, muted
- Icon + label pattern
- Conditional rendering (only show if data exists)
- Subtle colors for secondary info

### 4. Actions (Footer)
```
┌──────────┬──────────┐
│ Mark Won │ Mark Lost│
└──────────┴──────────┘
┌─────────────────────┐
│    Edit Deal        │
└─────────────────────┘
```

**Purpose**: Quick actions for deal management.

**Design**:
- Fixed at bottom
- 2x2 grid for status changes
- Full-width edit button
- Disabled state (UI only for now)

## Components Used

### shadcn/ui
- **Sheet**: Drawer container (slides from right)
- **Badge**: Status indicator
- **Button**: All actions
- **Separator**: Visual breaks between sections

### Lucide Icons
- **X**: Close button
- **User2**: Assigned user
- **Calendar**: Expected close date
- **Clock**: Created date
- **CheckCircle2**: Mark as won
- **XCircle**: Mark as lost

## Props Interface

```typescript
interface DealDrawerProps {
  open: boolean
  onClose: () => void
  deal: {
    id: string
    title: string
    value?: number | null
    status: string
    stageName: string
    pipelineName: string
    assignedTo?: string | null
    expectedCloseDate?: string | null
    createdAt?: string | null
  } | null
}
```

### New Fields
- `assignedTo`: User name (nullable)
- `expectedCloseDate`: ISO date string (nullable)
- `createdAt`: ISO date string (nullable)

## Status Badge Colors

### Implementation
```typescript
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'won':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'lost':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'open':
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
}
```

### Color Coding
- **Open**: Blue (in progress)
- **Won**: Green (success)
- **Lost**: Red (failed)

## Layout Sections

### Header (Fixed)
- **Height**: Auto, based on content
- **Padding**: px-6 pt-6 pb-5
- **Border**: Bottom border
- **Content**: Title, status, pipeline/stage

### Body (Scrollable)
- **Overflow**: Auto (scrolls if content is long)
- **Sections**:
  1. Deal value (emphasized)
  2. Separator
  3. Details metadata

### Footer (Fixed)
- **Height**: Auto
- **Padding**: px-6 py-4
- **Background**: muted/30 (subtle)
- **Border**: Top border
- **Content**: Action buttons

## Spacing System

### Consistent Rhythm
- **Section gaps**: 6 units (24px)
- **Item gaps**: 3 units (12px)
- **Label to value**: 2 units (8px)
- **Padding**: 6 units horizontal

### Typography Scale
- **4xl**: Deal value (36px)
- **2xl**: Title (24px)
- **sm**: Body text (14px)
- **xs**: Labels (12px)

## Conditional Rendering

### Missing Data Handling
```typescript
// Value
{deal.value !== null && deal.value !== undefined
  ? formatCurrency(deal.value)
  : '—'}

// Assigned To
{deal.assignedTo && (
  <div>...</div>
)}

// Expected Close Date
{deal.expectedCloseDate && (
  <div>...</div>
)}

// Created Date
{deal.createdAt && (
  <div>...</div>
)}
```

**Philosophy**: Show what exists, hide what doesn't. No "N/A" or "Not set" for optional fields.

## Action Buttons

### Current State
All buttons are **disabled** (UI only).

### Future Implementation
When enabled:
- **Mark Won**: Update deal status to "won"
- **Mark Lost**: Update deal status to "lost"
- **Edit Deal**: Open edit form/dialog

## Accessibility

### Features
- Close button with aria-label
- Semantic HTML structure
- Keyboard navigation (Sheet default)
- Focus management
- ESC key support

### ARIA
- SheetTitle for screen readers
- SheetDescription for context
- Icon decorative (not read)

## Premium Details

### Micro-interactions
- Smooth slide-in animation
- Button hover states
- Badge styling
- Subtle borders and shadows

### Visual Polish
- Rounded corners on value box
- Icon alignment with text
- Consistent color palette
- Dark mode support

### Typography
- Font weights create hierarchy
- Color contrast for readability
- Letter spacing on labels
- Line height for comfort

## Responsive Design

### Desktop (420px width)
- Fixed width drawer
- All content visible
- Comfortable spacing

### Mobile (Full width)
- Slides from right (full screen)
- Same layout, adjusted width
- Touch-friendly buttons

## Integration

### Dashboard Page
```typescript
const handleDealClick = (deal: KanbanDeal, stageName: string) => {
  setSelectedDeal({
    id: deal.id,
    title: deal.title,
    value: deal.value,
    status: deal.status,
    stageName,
    pipelineName: 'Sales Pipeline',
    assignedTo: deal.assigned_to ? 'Assigned User' : null,
    expectedCloseDate: deal.expected_close_date,
    createdAt: deal.created_at,
  })
}
```

**Note**: `assignedTo` currently shows placeholder "Assigned User" when assigned_to exists (waiting for user name from backend).

## Build Status

✅ **TypeScript compiles successfully**
✅ **No errors or warnings**
✅ **All shadcn components installed**
✅ **Icons imported correctly**

## Testing Checklist

### Visual
- ✅ Title displays at 2xl size
- ✅ Status badge shows correct color
- ✅ Value is prominent (4xl, centered)
- ✅ Value box has subtle background
- ✅ Separator between value and details
- ✅ Icons align with text
- ✅ Action buttons in grid layout
- ✅ Footer has subtle background

### Functionality
- ✅ Opens on card click
- ✅ Closes via X button
- ✅ Closes via ESC key
- ✅ Closes via overlay click
- ✅ Shows all provided fields
- ✅ Hides missing fields gracefully
- ✅ Formats currency correctly
- ✅ Formats dates correctly
- ✅ Buttons are disabled (UI only)

### Edge Cases
- ✅ Null value shows "—"
- ✅ Missing assignedTo hides section
- ✅ Missing dates hide sections
- ✅ Long titles wrap correctly
- ✅ Scrolls if content is long

## Future Enhancements (Not Implemented)

### Phase 2 - Actions
- Enable "Mark Won" button
- Enable "Mark Lost" button
- Enable "Edit Deal" button
- Add mutation logic
- Add optimistic updates
- Add success/error toasts

### Phase 3 - Details
- Contact information section
- Deal notes/comments
- Activity timeline
- Custom fields
- Attachments
- Related deals

### Phase 4 - Advanced
- Real-time updates
- Collaboration features
- Audit log
- Stage history
- Value change tracking

## Design Inspiration

### Inspired By
- Linear (clean, confident)
- Notion (calm, hierarchical)
- Stripe (precise, polished)

### Not Inspired By
- Cluttered enterprise UIs
- Over-animated interfaces
- Busy dashboards

## Performance

### Optimizations
- Conditional rendering reduces DOM
- No unnecessary re-renders
- Lightweight icon library
- Minimal bundle size

### Load Time
- Instant open (state-based)
- No data fetching
- Smooth animations

## Notes

- This is the premium version (v2)
- UI only - no mutations yet
- Ready for future edit features
- Executive-level polish
- Production-ready code quality
