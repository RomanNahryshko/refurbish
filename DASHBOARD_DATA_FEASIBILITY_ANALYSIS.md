# Dashboard Data Feasibility Analysis

## Executive Summary
**Current State**: The dashboard is using **100% mock data** with no actual database connections. While the database schema has the necessary tables, there are **NO API endpoints** implemented for dashboard metrics.

## Date Range Support Analysis

### Current Implementation
- **UI**: Only single date selection
- **Database**: Mixed support (see detailed analysis below)

### Critical Finding: Two Data Sources Available

#### 1. **Production Metrics Table** (Pre-aggregated Daily Snapshots)
- ✅ **Perfect for date ranges** - Already aggregated by day
- ✅ Can SUM() across date ranges easily
- ❌ **BUT**: Requires daily population job (not implemented)
- ❌ No historical data until job runs

#### 2. **Live Tables** (Real-time Data)
- ✅ All tables have timestamps (`created_at`, `completed_at`, etc.)
- ✅ Can query any date range using WHERE clauses
- ⚠️ Performance consideration for large date ranges
- ✅ Always accurate and up-to-date

## Section-by-Section Analysis

### 1. Batch Intake Stats
**Data Required**:
- Batches created (count)
- Expected devices count
- Imported devices count

**Database Support**: ✅ **PARTIAL**
- ✅ `batches` table has batch creation data
- ✅ `batches.device_count` for expected devices
- ❌ No clear "imported" vs "expected" distinction // !CHECK

**Date Range Support**: ✅ **YES**
- Single date: `WHERE DATE(batches.created_at) = '2024-01-15'`
- Date range: `WHERE batches.created_at BETWEEN '2024-01-01' AND '2024-01-31'`
- Can COUNT batches and SUM device_count across any period

### 2. Initial QC Stats
**Data Required**:
- Assigned repairs by type (Housing, Glass, Battery, Software, Other)
- Assigned grades (A, B, C)

**Database Support**: ✅ **YES**
- ✅ `qc_checks` table with `check_type='initial'`
- ✅ `qc_checks.grade_assigned` for grades
- ✅ `repair_jobs` table with `repair_type` enum

**Date Range Support**: ✅ **YES**
- Uses `qc_checks.performed_at` timestamp
- Single date: `WHERE DATE(performed_at) = '2024-01-15'`
- Date range: `WHERE performed_at BETWEEN '2024-01-01' AND '2024-01-31'`

### 3. Final QC Stats
**Data Required**:
- Awaiting QC count
- Failed QC count
- Assigned grades

**Database Support**: ✅ **YES**
- ✅ `devices.status='final_qc'` for awaiting
- ✅ `qc_checks` with `check_type='final'` and `overall_result='fail'`
- ✅ `qc_checks.grade_assigned` for final grades

**Date Range Support**: ✅ **YES**
- Uses `qc_checks.performed_at` for completed QCs
- For awaiting: current status (point-in-time, not historical)
- Date range: Can count QCs performed within period

### 4. Devices Stats
**Data Required**:
- Expected devices
- Imported devices
- Awaiting repair
- In repair
- Final QC
- Graded

**Database Support**: ✅ **MOSTLY**
- ❌ No "expected" vs "imported" distinction // !CHECK
- ✅ `devices.status` enum covers all workflow states

**Date Range Support**: ⚠️ **COMPLEX**
- `devices.created_at` shows when device was added
- `device_status_history` tracks all status changes with timestamps
- Single date: Need point-in-time snapshot (complex query)
- Date range: Can count devices that ENTERED each status during period 
- **Note**: Status is current state, historical requires status_history table //! add "imported" to status_history table

### 5. Repair Stats
**Data Required**:
- Completed repairs by type
- Active technicians count
- Average jobs per technician
- Individual technician performance

**Database Support**: ✅ **YES**
- ✅ `repair_jobs` table with status and type
- ✅ `repair_jobs.completed_at` for completion tracking

**Date Range Support**: ✅ **YES**
- Single date: `WHERE DATE(completed_at) = '2024-01-15'`
- Date range: `WHERE completed_at BETWEEN '2024-01-01' AND '2024-01-31'`
- Can aggregate all repair metrics across any period

