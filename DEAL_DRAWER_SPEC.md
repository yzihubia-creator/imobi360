# Deal Drawer Component Specification

## Overview
Premium, production-grade drawer component for displaying deal details. UI only - no API calls, no mutations.

## Location
`components/deals/deal-drawer.tsx`

## Technology
- **Component**: shadcn/ui Sheet
- **Slide Direction**: Right side
- **Width**: 420px (desktop), full width (mobile)

## Props Interface

```typescript
interface DealDrawerProps {
  open: boolean              // Controls drawer visibility
  onClose: () => void       // Callback when drawer should close
  deal: {
    id: string
    title: string
    value?: number | null
    status: string
    stageName: string
    pipelineName: string
  } | null
}
```

## Behavior

### Rendering Logic
- If `deal === null`: Renders nothing
- If `deal` exists: Renders Sheet with deal information
- Sheet opens/closes based on `open` prop
- Calls `onClose()` when user dismisses drawer

## Layout Structure

```
┌─────────────────────────────────────┐
│ Header (border-bottom)              │
│  - Deal Title (xl, semibold)        │
│  - Pipeline • Stage (muted)         │
│  - Close button (top-right)         │
├─────────────────────────────────────┤
│ Body (scrollable)                   │
│                                     │
│  Value Section                      │
│  - Label: "Value"                   │
│  - Amount (2xl, primary) or "Not set"│
│                                     │
│  Status Section                     │
│  - Label: "Status"                  │
│  - Badge (color-coded)              │
│                                     │
│  Stage Section                      │
│  - Label: "Pipeline Stage"          │
│  - Stage name (medium)              │
│  - Pipeline name (muted)            │
│                                     │
├─────────────────────────────────────┤
│ Footer (border-top, muted bg)       │
│  - Close button (full width)        │
└─────────────────────────────────────┘
```

## Visual Design

### Spacing
- Header: `px-6 pt-6 pb-4`
- Body: `px-6 py-6`
- Footer: `px-6 py-4`
- Section gap: `space-y-6`
- Inner section gap: `space-y-2`

### Typography
- Title: `text-xl font-semibold`
- Pipeline/Stage: `text-sm text-muted-foreground`
- Section labels: `text-sm font-medium text-muted-foreground`
- Value: `text-2xl font-semibold text-primary`
- Stage name: `text-base font-medium`

### Status Badge Colors
- **Open**: Blue (`bg-blue-100 text-blue-700` / dark variant)
- **Won**: Green (`bg-green-100 text-green-700` / dark variant)
- **Lost**: Red (`bg-red-100 text-red-700` / dark variant)
- **Other**: Gray (`bg-gray-100 text-gray-700` / dark variant)

### Overlay
- Subtle background dim via Sheet default overlay
- Premium feel, not heavy

## Accessibility

### Features
- Close button with `aria-label="Close drawer"`
- Semantic heading structure
- Keyboard navigation support (via Sheet)
- Focus trap when open
- ESC key to close

### ARIA
- SheetTitle for screen readers
- SheetDescription for context
- Proper heading hierarchy

## Integration Points

### Consumes
- `formatCurrency` from `@/lib/utils/format`
- shadcn/ui components: Sheet, Button
- Lucide icon: X (close)

### Used By
- Future: KanbanCard onClick handler
- Future: Deal detail views

## State Management

### Props Only
- No internal state
- No side effects
- No data fetching
- Pure presentation component

### Controlled Component
- Parent controls `open` state
- Parent handles close via `onClose` callback
- No local open/close logic

## Future Enhancements (Not Implemented)

### Would Be Added Later
- Edit button in footer
- Delete action
- Contact information section
- Activity timeline
- Notes/comments
- Custom fields display
- Stage change dropdown
- Assignment controls

## Usage Example

```typescript
import { DealDrawer } from '@/components/deals/deal-drawer'

function KanbanCard({ deal }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <Card onClick={() => setDrawerOpen(true)}>
        {/* Card content */}
      </Card>

      <DealDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        deal={{
          id: deal.id,
          title: deal.title,
          value: deal.value,
          status: deal.status,
          stageName: stage.name,
          pipelineName: pipeline.name,
        }}
      />
    </>
  )
}
```

## Edge Cases Handled

### Null Value
- Shows "Not set" instead of currency
- Maintains layout consistency

### Long Titles
- Text wraps naturally
- Close button positioned absolutely
- Proper spacing maintained

### Scrolling
- Body is scrollable
- Header and footer are fixed
- Smooth overflow behavior

## Premium Details

### Micro-interactions
- Close button hover state
- Smooth slide-in animation (Sheet default)
- Overlay fade (Sheet default)

### Visual Hierarchy
- Clear separation between sections
- Consistent spacing rhythm
- Professional color coding
- Dark mode support

### Polish
- Muted footer background for separation
- Border separators (header/footer)
- Status badge with rounded corners
- Proper text truncation

## Technical Details

### Performance
- Zero unnecessary re-renders (controlled via props)
- No data fetching overhead
- Minimal bundle size
- Fast render

### TypeScript
- Fully typed props
- No `any` types
- Proper null handling
- Type-safe deal object

## Testing Checklist

- ✅ Drawer opens when `open={true}`
- ✅ Drawer closes when `open={false}`
- ✅ `onClose()` called on close button click
- ✅ `onClose()` called on overlay click
- ✅ `onClose()` called on ESC key
- ✅ Renders nothing when `deal === null`
- ✅ Displays title correctly
- ✅ Shows pipeline and stage
- ✅ Formats currency with `formatCurrency`
- ✅ Shows "Not set" for null value
- ✅ Status badge color matches status
- ✅ Status text is capitalized
- ✅ Close button in header works
- ✅ Close button in footer works
- ✅ TypeScript compiles without errors
- ✅ No console errors
- ✅ Responsive on mobile (full width)
- ✅ Desktop width is 420px

## Notes

- This is UI only (v1)
- No edit functionality yet
- No API integration yet
- Ready to wire to card clicks
- Ready for future enhancements
- Follows GSD: no speculation, just requirements
