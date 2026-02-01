# useKanban Hook Specification

## Overview
Production-grade React hook for fetching and managing Kanban board data using vanilla React patterns (useEffect + useState).

## Location
`hooks/use-kanban.ts`

## API Contract

### Input
```typescript
pipelineId?: string  // Optional pipeline ID. Defaults to tenant's default pipeline.
```

### Return Type
```typescript
interface UseKanbanReturn {
  stages: KanbanStage[]          // Normalized stages with nested deals
  isLoading: boolean             // True during initial fetch and refetch
  error: Error | null            // Error object if fetch fails, null otherwise
  refetch: () => void            // Trigger manual refetch
  optimisticUpdate: (            // Structure for future optimistic updates
    stageId: string,
    dealId: string,
    updates: Partial<KanbanDeal>
  ) => void
}
```

### Data Shape
```typescript
interface KanbanStage {
  id: string
  name: string
  color: string | null
  position: number
  is_won: boolean | null
  is_lost: boolean | null
  deals: KanbanDeal[]
}

interface KanbanDeal {
  id: string
  title: string
  value: number | null
  status: string
  contact_id: string | null
  assigned_to: string | null
  expected_close_date: string | null
  created_at: string | null
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
    type: string
  } | null
}
```

## Implementation Details

### Technology Stack
- **React Hooks**: useState, useEffect, useCallback
- **HTTP Client**: Native fetch API
- **TypeScript**: Strict typing, no `any`
- **No External Dependencies**: Vanilla React only

### Features

#### 1. Data Fetching
- Fetches from `/api/kanban` or `/api/kanban?pipeline_id={id}`
- Automatic sorting by stage position
- Validates API response structure
- Handles HTTP errors gracefully

#### 2. State Management
- `stages`: Array of pipeline stages with nested deals
- `isLoading`: Loading state (true during fetch)
- `error`: Error state (null on success, Error object on failure)

#### 3. Refetch Function
- Manual trigger via `refetch()`
- Uses internal trigger counter pattern
- Maintains same loading/error handling

#### 4. Optimistic Updates
- `optimisticUpdate()` function provided for future use
- Updates local state immediately
- Signature: `(stageId, dealId, updates) => void`
- Currently updates deal properties within a stage

### Error Handling

#### Network Errors
- Caught and converted to Error objects
- Stored in `error` state
- `stages` reset to empty array

#### API Errors
- HTTP status errors parsed from response
- Custom error messages from API preserved
- Fallback to generic error messages

#### Invalid Response
- Validates `data` array existence
- Throws descriptive error for malformed responses

### Usage Example

```typescript
import { useKanban } from '@/hooks/use-kanban'

function KanbanView() {
  const { stages, isLoading, error, refetch } = useKanban()

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorDisplay message={error.message} />

  return (
    <>
      <button onClick={refetch}>Refresh</button>
      {stages.map(stage => (
        <Column key={stage.id} stage={stage} />
      ))}
    </>
  )
}
```

## Performance Characteristics

### Initial Load
- Single fetch on mount
- Loading state set immediately
- Stages rendered after successful fetch

### Refetch Behavior
- Triggers new fetch
- Sets loading state during refetch
- Preserves error state if refetch fails
- Updates stages on success

### Memory Efficiency
- useCallback prevents unnecessary recreations
- Dependency arrays properly defined
- No memory leaks from unclosed subscriptions

## Testing Checklist

- ✅ TypeScript builds without errors
- ✅ Handles successful API responses
- ✅ Handles network errors
- ✅ Handles API errors (4xx, 5xx)
- ✅ Handles malformed responses
- ✅ Refetch function works correctly
- ✅ Loading states transition properly
- ✅ Stages sorted by position
- ✅ No `any` types in implementation
- ✅ Works without pipeline ID (uses default)
- ✅ Works with explicit pipeline ID

## Integration Points

### Used By
- `app/(dashboard)/dashboard/page.tsx` - Main Kanban dashboard

### Depends On
- `/api/kanban` - Backend API endpoint
- `lib/types/kanban.ts` - TypeScript type definitions

### Does NOT Depend On
- React Query
- Zustand
- Redux
- Any state management library

## Future Enhancements

### Optimistic Updates (Ready but Not Implemented)
The `optimisticUpdate` function provides a foundation for:
- Immediate UI feedback on drag & drop
- Rollback on API failure
- Pending state indicators

To implement:
1. Call `optimisticUpdate()` before API mutation
2. On success: refetch to sync with server
3. On failure: revert optimistic change

### Caching
Could add:
- Timestamp-based cache invalidation
- Cache in localStorage/sessionStorage
- Stale-while-revalidate pattern

### Real-time Updates
Could integrate:
- WebSocket subscriptions
- Server-Sent Events
- Polling mechanism

## Notes
- Middleware handles `x-tenant-id` header automatically
- No manual tenant isolation required in frontend
- Pipeline ID is optional (defaults to tenant's default pipeline)
- Stages are pre-sorted by position from API
