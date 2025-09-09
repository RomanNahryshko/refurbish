# Data Fetching Layer

This directory contains the API service layer and React Query hooks for data fetching and state management.

## Architecture

```
lib/
├── api/                 # API service layer
│   ├── users.ts        # User management API calls
│   ├── phones.ts       # Phone-related API calls
│   ├── batches.ts      # Batch management API
│   └── inventory.ts    # Inventory API
├── hooks/              # React Query hooks
│   ├── use-users.ts    # User data hooks
│   ├── use-phones.ts   # Phone data hooks
│   ├── use-toast.ts    # Toast notification hook
│   └── use-confirmation.ts # Confirmation dialog hook
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
import { useCreateUser } from '@/lib/hooks/use-users'

function CreateUserForm() {
  const createUser = useCreateUser()
  
  const handleSubmit = (data) => {
    createUser.mutate(data, {
      onSuccess: () => {
        // Redirect or show success message
      }
    })
  }
}
```

### Note on Missing Hooks

The following API services exist but don't have React Query hooks yet:
- `batches.ts` - needs `use-batches.ts` hook
- `inventory.ts` - needs `use-inventory.ts` hook

These will be created as needed when implementing their respective UI modules.

## Best Practices

1. **Use hooks in components** - Don't call API functions directly
2. **Leverage caching** - React Query caches by default for 1 minute
3. **Handle loading states** - Always show loading indicators
4. **Handle errors gracefully** - Display user-friendly error messages
5. **Use optimistic updates** - For better UX on mutations

## Adding New API Endpoints

1. Create API function in appropriate service file (or add to existing):
```typescript
// lib/api/batches.ts (example of existing file)
export const batchesApi = {
  async getAll() {
    const supabase = createClient()
    // ... implementation
  },
  async create(data: BatchInput) {
    const supabase = createClient()
    // ... implementation
  }
}
```

2. Create React Query hook:
```typescript
// lib/hooks/use-batches.ts (to be created)
export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: batchesApi.getAll
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: batchesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    }
  })
}
```

3. Use in component:
```typescript
const { data: batches } = useBatches()
const createBatch = useCreateBatch()
```