# Data Fetching Layer

This directory contains the API service layer and React Query hooks for data fetching and state management.

## Architecture

```
lib/
├── api/                 # API service layer
│   ├── phones.ts       # Phone-related API calls
│   ├── batches.ts      # Batch management API
│   ├── inventory.ts    # Inventory API
│   └── repairs.ts      # Repair jobs API
├── hooks/              # React Query hooks
│   ├── use-phones.ts   # Phone data hooks
│   ├── use-batches.ts  # Batch data hooks
│   └── use-inventory.ts # Inventory hooks
└── providers/          # React Query provider
    └── query-provider.tsx
```

## Benefits

1. **Automatic Caching** - Data is cached and reused across components
2. **Background Refetching** - Keep data fresh automatically
3. **Optimistic Updates** - Instant UI updates while mutations process
4. **Loading & Error States** - Built-in state management
5. **Request Deduplication** - Multiple components can request same data without duplicate API calls

## Usage Examples

### Fetching Data

```typescript
import { usePhones } from '@/lib/hooks/use-phones'

function PhoneList() {
  const { data: phones, isLoading, error } = usePhones({
    status: 'In Repair'
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return <PhoneGrid phones={phones} />
}
```

### Mutations with Optimistic Updates

```typescript
import { useUpdatePhoneStatus } from '@/lib/hooks/use-phones'

function PhoneCard({ phone }) {
  const updateStatus = useUpdatePhoneStatus()

  return (
    <Button
      onClick={() => updateStatus.mutate({
        id: phone.id,
        status: 'Graded'
      })}
      disabled={updateStatus.isPending}
    >
      Mark as Graded
    </Button>
  )
}
```

### Creating New Records

```typescript
import { useCreateBatch } from '@/lib/hooks/use-batches'

function CreateBatchForm() {
  const createBatch = useCreateBatch()
  
  const handleSubmit = (data) => {
    createBatch.mutate(data, {
      onSuccess: () => {
        // Redirect or show success message
      }
    })
  }
}
```

## Best Practices

1. **Use hooks in components** - Don't call API functions directly
2. **Leverage caching** - React Query caches by default for 1 minute
3. **Handle loading states** - Always show loading indicators
4. **Handle errors gracefully** - Display user-friendly error messages
5. **Use optimistic updates** - For better UX on mutations

## Adding New API Endpoints

1. Create API function in appropriate service file:
```typescript
// lib/api/repairs.ts
export const repairsApi = {
  async getAll() {
    const supabase = createClient()
    // ... implementation
  }
}
```

2. Create React Query hook:
```typescript
// lib/hooks/use-repairs.ts
export function useRepairs() {
  return useQuery({
    queryKey: ['repairs'],
    queryFn: repairsApi.getAll
  })
}
```

3. Use in component:
```typescript
const { data: repairs } = useRepairs()
```