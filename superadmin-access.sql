-- =====================================================
-- Grant Superadmin Access
-- =====================================================
-- Run this SQL in your Supabase SQL editor to grant admin access
-- Replace YOUR_USER_ID with the actual user ID from auth.users table
-- =====================================================

-- First, find your user ID (run this to see all users):
SELECT id, email, raw_app_meta_data, raw_user_meta_data 
FROM auth.users 
WHERE email LIKE '%@%';  -- Update with your email pattern if needed

-- Then, create or update the user profile with admin role
-- Replace 'YOUR_USER_ID' with the actual UUID from the query above
INSERT INTO user_profiles (id, full_name, role, status)
VALUES (
  'YOUR_USER_ID',  -- Replace with actual user ID
  'Super Admin',   -- Your name
  'admin',         -- Give admin role (highest in the enum)
  'active'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  status = 'active';

-- Verify the user now has admin role
SELECT u.email, up.full_name, up.role, up.status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email LIKE '%@%';  -- Update with your email pattern

-- =====================================================
-- Alternative: If you want to keep using the permission system
-- and just grant all permissions to a specific user
-- =====================================================

-- Grant all permissions to a specific user (optional)
-- This would override role-based permissions
DO $$
DECLARE
  user_id UUID := 'YOUR_USER_ID';  -- Replace with actual user ID
  perm RECORD;
BEGIN
  -- Grant all existing permissions to this user
  FOR perm IN SELECT id FROM permissions
  LOOP
    INSERT INTO user_permissions (user_id, permission_id, granted)
    VALUES (user_id, perm.id, true)
    ON CONFLICT (user_id, permission_id) 
    DO UPDATE SET granted = true;
  END LOOP;
END $$;
