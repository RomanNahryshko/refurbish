# Services

## Permission Service

Simple permission checking against the database.

### Usage Examples

#### In API Routes

```typescript
import { checkPermission } from '@/lib/services/permissions'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  if (!await checkPermission(user.id, 'devices', 'create')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // User has permission, proceed with the operation
  // ...
}
```

#### In Server Components

```typescript
import { checkPermission } from '@/lib/services/permissions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const canViewUsers = await checkPermission(user.id, 'user_profiles', 'read')
  
  if (!canViewUsers) {
    redirect('/dashboard')
  }
  
  // User has permission, render the page
  return <div>Admin content here</div>
}
```

#### Getting All User Permissions (for caching)

```typescript
import { getUserPermissions } from '@/lib/services/permissions'

// At login or session start
const permissions = await getUserPermissions(userId)
// Returns: ['devices:read', 'devices:create', 'batches:read', ...]

// Store in session/context for quick access
```

### Available Functions

- `checkPermission(userId, tableName, action)` - Check single permission
- `getUserPermissions(userId)` - Get all permissions for a user
- `hasAnyPermission(userId, ['devices:read', 'batches:read'])` - Check if user has ANY of the permissions
- `hasAllPermissions(userId, ['devices:read', 'devices:create'])` - Check if user has ALL permissions

### Performance Notes

For MVP with <50 users, direct DB queries are fine. If performance becomes an issue:
1. Cache permissions in session at login
2. Use Redis/memory cache
3. But don't optimize prematurely!