# Job Sheet & Repair Queue Implementation Plan

## Overview
Redesign the device detail page (Job Sheet) and implement the Repair Queue to create an efficient workflow for technicians and managers.

**Key Principle**: Technicians should be able to complete all tasks from the Repair Queue without navigation.

## Phase 1: Job Sheet Redesign (`/devices/[internalId]`)

### Goal
Transform the current tabbed interface into a streamlined single-page job sheet that serves as the central device information hub.

### Tasks

#### 1.1 Remove Tab Structure
- [ ] Remove Tabs component and all tab-related code
- [ ] Keep all content on single page
- **Why**: Tabs hide important information; everything should be visible at once

#### 1.2 Restructure Header Section
- [ ] Create compact header with device details:
  - Device model, IMEI, Serial Number, Internal ID
  - Current status badge (use existing statusConfig)
  - Current grade (Ungraded/A/B/C)
  - Batch information
- [ ] Keep "Back to Devices" button
- **Why**: Critical info should be immediately visible

#### 1.3 Create Repair History Table
- [ ] Design table with columns:
  - Repair Type (Housing/Glass/Battery/Software/Other)
  - Status (Pending/In Progress/Completed)
  - Technician Level (L1/L2/L3)
  - Assigned To (when in progress)
  - Parts Used
  - Started/Completed timestamps
- [ ] Sort by newest first
- **Why**: Central view of all repair activities

#### 1.4 Add Parts Recording Interface
- [ ] Simple inline form in each repair row:
  - Part dropdown (from inventory)
  - Quantity input
  - Save button
- [ ] Only show for technicians, read-only for others
- **Why**: MVP needs simplest approach, no complex modals

#### 1.5 Role-Based Actions
- [ ] Technicians: Can update status, record parts
- [ ] Managers: View-only access
- [ ] Hide actions based on user role (mock for now)
Maybe to create seperate interfaces/pages to each Role? or how to visualize? Since we creating the interface for now.
- **Why**: Different users need different capabilities

## Phase 2: Repair Queue Implementation (`/repair-jobs`)

### Goal
Create an efficient queue where technicians can self-select repairs and complete all actions inline.

### Tasks

#### 2.1 Create Queue List Structure
- [ ] Table/list showing available repairs:
  - Device info (Model, IMEI, Internal ID)
  - Repair type needed
  - Technician level required
  - Created date
  - Priority/urgency (if applicable)
- **Why**: Technicians need to see all relevant info before selecting

#### 2.2 Add Filtering System
- [ ] Filter by technician level (L1/L2/L3)
Maybe to create seperate interfaces/pages for each technician level? or how to visualize? Since we creating the interface for now without DB connection).

- [ ] Filter by repair type
- [ ] Search by IMEI/Internal ID
- [ ] Show only "Pending" repairs by default
- **Why**: Technicians should quickly find relevant jobs

#### 2.3 Implement Self-Selection Flow
- [ ] "Start Repair" button on each row
- [ ] Confirmation dialog (use existing ConfirmationDialog component)
- [ ] Update status to "In Progress" 
- [ ] Assign to current user (mock user for now)
- **Why**: Clear ownership and status tracking

#### 2.4 Add Inline Completion Flow
- [ ] "Complete" button for in-progress repairs
- [ ] Inline parts recording form appears:
  - Part dropdown + quantity
  - Optional notes field
  - Submit button
- [ ] Update status to "Completed" on submit
- **Why**: Everything in one place, no navigation needed

#### 2.5 Add Quick Actions
- [ ] "View Device" link to job sheet (if needed)
- [ ] Status badges for visual clarity
- [ ] Show assigned technician for in-progress items
- **Why**: Quick reference without leaving queue

## Phase 3: Integration & Polish

### Goal
Ensure both pages work together seamlessly and provide good UX.

### Tasks

#### 3.1 Mock Data Enhancement
- [ ] Add more repair jobs to mockRepairJobs
- [ ] Include various statuses and technician levels
- [ ] Add parts data to completed repairs
- **Why**: Need realistic data for testing

#### 3.2 Navigation & Links
- [ ] Link from Repair Queue to Job Sheet
- [ ] Link from Job Sheet back to Repair Queue
- [ ] Ensure breadcrumbs work correctly
- **Why**: Users may need to navigate between views

#### 3.3 UI Consistency
- [ ] Use same status badges across both pages
- [ ] Consistent button styles and spacing
- [ ] Mobile responsive design
- **Why**: Professional, cohesive interface

#### 3.4 State Management
- [ ] Ensure status updates reflect immediately
(not sure this needed for this mockup/interface creatioon stage?)
- [ ] Parts recording saves properly
(not sure this needed for this mockup/interface creatioon stage?)
- [ ] Filter states persist during session
(not sure this needed for this mockup/interface creatioon stage?)
- **Why**: Smooth user experience

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

## Success Criteria

- ✅ Technicians can complete entire workflow from Repair Queue
- ✅ Job Sheet shows complete device history at a glance
- ✅ Parts recording is simple and optional
- ✅ Multiple repairs can be in progress simultaneously
- ✅ Interface is clean, compact, and efficient
