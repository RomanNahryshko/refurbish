# API Optimization: Singleton Supabase Client Pattern

## Problem

Before optimization, each API route created a **new Supabase client** for every HTTP request:

```typescript
// ❌ BAD: New client created for each request
const supabase = await createSupabaseServerClient()
```

This happened in **every** API endpoint, which led to:
- Excessive connection creation
- Load on Supabase
- Inefficient resource usage

## Solution

### 1. Singleton Supabase Client

```typescript
// src/lib/supabase/server.ts
let supabaseClientInstance: SupabaseClient | null = null

export async function createSupabaseServerClient() {
  // Return existing instance if already created
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }
  
  // Create new only once
  supabaseClientInstance = createServerClient(/* ... */)
  return supabaseClientInstance
}
```

### 2. Centralized API Factory

```typescript
// src/lib/api/api-factory.ts
class APIFactory {
  private supabase: SupabaseClient | null = null

  private async getSupabaseClient(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createSupabaseServerClient()
    }
    return this.supabase
  }

  async getInventoryAPI() {
    const client = await this.getSupabaseClient()
    return createInventoryAPI(client)
  }
}

export const apiFactory = new APIFactory()
```

### 3. Dependency Injection in API Routes

```typescript
// ❌ BEFORE: Creating new client
const supabase = await createSupabaseServerClient()
const inventoryApi = createInventoryAPI(supabase)

// ✅ AFTER: Using factory
const inventoryApi = await apiFactory.getInventoryAPI()
```

## Benefits

1. **One client per server** - Supabase client is created only once
2. **Connection reuse** - all API calls use one instance
3. **Better performance** - less load on Supabase
4. **Centralized management** - all APIs through one factory
5. **Easier to test** - can mock factory instead of individual clients

## Migration

### Step 1: Update API Route

```typescript
// Was
import { createSupabaseServerClient } from '@/lib/supabase/server'
const supabase = await createSupabaseServerClient()

// Became
import { apiFactory } from '@/lib/api/api-factory'
const inventoryApi = await apiFactory.getInventoryAPI()
```

### Step 2: Add API to Factory

```typescript
// src/lib/api/api-factory.ts
async getBatchesAPI() {
  const client = await this.getSupabaseClient()
  return createBatchesAPI(client)
}
```
