-- =====================================================
-- Mobile Phone Refurbishment & Inventory Management System
-- Complete Database Schema - MVP Version
-- =====================================================
-- Author: System Architect
-- Date: 2024
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- CLEANUP (for development - remove in production)
-- =====================================================
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS AND CUSTOM TYPES
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'admin',           -- System administrator (full access)
  'general_manager', -- General Manager role
  'ops_manager',     -- Operations Manager
  'qc_controller',   -- Quality Control staff
  'technician'       -- Repair technicians (L1, L2, L3)
);

-- Technician levels
CREATE TYPE technician_level AS ENUM (
  'L1',  -- Housing repairs only
  'L2',  -- Glass repairs only
  'L3'   -- Battery and other repairs
);

-- Device status workflow
CREATE TYPE device_status AS ENUM (
  'received',        -- Just received in batch
  'initial_qc',      -- In initial quality control
  'awaiting_repair', -- QC complete, waiting for repair
  'in_repair',       -- Currently being repaired
  'final_qc',        -- In final quality control
  'graded',          -- QC complete and graded
  'ready_to_ship',   -- Ready for shipping
  'shipped'          -- Shipped out
);

-- Device grades
CREATE TYPE device_grade AS ENUM (
  'ungraded',  -- Not yet graded
  'A',         -- Best condition
  'B',         -- Good condition
  'C'          -- Acceptable condition
);

-- Repair task types
CREATE TYPE repair_type AS ENUM (
  'housing_change',   -- L1 technician only
  'glass_change',     -- L2 technician only
  'battery_change',   -- L3 technician only
  'software_update',  -- Any technician
  'other'            -- Other repairs with description
);

-- Repair job status
CREATE TYPE repair_status AS ENUM (
  'pending',      -- Created but not started
  'in_progress',  -- Currently being worked on
  'completed',    -- Successfully completed
  'failed',       -- Could not complete
  'cancelled'     -- Cancelled by manager
);

-- QC test status
CREATE TYPE test_result AS ENUM (
  'pass',
  'fail',
  'not_tested'
);

-- User account status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- =====================================================
-- 1. USER MANAGEMENT
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  technician_level technician_level, -- Only for technicians
  status user_status NOT NULL DEFAULT 'active',
  must_change_password BOOLEAN DEFAULT false,
  phone_number TEXT,
  employee_id TEXT UNIQUE, -- Optional employee ID for reporting
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- Constraints
  CONSTRAINT technician_level_check CHECK (
    (role = 'technician' AND technician_level IS NOT NULL) OR
    (role != 'technician' AND technician_level IS NULL)
  )
);

-- User activity audit log - REMOVED (not in MVP scope)
-- Will be added in future phase if needed

-- =====================================================
-- 2. SUPPLIERS
-- =====================================================

-- Suppliers for both devices and spare parts
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  supplier_type TEXT CHECK (supplier_type IN ('devices', 'parts', 'both')),
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- =====================================================
-- 3. BATCH MANAGEMENT
-- =====================================================

-- Batches of devices received
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT UNIQUE NOT NULL, -- Human-readable batch ID
  supplier_id UUID REFERENCES suppliers(id),
  
  -- Invoice details
  invoice_number TEXT,
  invoice_date DATE,
  invoice_amount DECIMAL(10,2),
  
  -- Batch details
  device_count INTEGER NOT NULL DEFAULT 0,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- =====================================================
-- 4. DEVICE MANAGEMENT
-- =====================================================

-- Main devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id TEXT UNIQUE NOT NULL, -- 8-digit auto-generated
  batch_id UUID REFERENCES batches(id),
  
  -- Device identifiers
  imei TEXT UNIQUE NOT NULL,
  serial_number TEXT,
  
  -- Device details
  brand TEXT,
  model TEXT,
  color TEXT,
  storage_capacity TEXT, -- e.g., "128GB"
  
  -- Status tracking
  status device_status NOT NULL DEFAULT 'received',
  grade device_grade DEFAULT 'ungraded',
  
  -- Dr. Phone import data
  dr_phone_data JSONB, -- Store raw Dr. Phone results
  dr_phone_imported_at TIMESTAMPTZ,
  
  -- Additional info
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Device status history tracking
CREATE TABLE device_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id),
  old_status device_status,
  new_status device_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. QUALITY CONTROL
