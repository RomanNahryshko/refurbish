# Supabase Setup Guide for Batch Operations

## 1. Environment Variables Setup

Create or update your `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Database Schema

Make sure your Supabase database has the required tables. Run the SQL from `schema.sql` in your Supabase SQL editor:

```sql
-- Run the schema.sql file in your Supabase SQL editor
-- This will create all necessary tables including:
-- - batches
-- - suppliers
-- - devices
-- - user_profiles
-- - permissions
```

## 4. Test the Connection

After setting up the environment variables, restart your development server:

```bash
pnpm dev
```

## 5. Verify Integration

The batch operations are now integrated with:

### API Routes
- `GET /api/batches` - Get all batches
- `POST /api/batches` - Create new batch
- `GET /api/batches/[id]` - Get single batch
- `PUT /api/batches/[id]` - Update batch
- `DELETE /api/batches/[id]` - Delete batch

### React Query Hooks
- `useBatches()` - Get all batches
- `useBatchesWithDeviceCounts()` - Get batches with device counts
- `useCreateBatch()` - Create new batch
- `useUpdateBatch()` - Update batch
- `useDeleteBatch()` - Delete batch

### Components Updated
- `src/app/batch-intake/page.tsx` - Now uses real Supabase data
- `src/app/batch-intake/create/page.tsx` - Now creates real batches
- `src/modules/batch-intake/components/batch-form.tsx` - Form for batch creation

## 6. Usage Examples

### Create a New Batch
```typescript
const createBatch = useCreateBatch()

createBatch.mutate({
  supplier_id: 'supplier-uuid',
  device_count: 50,
  received_date: '2024-01-15',
  invoice_number: 'INV-2024-001',
  invoice_amount: 5000.00,
  notes: 'New batch from supplier'
})
```

### Get All Batches
```typescript
const { data: batches, isLoading, error } = useBatchesWithDeviceCounts()
```

## 7. Troubleshooting

### Common Issues:

1. **"Supabase client not initialized"**
   - Check your environment variables are set correctly
   - Restart your development server

2. **"Unauthorized" errors**
   - Make sure you're logged in
   - Check user permissions in the database

3. **"Forbidden" errors**
   - User doesn't have required permissions
   - Check the permissions table in Supabase

4. **Database connection failed**
   - Verify your Supabase URL and keys
   - Check if your Supabase project is active

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test Supabase connection in the browser console:
   ```javascript
   // In browser console
   const supabase = window.supabase
   console.log('Supabase client:', supabase)
   ```

## 8. Next Steps

After setting up the environment variables:

1. **Test the batch creation form** at `/batch-intake/create`
2. **Verify batches appear** in the batch list at `/batch-intake`
3. **Check the database** in Supabase dashboard to see created batches
4. **Test permissions** by logging in with different user roles

The batch operations are now fully integrated with your Supabase database!

