# Job Sheet & Repair Queue Implementation Plan

## Overview
Redesign the device detail page (Job Sheet) and implement the Repair Queue to create an efficient workflow for technicians and managers.

**Key Principle**: Technicians should be able to complete all tasks from the Repair Queue without navigation.

## Phase 1: Job Sheet Redesign (`/devices/[internalId]`)

### Goal
Transform the current tabbed interface into a streamlined single-page job sheet that serves as the central device information hub.

### Tasks

#### 1.1 Remove Tab Structure ✅
- [x] Remove Tabs component and all tab-related code
- [x] Keep all content on single page
- **Why**: Tabs hide important information; everything should be visible at once

#### 1.2 Restructure Header Section ✅
- [x] Create compact header with device details:
  - Device model, IMEI, Serial Number, Internal ID
  - Current status badge (use existing statusConfig)
  - Current grade (Ungraded/A/B/C)
  - Batch information
- [x] Keep "Back to Devices" button
- **Why**: Critical info should be immediately visible

#### 1.3 Create Repair History Table ✅
- [x] Design table with columns:
  - Repair Type (Housing/Glass/Battery/Software/Other)
  - Status (Pending/In Progress/Completed)
  - Technician Level (L1/L2/L3)
  - Assigned To (when in progress)
  - Parts Used
  - Assigned/Completed timestamps
- [x] Sort by newest first
- **Why**: Central view of all repair activities

#### 1.4 Add Parts Recording Interface ✅
- [x] Simple modal dialog with:
  - Part dropdown (from inventory)
  - Quantity input
  - Notes field
  - Save button
- [x] "Add Parts" button for completed/in-progress repairs
- **Why**: MVP needs simplest approach for parts tracking
- **Implementation**: Modal dialog accessible from repair history

#### 1.5 Role-Based Actions ✅
- [x] Technicians: Can add parts to repairs
- [x] Ops Managers: Can create new repairs + add parts
- [x] Role-based button visibility (mock user system)
- [x] Create repair buttons for all repair types (housing, glass, battery, software, other)
- **Why**: Different users need different capabilities
- **Implementation**: Single interface with conditional rendering based on mock user role

## Phase 2: Repair Queue Implementation (`/repair-jobs`)

### Goal
Create an efficient queue where technicians can self-select repairs and complete all actions inline.

### Tasks

#### 2.1 Create Queue List Structure ✅
- [x] Table/list showing available repairs:
  - Device info (Model, IMEI, Internal ID)
  - Repair type needed
  - Technician level required
  - Created date
  - Priority/urgency (if applicable)
- **Why**: Technicians need to see all relevant info before selecting

#### 2.2 Add Filtering System ✅
- [x] Filter by technician level (L1/L2/L3)
- [x] Filter by repair type
- [x] Search by IMEI/Internal ID
- [x] Show only "Pending" repairs by default
- **Why**: Technicians should quickly find relevant jobs
- **Implementation**: Single page with filter dropdowns, no separate interfaces needed

#### 2.3 Implement Self-Selection Flow ✅
- [x] "Start Repair" button on each row
- [x] Confirmation dialog (use existing ConfirmationDialog component)
- [x] Update status to "In Progress" 
- [x] Assign to current user (mock user for now)
- **Why**: Clear ownership and status tracking

#### 2.4 Add Inline Completion Flow ✅
- [x] "Complete" button for in-progress repairs
- [x] Inline parts recording form appears:
  - Part dropdown + quantity
  - Optional notes field
  - Submit button
- [x] Update status to "Completed" on submit
- **Why**: Everything in one place, no navigation needed

#### 2.5 Add Quick Actions ✅
- [x] "View Device" link to job sheet (if needed)
- [x] Status badges for visual clarity
- [x] Show assigned technician for in-progress items
- **Why**: Quick reference without leaving queue

## Phase 3: Integration & Polish

### Goal
Ensure both pages work together seamlessly and provide good UX.

### Tasks

#### 3.1 Mock Data Enhancement ✅
- [x] Add more repair jobs to mockRepairJobs
- [x] Include various statuses and technician levels  
- [x] Add parts data to completed repairs
- **Why**: Need realistic data for testing
- **Implementation**: Added 10 more repair jobs with diverse statuses, technician levels, and parts usage

#### 3.2 Navigation & Links ✅
- [x] Link from Repair Queue to Job Sheet ("View Device" button)
- [x] Link from Job Sheet back to Repair Queue (header button)
- [x] Ensure breadcrumbs work correctly (navigation menu includes all links)
- **Why**: Users may need to navigate between views

#### 3.3 UI Consistency ✅
- [x] Use same status badges across both pages (both use statusConfig)
- [x] Consistent button styles and spacing (cursor-pointer, same sizing)
- [x] Mobile responsive design (responsive grid layouts)
- **Why**: Professional, cohesive interface

#### 3.4 State Management ✅
- [x] Ensure status updates reflect immediately (React state updates)
- [x] Parts recording saves properly (mock data updates)
- [x] Filter states persist during session (existing localStorage implementation)
- **Why**: Smooth user experience
- **Implementation**: State management works correctly for MVP mockup level

## Testing Checkpoints

### After Phase 1:
- Device details display correctly in header
- Repair history shows all repairs
- Parts can be recorded inline
- No tabs, everything on one page

### After Phase 2:
- Repair queue shows pending repairs
- Filters work correctly
- Start/Complete flow works inline
- Parts recording works without navigation

### After Phase 3:
- Navigation between pages works
- Data consistency across pages
- Mobile responsive
- All user flows complete smoothly

## Implementation Notes

1. **Use existing components** where possible (Button, Badge, Card, etc.) - very important! investigate existing components.
2. **Keep it simple** - this is MVP, avoid complex features
3. **Mock user roles** for now - just use a variable to simulate different users
4. **Focus on UX** - technicians should work efficiently

## 🚨 MVP STRICT COMPLIANCE

**ONLY implement features defined in MVP documentation:**
- Fixed repair task types: Housing Change (L1), Glass Change (L2), Battery Change (L3), Software Update (Any), Other
- No audit logs, no task dependencies, no file attachments
- Parts tracking per repair (simple dropdown + quantity)
- Status updates: Pending → In Progress → Completed
- Self-selection queue for technicians
- NO features beyond MVP scope

## Answers to Your Questions

**Role Visualization**: For MVP interface creation, we'll use a simple mock variable to simulate different user types and show/hide UI elements accordingly. Single interface with conditional rendering - no separate pages needed.

**Technician Level Pages**: Use filtering on single page rather than separate pages. Filters will show/hide relevant repairs based on technician level (L1/L2/L3). Simpler for MVP.

**State Management**: You're right - for interface mockup stage, we'll focus on visual functionality. Real state persistence can be simplified with useState for demo purposes.

## Success Criteria

- ✅ Technicians can complete entire workflow from Repair Queue
- ✅ Job Sheet shows complete device history at a glance
- ✅ Parts recording is simple and optional
- ✅ Multiple repairs can be in progress simultaneously
- ✅ Interface is clean, compact, and efficient
