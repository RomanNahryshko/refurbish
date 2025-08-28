-- =====================================================
-- Migration: Remove Unused Repair Job Statuses
-- =====================================================
-- This migration removes 'failed' and 'cancelled' statuses from repair_status enum
-- These statuses exist in the schema but are NOT used in the application
-- =====================================================
-- Date: 2024
-- Reason: Code analysis shows that:
--   1. When technicians "cancel" a job, it goes back to 'pending' status
--   2. No code path sets jobs to 'failed' or 'cancelled' status
--   3. These statuses are confusing and not part of the actual workflow
-- =====================================================

-- Step 1: Check if there are any repair jobs using these statuses
DO $$
DECLARE
    failed_count INTEGER;
    cancelled_count INTEGER;
BEGIN
    -- Count repair jobs with 'failed' status
    SELECT COUNT(*) INTO failed_count
    FROM repair_jobs
    WHERE status = 'failed';
    
    -- Count repair jobs with 'cancelled' status
    SELECT COUNT(*) INTO cancelled_count
    FROM repair_jobs
    WHERE status = 'cancelled';
    
    -- Report findings
    IF failed_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % repair jobs with status = failed', failed_count;
        RAISE EXCEPTION 'Cannot remove failed status - jobs exist with this status';
    END IF;
    
    IF cancelled_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % repair jobs with status = cancelled', cancelled_count;
        RAISE EXCEPTION 'Cannot remove cancelled status - jobs exist with this status';
    END IF;
    
    RAISE NOTICE 'Safety check passed: No repair jobs found with failed or cancelled status';
END $$;

-- Step 2: Create a new enum type without the unused statuses
CREATE TYPE repair_status_new AS ENUM (
    'pending',      -- Created but not started
    'in_progress',  -- Currently being worked on
    'completed'     -- Successfully completed
);

-- Step 3: Add a temporary column with the new enum type
ALTER TABLE repair_jobs 
    ADD COLUMN status_new repair_status_new;

-- Step 4: Copy existing values to the new column
UPDATE repair_jobs 
    SET status_new = status::text::repair_status_new;

-- Step 5: Drop the old column and rename the new one
ALTER TABLE repair_jobs 
    DROP COLUMN status;

ALTER TABLE repair_jobs 
    RENAME COLUMN status_new TO status;

-- Step 6: Make the column NOT NULL with default value
ALTER TABLE repair_jobs 
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'pending';

-- Step 7: Drop the old enum type
DROP TYPE repair_status;

-- Step 8: Rename the new enum type to the original name
ALTER TYPE repair_status_new RENAME TO repair_status;

-- Step 9: Add a comment explaining the valid statuses
COMMENT ON TYPE repair_status IS 'Valid repair job statuses: pending (waiting to be claimed), in_progress (being worked on), completed (sent to QC)';

-- Step 10: Verify the changes
DO $$
DECLARE
    enum_values TEXT;
BEGIN
    -- Get the list of values in the enum
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'repair_status'::regtype;
    
    RAISE NOTICE 'Migration complete! New repair_status values: %', enum_values;
    
    -- Verify no data was lost
    IF NOT EXISTS (SELECT 1 FROM repair_jobs WHERE status IS NULL) THEN
        RAISE NOTICE 'All repair jobs have valid status values ✓';
    ELSE
        RAISE EXCEPTION 'ERROR: Some repair jobs have NULL status after migration';
    END IF;
END $$;

-- =====================================================
-- ROLLBACK SCRIPT (Save this separately if needed)
-- =====================================================
-- To rollback this migration, run:
/*
-- Create the old enum type
CREATE TYPE repair_status_old AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'cancelled'
);

-- Add temporary column
ALTER TABLE repair_jobs ADD COLUMN status_old repair_status_old;

-- Copy values
UPDATE repair_jobs SET status_old = status::text::repair_status_old;

-- Swap columns
ALTER TABLE repair_jobs DROP COLUMN status;
ALTER TABLE repair_jobs RENAME COLUMN status_old TO status;
ALTER TABLE repair_jobs 
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'pending';

-- Clean up
DROP TYPE repair_status;
ALTER TYPE repair_status_old RENAME TO repair_status;
*/

-- =====================================================
-- POST-MIGRATION TASKS
-- =====================================================
-- After running this migration, you should also:
-- 1. Update src/lib/constants.ts to remove 'failed' and 'cancelled' from REPAIR_STATUS
-- 2. Remove any UI references to these statuses (already checked - none exist)
-- 3. Update any documentation that mentions these statuses (already done)
-- =====================================================
