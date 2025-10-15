-- =====================================================
-- Permission Initialization and Updates
-- =====================================================
-- This file can be run multiple times safely (idempotent)
-- Update this file when permission requirements change
-- =====================================================

-- =====================================================
-- 1. DEFINE ALL PERMISSIONS
-- =====================================================
-- Using ON CONFLICT DO UPDATE to allow re-running this file

-- User management permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('user_profiles', 'create', 'Create new users'),
  ('user_profiles', 'read', 'View user profiles'),
  ('user_profiles', 'update', 'Update user profiles'),
  ('user_profiles', 'delete', 'Delete users'),
  -- ('user_audit', 'read', 'View user audit logs') -- Removed: not in MVP scope
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Supplier permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('suppliers', 'create', 'Create new suppliers'),
  ('suppliers', 'read', 'View suppliers'),
  ('suppliers', 'update', 'Update supplier details'),
  ('suppliers', 'delete', 'Delete suppliers')
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Batch permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('batches', 'create', 'Create new batches'),
  ('batches', 'read', 'View batches'),
  ('batches', 'update', 'Update batch details'),
  ('batches', 'delete', 'Delete batches')
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Device permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('devices', 'create', 'Add new devices'),
  ('devices', 'read', 'View devices'),
  ('devices', 'update', 'Update device details'),
  ('devices', 'delete', 'Delete devices'),
  ('device_status_history', 'read', 'View device status history')
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Quality Control permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('qc_checks', 'create', 'Create QC checks'),
  ('qc_checks', 'read', 'View QC checks'),
  ('qc_checks', 'update', 'Update QC checks'),
  ('qc_checks', 'delete', 'Delete QC checks'),
  ('qc_test_results', 'create', 'Add QC test results'),
  ('qc_test_results', 'read', 'View QC test results'),
  ('qc_test_results', 'update', 'Update QC test results'),
  ('qc_test_results', 'delete', 'Delete QC test results')
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Repair permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('repair_jobs', 'create', 'Create repair jobs'),
  ('repair_jobs', 'read', 'View repair jobs'),
  ('repair_jobs', 'update', 'Update repair jobs'),
  ('repair_jobs', 'delete', 'Delete repair jobs'),
  ('repair_parts_used', 'create', 'Record parts usage'),
  ('repair_parts_used', 'read', 'View parts usage'),
  ('repair_parts_used', 'update', 'Update parts usage'),
  ('repair_parts_used', 'delete', 'Delete parts usage records')
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Inventory permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('spare_parts', 'create', 'Add new spare parts'),
  ('spare_parts', 'read', 'View spare parts'),
  ('spare_parts', 'update', 'Update spare parts'),
  ('spare_parts', 'delete', 'Delete spare parts'),
  ('stock_adjustments', 'create', 'Create stock adjustments'),
  ('stock_adjustments', 'read', 'View stock adjustments')
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Reporting permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('production_metrics', 'read', 'View production metrics'),
  ('production_metrics', 'create', 'Create production metrics'),
  ('production_metrics', 'update', 'Update production metrics')
ON CONFLICT (table_name, action) 
DO UPDATE SET description = EXCLUDED.description;

-- Dashboard permissions
INSERT INTO permissions (table_name, action, description) VALUES
  ('dashboard', 'read', 'View dashboard')
ON CONFLICT (table_name, action) DO UPDATE SET 
  description = EXCLUDED.description;

-- =====================================================
-- 2. CLEAR EXISTING ROLE PERMISSIONS
-- =====================================================
-- Clear all role permissions before re-inserting to ensure clean state
DELETE FROM role_permissions;

-- =====================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Admin: Full access to everything
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- General Manager: Full read access plus selective write
INSERT INTO role_permissions (role, permission_id)
SELECT 'general_manager', id FROM permissions 
WHERE action = 'read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Additional General Manager permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'general_manager', id FROM permissions 
WHERE table_name IN ('batches', 'devices', 'suppliers', 'spare_parts', 'production_metrics')
  AND action IN ('create', 'update')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Operations Manager: Operational permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'ops_manager', id FROM permissions 
WHERE table_name IN ('batches', 'devices', 'device_status_history', 'repair_jobs', 
                     'suppliers', 'spare_parts', 'stock_adjustments', 'dashboard', 'production_metrics')
  AND action IN ('read', 'create', 'update')
ON CONFLICT (role, permission_id) DO NOTHING;

-- QC Controller: Quality control permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'qc_controller', id FROM permissions 
WHERE table_name IN ('devices', 'qc_checks', 'qc_test_results', 'repair_jobs')
  AND action = 'read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Additional QC Controller permissions for creating/updating QC data
INSERT INTO role_permissions (role, permission_id)
SELECT 'qc_controller', id FROM permissions 
WHERE table_name IN ('qc_checks', 'qc_test_results', 'devices')
  AND action IN ('create', 'update')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Technician: Repair-focused permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'technician', id FROM permissions 
WHERE table_name IN ('devices', 'repair_jobs', 'spare_parts')
  AND action = 'read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Technician: Can update repair jobs
INSERT INTO role_permissions (role, permission_id)
SELECT 'technician', id FROM permissions 
WHERE table_name = 'repair_jobs' AND action = 'update'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Technician: Can record parts usage
INSERT INTO role_permissions (role, permission_id)
SELECT 'technician', id FROM permissions 
WHERE table_name = 'repair_parts_used' AND action IN ('create', 'read')
ON CONFLICT (role, permission_id) DO NOTHING;

-- =====================================================
-- 4. SUMMARY
-- =====================================================
-- After running this file, the following permissions are set:
-- 
-- Admin: Full CRUD on all tables
-- General Manager: Read all, write to operational tables
-- Operations Manager: Manage batches, devices, repairs, inventory
-- QC Controller: Perform quality checks and grading
-- Technician: View devices/repairs, update repairs, record parts
--
-- To modify permissions:
-- 1. Update the relevant INSERT statements above
-- 2. Re-run this entire file
-- 3. Changes will be applied immediately
-- =====================================================