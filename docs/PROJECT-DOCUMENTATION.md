# ReMobile Refurbish - Project Documentation

**Status**: 🟡 In Progress  
**Last Updated**: 2024-01-24

## Table of Contents
1. [Project Overview](#project-overview)
2. [Business Processes](#business-processes)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Module Specifications](#module-specifications)
5. [Module Dependencies & Development Order](#module-dependencies--development-order)
6. [Business Constraints & Requirements](#business-constraints--requirements)
7. [Reporting & KPIs](#reporting--kpis)
8. [Remaining Questions](#remaining-questions)

---

## 1. Project Overview

### Business Context
ReMobile Refurbish is an internal ERP system designed to manage the complete lifecycle of phone refurbishment operations, from batch intake to final shipping.

### Core Business Goals
- Streamline phone refurbishment workflow
- Track inventory and repair status in real-time
- Manage quality control processes
- Optimize repair job allocation
- Monitor business metrics and performance

---

## 2. Business Processes

### 2.1 Main Phases of the Refurbishment Workflow

1. **Intake & Triage**
    - Receiving a batch of phones.
    - Scanning each phone's IMEI to create a record.
    - Running initial QC (software and manual).
    - Making the first key decision: Repair, Sell As-Is, or ready for final steps.

2. **Repair & Refurbishment**
    - Creating and assigning specific repair jobs (e.g., "Replace Screen").
    - Technicians perform the physical work.
    - Tracking spare parts used for each job.
    - Marking the repair as complete.

3. **Final Quality Control & Grading**
    - Running the *entire* QC process again to verify the repair.
    - Assigning the final product grade (A, B, C).
    - If it fails, it loops back to the **Repair** phase.

4. **Packaging & Shipping** *(we could skip this step for the 1st version of the workflow)*
    - Generating a list of all graded, ready-to-go phones.
    - Packing the phones into generic boxes.
    - Updating the inventory status to "Shipped."

### 2.2 Grading System
Phones are assigned grades during the Final Quality Control & Grading phase:
- **Ungraded (UG)** - Initial state or phones not yet graded
- **A grade** (the best grade)
- **B grade**
- **C grade**

*Note: Initially, stock might come in different grades like A-plus or ungraded (UG). Grades are assigned by the QC person using Dr. Phone software. The QC process is standardized across all phone models.*

### 2.3 Key Business Processes

#### Batch Intake Process
- Phones arrive in batches from suppliers
- Each batch is recorded with supplier information
- Individual phones are registered within batches using IMEI
- **Important**: Batches cannot be modified after creation

#### Data Import Process (Dr. Phone Integration)
1. **Individual Phone Scanning**: Each phone's IMEI is captured via Dr. Phone software when connected
2. **Bulk Export/Import**: Dr. Phone results (IMEI, phone model/brand, QC results) are exported in bulk (Excel/CSV) and imported into the system
3. **No Manual Entry**: Data entry is automated through bulk import, not manual typing
4. **Import Frequency**: Daily or per batch basis (flexible timing)
5. **Error Handling**: Basic validation and error reporting
6. **Data Immutability**: No updates/corrections after import

#### Quality Control Process
**QC Stages:**
1. **Initial QC** (during Intake & Triage)
   - Software diagnostics via Dr. Phone (detects faults like camera issues)
   - Manual visual inspection for physical damage/scratches
   - Touchscreen functionality verification
   - General functionality testing
   - IMEI linked to QC results

2. **Final QC** (after repairs)
   - Complete re-run of all QC tests
   - Verify repair quality
   - Grade assignment (Ungraded, A, B, C)
   - If fails, loops back to Repair phase

**Decision Making:**
- Manual grading by QC person (human judgment for MVP)
- Operations Manager can override QC decisions
- No automated pass/fail criteria

#### Repair Job Management
**Job Creation & Tracking:**
- Jobs created based on initial QC findings
- Multiple repairs per phone supported (battery + screen, etc.)
- Each repair tracked separately
- Can be handled by same or different technicians

**Work Assignment Process:**
- Queue-based system: Repairs available in general queue
- Self-selection: Technicians pick their own work from available repairs
- No direct assignments from Operations Manager
- No priority system (first-come, first-served for MVP)
- Simple reassignment capability if repair can't be completed

#### Inventory Management
**Parts Tracking:**
- Bulk tracking of spare parts (batteries, housing, glass)
- Parts usage recorded per repair
- Supplier tracking (separate for phones and parts)

**Parts Compatibility:**
- Optional model/brand specification per part
- Phone model/brand captured from Dr. Phone export
- Manual selection by technicians (no automated matching)
- System supports multiple manufacturers (Apple, Samsung, etc.)

---

## 3. User Roles & Permissions

### General Manager
- Provides input on key metrics (housing, battery, glass changes)
- Tracks bulk inventory of parts (batteries, housing)
- Full system access for reporting and analytics

### Operations Manager
**Intake & Triage:**
- Inputs data for all newly received phones
- Performs initial quality control (manual + Dr. Phone software)
- Records IMEI and initial QC results
**Workflow Management:**
- Decides necessary actions for phones that fail QA
- Assigns tasks to Technicians and Quality Control
- Can reassign repairs between technicians

### Quality Control (QC)
- Conducts post-repair quality control
- Performs manual visual inspection and touchscreen checks
- Runs software-based diagnostics
- Determines and assigns final grades (Ungraded, A, B, C)
- Makes pass/fail decisions based on manual assessment

### Technicians
**L1 Technician**: Housing change only
**L2 Technician**: Glass change only
**L3 Technician**: Battery and all other repairs only
- Perform physical repairs on devices
- Pick available repairs from queue (no direct assignment)
- Log and track repair completion
- **Cannot perform repairs outside their level**

---

## 4. Module Specifications

### 4.1 Batch Intake Module
**Purpose**: Manage incoming phone batches and initial registration
**Key Features**: 
- Batch creation and management (see Batch Intake Process)
- Dr. Phone data import functionality
- Initial phone status assignment

### 4.2 Phone Tracking Module
**Purpose**: Central tracking of phone status throughout lifecycle
**Key Features**: 
- Real-time status updates
- History tracking
- Search and filtering
- QC results recording
- Grade management (Ungraded, A, B, C)
- Multiple repair tracking per phone

### 4.3 Repair Jobs Module
**Purpose**: Manage repair task creation and assignment
**Key Features**: 
- Queue-based repair management (see Repair Job Management)
- Parts allocation tracking
- Repair types: Housing (L1), Glass (L2), Battery (L3), Other with text input

### 4.4 Inventory Module
**Purpose**: Track spare parts and usage
**Key Features**: 
- Parts and supplier management (see Inventory Management)
- Stock monitoring (no minimum alerts for MVP)
- Usage tracking per repair

### 4.5 Admin Module
**Purpose**: System administration and reporting
**Key Features**: 
- User management
- Role assignment
- Metrics dashboard
- Report generation
- KPI tracking

---

## 5. Module Dependencies & Development Order

### 5.1 Dependency Matrix

| Module | Depends On | Required By |
|--------|------------|-------------|
| **Batch Intake** | Auth/Users, Core DB | Phone Tracking, Inventory |
| **Phone Tracking** | Batch Intake, Auth | Repair Jobs, QC Process |
| **Repair Jobs** | Phone Tracking, Inventory | QC Process, Reporting |
| **Inventory** | Auth/Users, Core DB | Repair Jobs, Reporting |
| **Admin** | All modules | None |

### 5.2 Development Order

**Phase 1: Foundation**
1. Authentication & User Management
2. Core Database Schema

**Phase 2: Core Business**
3. Batch Intake Module
4. Inventory Module

**Phase 3: Workflow**
5. Phone Tracking Module
6. Repair Jobs Module

**Phase 4: Quality Control**
7. QC Process (within Phone Tracking)

**Phase 5: Administration**
8. Admin Module & Reporting

### 5.3 Cross-Module Impacts

**! Important!**
When implementing each module, check impacts on:
- **Database**: Schema changes affecting other modules
- **Status Workflow**: Changes to phone status flow
- **User Permissions**: Role-based access updates
- **Reporting**: New metrics or data points

---

## 6. Business Constraints & Requirements

### System Constraints
- **Language**: English only (no multi-language support needed)
- **Currency**: Single currency system
- **Locations**: Single location operation
- **Integrations**: No external accounting system integration required

### Data Management
- **Batch Immutability**: Batches cannot be modified after creation
- **Cost Tracking**: No batch cost tracking in MVP
- **Time Estimates**: No repair time estimates needed
- **Stock Levels**: No minimum stock level alerts in MVP
- **Data Retention**: Keep all records indefinitely
- **Dr. Phone Updates**: No updates/corrections after import (assumption)

### Supplier Management
- **Dual Supplier Types**: 
  - Phone suppliers (for batches)
  - Parts suppliers (for spare parts)
- **Flexible Part System**: Support for multiple manufacturers and models

---

## 7. Reporting & KPIs

### Key Performance Indicators
The system tracks operational KPIs focused on volume and workflow efficiency:

#### Repair Metrics
- **Number of Housing Changes**: Track L1 technician work
- **Number of Battery Changes**: Track L3 technician work
- **Number of Glass Changes**: Track L2 technician work
- **Number of Other Hardware Changes**: Track other repairs with text description

#### Production Metrics
- **Total Phones Fixed/Refurbished**: Overall output
- **Phones Packed/Ready for Dispatch**: Completion rate
- **Batch Progress and Status**: Track incoming stock processing

#### Dashboard Features
- Real-time operational flow visualization
- Bottleneck identification
- Staff performance metrics (repairs per employee)
- Factory floor style dashboard showing production status

### Reporting Access
- On-demand report viewing (no scheduled reports)
- Users access reports as needed
- Focus on real-time operational visibility
- No automated alerts or notifications

---

## 8. Remaining Questions

### Critical for Database Design
1. **Physical Device Tracking**
   - How are devices physically labeled/identified?
   - Storage organization system?
   - Physical handoff process between stations?

### Failed Device Handling
2. **Failed QC Scenarios**
   - What happens to phones that fail initial QC but aren't worth repairing?
   - How many times can a phone fail final QC before it's scrapped?
   - Is there a "parts phone" or "scrap" status needed?
   - How are irreparable phones handled?

### Dr. Phone Export
3. **Data Structure**
   - What specific fields does Dr. Phone export?
   - Sample export file needed for database design

---

## Future Enhancements (Post-MVP)
- **Security & Tracking**: Lost/stolen phone tracking, audit trails
- **Business Extensions**: Warranty/guarantee management, customer returns handling
- **Operational Features**: Multi-location support, batch reconciliation
- **Automation**: Automated notifications, minimum stock alerts, SLA/deadline tracking
- **Advanced Analytics**: Historical trend analysis, historical reporting
- **Technical Features**: Different repair procedures per model

---

## Next Steps
1. ⏳ Get answers for remaining critical questions (physical tracking, failed device handling)
2. ⏳ Obtain Dr. Phone sample export file
3. ⏳ Finalize database design based on requirements
4. ⏳ Resume implementation per PROJECT-IMPLEMENTATION-GUIDE.md

---

## Change Log
- 2024-01-24: Initial documentation structure created
- 2024-01-24: Updated roles, added workflow phases and grading system
- 2024-01-24: Added business constraints, KPIs, and data import process based on client feedback
- 2024-01-24: Added assumptions, clarifications, and remaining questions based on detailed Q&A 