-- =====================================================

-- QC checks (both initial and final)
CREATE TABLE qc_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id),
  check_type TEXT NOT NULL CHECK (check_type IN ('initial', 'final')),
  
  -- Overall results
  overall_result test_result NOT NULL DEFAULT 'not_tested',
  grade_assigned device_grade,
  
  -- Who performed the check
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes and observations
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual QC test results
CREATE TABLE qc_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qc_check_id UUID NOT NULL REFERENCES qc_checks(id) ON DELETE CASCADE,
  
  test_name TEXT NOT NULL, -- e.g., 'camera', 'screen', 'battery', 'speaker'
  test_result test_result NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. REPAIR MANAGEMENT
-- =====================================================

-- Repair jobs/tasks
CREATE TABLE repair_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id),
  
  -- Repair details
  repair_type repair_type NOT NULL,
  description TEXT, -- Required for 'other' type, optional for others
  status repair_status NOT NULL DEFAULT 'pending',
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- Constraints
  CONSTRAINT other_repair_description CHECK (
    (repair_type = 'other' AND description IS NOT NULL) OR
    (repair_type != 'other')
  )
);

-- =====================================================
-- 7. INVENTORY MANAGEMENT
-- =====================================================

-- Spare parts catalog
CREATE TABLE spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL, -- Stock keeping unit
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'battery', 'screen', 'housing'
  
  -- Compatibility (simple approach for MVP)
  compatible_models TEXT[], -- Array of model names
  
  -- Stock levels
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  
  -- Supplier info
  primary_supplier_id UUID REFERENCES suppliers(id),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Parts used in repairs
CREATE TABLE repair_parts_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_job_id UUID NOT NULL REFERENCES repair_jobs(id),
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id),
  quantity_used INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  
  -- Who recorded this usage
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock adjustments (for adding stock, corrections, etc.)
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add', 'remove', 'correction')),
  quantity INTEGER NOT NULL, -- Positive for additions, negative for removals
  reason TEXT,
  reference_number TEXT, -- Invoice number, PO number, etc.
  
  -- Metadata
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. PERMISSIONS MANAGEMENT (For UI/Management Only)
-- =====================================================
-- NOTE: These tables are for managing and displaying permissions in the UI.
-- Actual permission enforcement happens at the application/API level.

-- Available permissions for each table/action combination
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL, -- Actual database table name
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  description TEXT, -- Human-readable description
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_table_action UNIQUE (table_name, action)
);

-- Role permissions (which roles have which permissions)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_role_permission UNIQUE (role, permission_id)
);

-- User-specific permissions (override/extend role permissions)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true, -- true = grant, false = revoke
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_user_permission UNIQUE (user_id, permission_id)
);

-- =====================================================
-- 9. REPORTING TABLES
-- =====================================================

