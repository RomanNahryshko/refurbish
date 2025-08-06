---
sidebar_position: 3
title: React Query Code Examples
---

# React Query Code Examples

Reference patterns for using React Query hooks in the application.

## Basic Data Fetching

```typescript
// Fetch data with automatic caching and refetching
const { data: phones, isLoading, error, refetch } = usePhones({ 
  status: 'In Repair' 
})

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />

return <PhoneGrid phones={phones} />
```

## Mutations with Optimistic Updates

```typescript
// Update phone status with optimistic UI update
const updateStatus = useUpdatePhoneStatus()

const handleStatusChange = (phoneId: string, newStatus: string) => {
  updateStatus.mutate(
    { id: phoneId, status: newStatus },
    {
      onSuccess: () => {
        toast.success('Status updated successfully')
      },
      onError: (error) => {
        toast.error(`Failed to update: ${error.message}`)
      }
    }
  )
}
```

## User Management Pattern

```typescript
// Complete CRUD operations example
export function UserManagement() {
  const [filters, setFilters] = useState({ role: '' })
  
  // Read - with filters
  const { data: users, isLoading } = useUsers(filters)
  
  // Create
  const createUser = useCreateUser()
  
  // Update
  const updateStatus = useUpdateUserStatus()
  
  // Delete
  const deleteUser = useDeleteUser()

  const handleCreate = async (userData: UserInput) => {
    await createUser.mutateAsync(userData)
    // Automatically refetches users list
  }

  return (
    <div>
      {users?.map(user => (
        <UserCard 
          key={user.id} 
          user={user}
          onStatusChange={(status) => 
            updateStatus.mutate({ id: user.id, status })
          }
          onDelete={() => deleteUser.mutate(user.id)}
        />
      ))}
    </div>
  )
}
```

## Error Handling Pattern

```typescript
const { data, error, refetch } = useQuery({
  queryKey: ['resource'],
  queryFn: fetchResource,
  retry: 2,
  retryDelay: 1000
})

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button onClick={() => refetch()} size="sm">
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

## Pagination Pattern

```typescript
const [page, setPage] = useState(1)
const { data, isFetching } = useQuery({
  queryKey: ['items', page],
  queryFn: () => fetchItems({ page, limit: 20 }),
  keepPreviousData: true // Smooth pagination
})

return (
  <>
    <ItemList items={data?.items} />
    <Pagination
      currentPage={page}
      totalPages={data?.totalPages}
      onPageChange={setPage}
      disabled={isFetching}
    />
  </>
)
```

## Dependent Queries

```typescript
// Second query depends on first query's result
const { data: user } = useUser()
const { data: permissions } = usePermissions(
  user?.id,
  { enabled: !!user } // Only run when user is available
)
```

## Infinite Scroll Pattern

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['items'],
  queryFn: ({ pageParam = 0 }) => fetchItems({ offset: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextOffset
})

// In component
<InfiniteScroll
  loadMore={fetchNextPage}
  hasMore={hasNextPage}
  loading={isFetchingNextPage}
>
  {data?.pages.map(page => 
    page.items.map(item => <Item key={item.id} {...item} />)
  )}
</InfiniteScroll>
```

## Best Practices

1. **Always handle loading and error states**
2. **Use optimistic updates for better UX**
3. **Leverage query invalidation for data sync**
4. **Use `mutateAsync` when you need to await the result**
5. **Set `staleTime` and `cacheTime` based on data freshness needs**
6. **Use `enabled` option for conditional queries**
7. **Implement proper error boundaries**