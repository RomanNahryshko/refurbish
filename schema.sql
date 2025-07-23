-- Mobile Phone Refurbishment & Inventory Management System
-- Minimum Viable Database Schema
-- This is a first version and will be updated with a full DB design

-- Custom Types for core statuses and roles
CREATE TYPE phone_status AS ENUM ('Received', 'In QC', 'Awaiting Repair', 'In Repair', 'Final QC', 'Graded', 'Shipped');
CREATE TYPE user_role AS ENUM ('data_entry', 'qc_controller', 'technician', 'ops_manager');

-- Core Tables - A simple starting point for our main entities.

-- To group incoming phones
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    supplier TEXT
);

-- The central table for the entire application
CREATE TABLE phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imei TEXT NOT NULL UNIQUE,
    model TEXT,
    status phone_status DEFAULT 'Received',
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL
);

-- For managing spare parts inventory
CREATE TABLE spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 0
);

-- For managing user roles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role NOT NULL
); 