### 6. Workload by Technician Level
**Data Required**:
- Technicians by level (L1, L2, L3)
- Active/completed jobs per level
- Individual technician details

**Database Support**: ✅ **YES**
- ✅ `user_profiles.technician_level` enum (L1, L2, L3)
- ✅ View `technician_workload` has all needed data

**Date Range Support**: ✅ **YES**
- Uses `repair_jobs.completed_at` for completed work
- Can filter by any date range
- Shows technicians active during the period

## Missing API Endpoints
**Critical Gap**: No dashboard-specific API endpoints exist. Need to create:

1. `/api/dashboard/metrics` - Main dashboard data endpoint
2. `/api/dashboard/batch-intake-stats`
3. `/api/dashboard/qc-stats`
4. `/api/dashboard/device-stats`
5. `/api/dashboard/repair-stats`
6. `/api/dashboard/technician-stats`

## Production Metrics Table
The schema includes a `production_metrics` table for daily snapshots:
- ✅ Device counts by status
- ✅ Repair counts by type
- ✅ Grade distribution
- **Limitation**: Only stores daily aggregates, not real-time

## Recommended Implementation Approach

### Phase 1: API Development (Priority)
1. Create dashboard API endpoints
2. Connect to actual database tables
3. Implement date range queries

### Phase 2: Real-time vs Cached Data
- **Option A**: Query live data (slower but accurate)
- **Option B**: Use `production_metrics` for historical, live queries for today
- **Recommendation**: Hybrid approach for best performance

### Phase 3: Date Range Implementation
1. Update DateSelector to calendar range picker
2. Modify all API endpoints to accept date ranges
3. Update dashboard components to handle aggregated data

## Data Gaps to Address

1. **Expected vs Imported Devices**: 
   - Add `actual_device_count` to `batches` table
   - Or track import status per device

2. **Historical Data**:
   - Need background job to populate `production_metrics` daily
   - Currently empty, needs seeding for historical views

3. **Real-time Updates**:
   - Consider WebSocket/polling for live updates
   - Or implement refresh mechanism

## Date Range Support Summary

### ✅ **YES - Database Supports Both Single Dates AND Date Ranges**

**How it works**:
- **Single Date**: Query with `WHERE DATE(column) = '2024-01-15'`
- **Date Range**: Query with `WHERE column BETWEEN start AND end`
- **Aggregation**: Use SUM(), COUNT(), AVG() to combine data

### By Section:
| Section | Single Date | Date Range | Notes |
|---------|------------|------------|-------|
| Batch Intake | ✅ YES | ✅ YES | Uses `created_at` |
| Initial QC | ✅ YES | ✅ YES | Uses `performed_at` |
| Final QC | ✅ YES | ✅ YES | Uses `performed_at` |
| Devices Stats | ⚠️ Complex | ⚠️ Complex | Current status vs historical |
| Repair Stats | ✅ YES | ✅ YES | Uses `completed_at` |
| Technician Workload | ✅ YES | ✅ YES | Uses `completed_at` |

### Important Distinction:
- **Activity-based metrics** (repairs, QC checks, batches): ✅ Easy date ranges
- **Status-based metrics** (current device status): ⚠️ Complex for historical
  - Current status = point-in-time snapshot
  - Historical = need `device_status_history` table

### Example Queries:
```sql
-- Single day: Repairs completed on Jan 15
SELECT COUNT(*) FROM repair_jobs 
WHERE DATE(completed_at) = '2024-01-15'

-- Date range: Repairs completed in January
SELECT COUNT(*) FROM repair_jobs 
WHERE completed_at BETWEEN '2024-01-01' AND '2024-01-31'

-- Aggregated by type over date range
SELECT repair_type, COUNT(*) 
FROM repair_jobs 
WHERE completed_at BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY repair_type
```

## Conclusion
**Can we support date ranges?** 
- **Database Schema**: ✅ YES - 90% ready
- **Single Date**: ✅ YES - All sections supported
- **Date Range**: ✅ YES - Most sections supported
- **Complex Cases**: Device status history needs special handling

**Priority Actions**:
1. ⚠️ Create dashboard API endpoints (CRITICAL)
2. 📊 Implement date range picker UI
3. 🔄 Design queries for both single/range
4. 📈 Handle status vs activity metrics differently