-- Daily production snapshots for KPI tracking
CREATE TABLE production_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  
  -- Device metrics
  devices_received INTEGER DEFAULT 0,
  devices_in_repair INTEGER DEFAULT 0,
  devices_completed INTEGER DEFAULT 0,
  devices_shipped INTEGER DEFAULT 0,
  
  -- Repair metrics by type
  housing_changes INTEGER DEFAULT 0,
  glass_changes INTEGER DEFAULT 0,
  battery_changes INTEGER DEFAULT 0,
  software_updates INTEGER DEFAULT 0,
  other_repairs INTEGER DEFAULT 0,
  
  -- Grade distribution
  grade_a_count INTEGER DEFAULT 0,
  grade_b_count INTEGER DEFAULT 0,
  grade_c_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_metric_date UNIQUE (metric_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_profiles_technician_level ON user_profiles(technician_level) WHERE deleted_at IS NULL;
-- Audit indexes removed (not in MVP scope)

-- Batch indexes
CREATE INDEX idx_batches_supplier ON batches(supplier_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_batches_received_date ON batches(received_date) WHERE deleted_at IS NULL;

-- Device indexes
CREATE INDEX idx_devices_batch ON devices(batch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_devices_status ON devices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_devices_grade ON devices(grade) WHERE deleted_at IS NULL;
CREATE INDEX idx_devices_imei ON devices(imei) WHERE deleted_at IS NULL;
CREATE INDEX idx_devices_internal_id ON devices(internal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_device_status_history_device ON device_status_history(device_id);

-- QC indexes
CREATE INDEX idx_qc_checks_device ON qc_checks(device_id);
CREATE INDEX idx_qc_checks_performed_by ON qc_checks(performed_by);
CREATE INDEX idx_qc_test_results_check ON qc_test_results(qc_check_id);

-- Repair indexes
CREATE INDEX idx_repair_jobs_device ON repair_jobs(device_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_repair_jobs_assigned_to ON repair_jobs(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_repair_jobs_status ON repair_jobs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_repair_parts_used_job ON repair_parts_used(repair_job_id);
CREATE INDEX idx_repair_parts_used_part ON repair_parts_used(spare_part_id);

-- Inventory indexes
CREATE INDEX idx_spare_parts_category ON spare_parts(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_spare_parts_sku ON spare_parts(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_adjustments_part ON stock_adjustments(spare_part_id);

-- Production metrics indexes
CREATE INDEX idx_production_metrics_date ON production_metrics(metric_date);

-- Permissions indexes
CREATE INDEX idx_permissions_table_action ON permissions(table_name, action);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qc_checks_updated_at BEFORE UPDATE ON qc_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_jobs_updated_at BEFORE UPDATE ON repair_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON spare_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate 8-digit internal ID
CREATE OR REPLACE FUNCTION generate_internal_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate next sequential ID
    SELECT LPAD((COALESCE(MAX(CAST(internal_id AS INTEGER)), 0) + 1)::TEXT, 8, '0')
    INTO new_id
    FROM devices
    WHERE internal_id ~ '^\d{8}$';
    
    -- Check if it exists (in case of race condition)
    SELECT EXISTS(SELECT 1 FROM devices WHERE internal_id = new_id) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate internal_id
CREATE OR REPLACE FUNCTION set_internal_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.internal_id IS NULL THEN
    NEW.internal_id := generate_internal_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_device_internal_id BEFORE INSERT ON devices
  FOR EACH ROW EXECUTE FUNCTION set_internal_id();

-- Function to track device status changes
CREATE OR REPLACE FUNCTION track_device_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO device_status_history (device_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_device_status AFTER UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION track_device_status_change();

-- Function to update stock levels when parts are used
CREATE OR REPLACE FUNCTION update_stock_on_parts_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spare_parts
  SET quantity_in_stock = quantity_in_stock - NEW.quantity_used
  WHERE id = NEW.spare_part_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_levels AFTER INSERT ON repair_parts_used
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_parts_usage();

-- Function to apply stock adjustments
CREATE OR REPLACE FUNCTION apply_stock_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spare_parts
  SET quantity_in_stock = quantity_in_stock + NEW.quantity
  WHERE id = NEW.spare_part_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apply_stock_adjustment_trigger AFTER INSERT ON stock_adjustments
  FOR EACH ROW EXECUTE FUNCTION apply_stock_adjustment();

-- Function to generate batch number
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TEXT AS $$
DECLARE
  new_batch_number TEXT;
BEGIN
  -- Format: BATCH-YYYYMMDD-XXX
  SELECT 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD((COALESCE(COUNT(*), 0))::TEXT, 3, '0')
  INTO new_batch_number
  FROM batches
  WHERE DATE(created_at) = CURRENT_DATE;
  
  RETURN new_batch_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate batch_number
CREATE OR REPLACE FUNCTION set_batch_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_number IS NULL THEN
    NEW.batch_number := generate_batch_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_batch_number_trigger BEFORE INSERT ON batches
  FOR EACH ROW EXECUTE FUNCTION set_batch_number();

-- =====================================================
-- NOTE: Row Level Security (RLS) and Permission Checks
-- =====================================================
-- All permission checks are handled at the application level.
-- The permissions tables below are for management and UI display only.
-- RLS is NOT enabled on tables - security is enforced in the API layer.

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Device overview with current repair status
CREATE OR REPLACE VIEW device_overview AS
SELECT 
  d.id,
  d.internal_id,
  d.imei,
  d.brand,
  d.model,
  d.status,
  d.grade,
  b.batch_number,
  COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'pending') as pending_repairs,
  COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'in_progress') as active_repairs,
  COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'completed') as completed_repairs
FROM devices d
LEFT JOIN batches b ON d.batch_id = b.id
LEFT JOIN repair_jobs rj ON d.id = rj.device_id AND rj.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.internal_id, d.imei, d.brand, d.model, d.status, d.grade, b.batch_number;

-- Technician workload view
CREATE OR REPLACE VIEW technician_workload AS
SELECT 
  u.id,
  u.full_name,
  u.technician_level,
  COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'pending') as pending_jobs,
  COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'in_progress') as active_jobs,
  COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'completed' AND DATE(rj.completed_at) = CURRENT_DATE) as completed_today,
  COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'completed') as total_completed
FROM user_profiles u
LEFT JOIN repair_jobs rj ON u.id = rj.assigned_to AND rj.deleted_at IS NULL
WHERE u.role = 'technician' AND u.deleted_at IS NULL
GROUP BY u.id, u.full_name, u.technician_level;

-- Inventory status view
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
  sp.id,
  sp.sku,
  sp.name,
  sp.category,
  sp.quantity_in_stock,
  sp.minimum_stock_level,
  CASE 
    WHEN sp.quantity_in_stock <= sp.minimum_stock_level THEN 'low'
    WHEN sp.quantity_in_stock <= sp.minimum_stock_level * 2 THEN 'medium'
    ELSE 'good'
  END as stock_status,
  s.name as supplier_name
FROM spare_parts sp
LEFT JOIN suppliers s ON sp.primary_supplier_id = s.id
WHERE sp.deleted_at IS NULL;


-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default admin user profile (assuming auth.users entry exists)
-- This should be run after creating the first user through Supabase Auth
/*
INSERT INTO user_profiles (id, full_name, role, status)
VALUES (
  'YOUR-ADMIN-USER-UUID-HERE',
  'System Administrator',
  'admin',
  'active'
) ON CONFLICT (id) DO NOTHING;
*/

-- NOTE: Permission seeding has been moved to permissions-init.sql
-- Run that file separately to set up initial permissions and role mappings

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE devices IS 'Main table for tracking mobile devices through the refurbishment process';
COMMENT ON TABLE repair_jobs IS 'Tracks individual repair tasks for devices';
COMMENT ON TABLE spare_parts IS 'Inventory of spare parts used in repairs';
COMMENT ON TABLE qc_checks IS 'Quality control checks performed on devices';
COMMENT ON TABLE batches IS 'Batches of devices received from suppliers';
COMMENT ON TABLE permissions IS 'UI/Management only: Defines possible permissions (enforced at API level)';
COMMENT ON TABLE role_permissions IS 'UI/Management only: Maps permissions to roles (enforced at API level)';
COMMENT ON TABLE user_permissions IS 'UI/Management only: User-specific permission overrides (enforced at API level)';
COMMENT ON COLUMN devices.internal_id IS 'Auto-generated 8-digit identifier for physical labels';
COMMENT ON COLUMN devices.dr_phone_data IS 'Raw JSON data imported from Dr. Phone software';
COMMENT ON COLUMN repair_jobs.repair_type IS 'Type of repair: housing (L1), glass (L2), battery (L3), software, or other';
COMMENT ON COLUMN user_profiles.technician_level IS 'Technician skill level: L1 (housing), L2 (glass), L3 (battery/other)';
COMMENT ON COLUMN permissions.table_name IS 'Actual database table name for permission reference';
COMMENT ON COLUMN permissions.action IS 'CRUD action: create, read, update, or delete';
COMMENT ON COLUMN user_permissions.granted IS 'true = grant permission, false = revoke permission (checked at API level)';

-- =====================================================
-- END OF SCHEMA
-- =====================================================