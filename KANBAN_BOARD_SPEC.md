# Kanban Board Component Specification

## Overview
Clean, premium Kanban board component following GSD methodology. This is the foundation version without drag-and-drop, ready for future enhancement.

## Component Structure

```
KanbanBoard (root orchestrator)
├── KanbanColumn (one per pipeline stage)
│   └── KanbanCard (one per deal)
```

## Files

### Main Components
- `components/kanban/kanban-board.tsx` - Root board component
- `components/kanban/kanban-column.tsx` - Stage column component
- `components/kanban/kanban-card.tsx` - Deal card component

### Supporting Files
- `components/kanban/kanban-skeleton.tsx` - Loading state
- `components/kanban/empty-state.tsx` - Empty pipeline state
- `components/kanban/new-deal-dialog.tsx` - Create deal dialog

## KanbanBoard Component

### Location
`components/kanban/kanban-board.tsx`

### Responsibility
Orchestrate layout and composition of the Kanban view. NO business logic or data fetching inside this component.

### Props
```typescript
interface KanbanBoardProps {
  stages: KanbanStage[]  // Pre-grouped data from useKanban
}
```

### Implementation
```typescript
'use client'

export function KanbanBoard({ stages }: KanbanBoardProps) {
  if (!stages || stages.length === 0) {
    return null
  }

  return (
    <div className="flex gap-6 pb-6 overflow-x-auto">
      {stages.map((stage) => (
        <KanbanColumn key={stage.id} stage={stage} />
      ))}
    </div>
  )
}
```

### Features
- ✅ Horizontal scrolling for many stages
- ✅ Clean, minimal layout
- ✅ Premium spacing (gap-6)
- ✅ Maps stages in order (pre-sorted by useKanban)
- ✅ Client component for interactivity
- ✅ Ready for future drag-and-drop

### Does NOT
- ❌ Fetch data (consumes pre-fetched stages)
- ❌ Handle drag-and-drop (future enhancement)
- ❌ Manage state (stateless component)
- ❌ Call APIs directly

## KanbanColumn Component

### Location
`components/kanban/kanban-column.tsx`

### Responsibility
Render a single pipeline stage with its deals.

### Props
```typescript
interface KanbanColumnProps {
  stage: KanbanStage
}
```

### Features
- Fixed width: `w-80` (320px)
- Minimum height: `min-h-[600px]`
- Header with stage name, color indicator, deal count badge
- Scrollable deal list
- Empty state: "No deals"
- Border between header and content

### Styling
- Uses shadcn Card, CardHeader, CardContent
- Badge for deal count
- ScrollArea for deal overflow
- Color dot from `stage.color`

## KanbanCard Component

### Location
`components/kanban/kanban-card.tsx`

### Responsibility
Display a single deal.

### Props
```typescript
interface KanbanCardProps {
  deal: KanbanDeal
}
```

### Features
- Deal title (2 lines max, truncated)
- Value (formatted as currency if present)
- Contact name (with User icon if present)
- Hover effects
- Cursor pointer for future click handling

### Styling
- Premium hover state: shadow + border color
- Compact padding: `p-4`
- Vertical spacing: `space-y-2`
- Typography hierarchy

## Data Flow

```
useKanban hook
    ↓
Dashboard page (consumes hook)
    ↓
KanbanBoard (receives stages prop)
    ↓
KanbanColumn (receives stage prop)
    ↓
KanbanCard (receives deal prop)
```

## Layout Characteristics

### Desktop
- Horizontal scrollable container
- Fixed column width (320px)
- Columns side-by-side
- Premium gap spacing (24px)

### Mobile
- Same horizontal scroll
- Columns maintain 320px width
- Touch-friendly scrolling
- No responsive width changes (keeps consistency)

## State Management

### Current (v1)
- **Stateless components**
- No internal state
- All data from props
- No side effects

### Future (v2 - with drag-and-drop)
- Local state for drag operations
- Optimistic updates during drag
- Rollback on drop failure
- Drag overlay component

## Styling Approach

### Tailwind Classes
- All styling via Tailwind utility classes
- No inline styles (except stage color dot)
- No CSS modules
- No styled-components

### Design Tokens
- Uses shadcn/ui theme variables
- Consistent spacing scale
- Typography scale from config
- Color palette from theme

## Accessibility

### Current Implementation
- Semantic HTML structure
- Proper heading hierarchy (h3 for stage names, h4 for deal titles)
- aria-hidden on decorative elements (color dots)
- Sufficient color contrast
- Focus-visible states

### Future Enhancements
- Keyboard navigation for drag-and-drop
- Screen reader announcements for moves
- ARIA live regions for updates

## Performance

### Optimizations
- Component composition (not monolithic)
- Minimal re-renders (stateless)
- Key props for efficient reconciliation
- ScrollArea virtualization via shadcn

### Bundle Size
- Zero drag-and-drop dependencies (removed)
- Only essential UI components
- Tree-shakable imports

## Testing Checklist

- ✅ Board renders with multiple stages
- ✅ Board handles empty stages array
- ✅ Columns render in correct order
- ✅ Deals display within columns
- ✅ Empty column shows "No deals"
- ✅ Horizontal scroll works
- ✅ Deal cards show all fields correctly
- ✅ Currency formatting works
- ✅ Contact info displays when present
- ✅ TypeScript builds without errors
- ✅ No console errors in browser

## Future Enhancements (Not Implemented)

### Drag-and-Drop
Structure is ready for:
- `@dnd-kit` integration
- DndContext wrapper
- Droppable columns
- Sortable cards
- Drag overlay
- onDealMove callback

### Click Handling
- Card click to view deal details
- Column header click for actions
- Quick actions menu

### Filtering
- Column-level filters
- Deal search within stages
- Tag filtering

## Integration Points

### Consumes
- `useKanban` hook for data
- shadcn/ui components (Card, Badge, ScrollArea)
- `formatCurrency` utility
- Type definitions from `lib/types/kanban.ts`

### Used By
- `app/(dashboard)/dashboard/page.tsx` - Main dashboard view

## Notes
- This is the foundation version (v1)
- Built following GSD: no speculation, no premature optimization
- Clean separation: board = layout, hook = data
- Ready for enhancement without refactoring
