# ReMobile Refurbish - Project Documentation

**Status**: 🟡 In Progress  
**Last Updated**: 2024-01-24

## Table of Contents
1. [Project Overview](#project-overview)
2. [Business Processes](#business-processes)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Module Specifications](#module-specifications)
5. [Module Dependencies & Development Order](#module-dependencies--development-order)
6. [Questions for Client](#questions-for-client)

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
- **A grade** (the best grade)
- **B grade**
- **C grade**
- **Ungraded (UG)**

*Note: Initially, stock might come in different grades like A-plus or ungraded (UG). Grades are assigned by the QC person using Dr. Phone software.*

### 2.3 Key Business Processes

#### Batch Intake Process
- Phones arrive in batches from suppliers
- Each batch is recorded with supplier information
- Individual phones are registered within batches using IMEI

#### Quality Control Process
- Initial QC during intake (manual + Dr. Phone software)
- Final QC after repairs to verify quality
- Grade assignment based on condition

#### Repair Job Management
- Jobs created based on initial QC findings
- Assigned to technicians by skill level (L1, L2, L3)
- Parts tracked per repair job

#### Inventory Management
- Bulk tracking of spare parts (batteries, housing, glass)
- Parts usage recorded per repair
- Managed by General Manager

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
- **Workflow Management:**
- Decides necessary actions for phones that fail QA
- Assigns tasks to Technicians and Quality Control

### Quality Control (QC)
- Conducts post-repair quality control
- Performs manual visual inspection and touchscreen checks
- Runs software-based diagnostics
- Determines and assigns final grades (A, B, C)

### Technicians
**L1 Technician**: Housing change
**L2 Technician**: Glass change
**L3 Technician**: Battery and all other repairs
- Perform physical repairs on devices
- Log and track assigned tasks in the system

---

## 4. Module Specifications

### 4.1 Batch Intake Module
**Purpose**: Manage incoming phone batches and initial registration
**Key Features**: 
- Batch creation with supplier info
- IMEI scanning and phone registration
- Initial QC recording
- Status assignment

### 4.2 Phone Tracking Module
**Purpose**: Central tracking of phone status throughout lifecycle
**Key Features**: 
- Real-time status updates
- History tracking
- Search and filtering
- QC results recording

### 4.3 Repair Jobs Module
**Purpose**: Manage repair task creation and assignment
**Key Features**: 
- Job creation based on QC findings
- Technician assignment by level
- Parts allocation
- Progress tracking

### 4.4 Inventory Module
**Purpose**: Track spare parts and usage
**Key Features**: 
- Bulk parts management
- Usage tracking per repair
- Stock level monitoring
- Reorder alerts

### 4.5 Admin Module
**Purpose**: System administration and reporting
**Key Features**: 
- User management
- Role assignment
- Metrics dashboard
- Report generation

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

! Important!
When implementing each module, check impacts on:
- **Database**: Schema changes affecting other modules
- **Status Workflow**: Changes to phone status flow
- **User Permissions**: Role-based access updates
- **Reporting**: New metrics or data points

---

## 6. Questions for Client

### Critical Business Logic:
1. **Batch Management**
   - Can batches be modified after creation?
No. But this shall be explicitly mentioned in the docs.

   - How are batch costs tracked?
answer: no need to track for now.

2. **Repair Process**
   - Are there standard repair time estimates?
answer: no. estimates doesn't matter. The system should have a dashboard that will show statistics (overall how many refurbished, per employee.. etc etc)
   - How is parts compatibility determined?
answer: no need to think about this just now. but the inventory system should be flexible enough to support several (or all?) manuactureres (apple, samsung etc) and also ability to specify one or several model oer each part (optional thought)

3. **Quality Standards**
   - Specific criteria for each grade (A, B, C)?
answer: 4 grades shall be - Ungraded, A, B, C

   - Different QC processes for different models?
answer: Let's assume it will be one single process for all the models and refurbishment, but please explicitly say this in documentation.

4. **Inventory**
   - Minimum stock levels for parts?
answer: no min levels for now (to be considered after MVP development)
   - Preferred suppliers for parts?
answer: No preferred supplier for now, just ability to specify a supplier for battery, for stock, of course, and for batches, like from which supplier phones are coming. Maybe there should be two different supplier types, what do you think, like two different tables for data sources, like suppliers of parts and suppliers of phones, what do you think, just implement the correct way, but don't overcomplicate.

5. **Reporting Needs**
   - Key KPIs to track?
The long answer below (please elaborate this information into the correct section of the documentation):
The key performance indicators (KPIs) to track in the mobile device refurbishment process are primarily operational, focusing on volume and flow, not profit or stock value.
Here are the main KPIs:
• Number of Housing Changes
• Number of Battery Changes
• Number of Glass Changes
• Number of Other Hardware Changes (marked as "Others"? with a specific/manual text input i think)
• Total Phones Fixed/Refurbished
• Phones Packed / Ready for Dispatch
• Batch Progress and Status: This includes understanding what happens with incoming shipments (e.g., A-plus grade, ungraded stock) and the proportion needing various changes.
These KPIs help management understand operational flow, identify bottlenecks, and inform decisions about staffing and shipping. They are like a dashboard of a factory floor, showing exactly how many items are being produced, what types of work are being done, and how many are ready to leave the facility.

   - Daily/weekly/monthly reports needed?
I think now people will just manually, randomly, go to the system and check all the reports one by one. Or check the reports on the... that reports that they will need at the moment.

### Additional Considerations:
- Multi-location support needed?
answer: no, just english
- Integration with accounting system?
answer: no need.
- Barcode/QR scanning requirements?
Long answer: i don't know whether needed / I think not needed.
But also I have the followng input from client (I think it's not full. Use this info and fill a correct part in the documentaion, and also add questions or assumptions so I'll show to the client and finally  get the full understanding):
- For batch entry, phones arrive in a physical "batch" or "new shipment". The process then focuses on tracking individual phones within that batch.
- 1. Individual Phone Scanning: Each phone's IMEI number is scanned to create a record. This occurs during the "Intake & Triage" phase, where the Operations Manager, Imran, "inputs data for all newly received phones into the system" and determines/records the IMEI. The IMEI determination happens via the Dr. Phone software when the phone is connected.
- 2. Bulk Export/Import: The results from Dr. Phone, which are linked to the IMEI numbers, are stored within that software. While there's no API connection, it is possible to export these results in bulk (e.g., as Excel or CSV) from Dr. Phone. This exported file would then be imported into your new system. This means the data entry isn't "one by one manually" by typing, but rather individual scans by Dr. Phone, followed by a bulk transfer of that data.
- Regarding Barcode/QR scanning requirements: The primary requirement is IMEI scanning to identify each phone. The Dr. Phone software handles this by taking the IMEI number when the phone is connected. There are no explicit mentions of additional barcode or QR code scanning requirements beyond this IMEI-based identification process in the provided sources.
- In essence, the "batch" is a conceptual grouping for incoming stock, but individual phones within it are digitized into the system one by one via IMEI capture through Dr. Phone, with the aggregate data then being transferred in bulk. 


---

## Next Steps
1. ✅ Document roles and workflow phases
2. ⏳ Clarify remaining business questions
3. ⏳ Finalize database design based on requirements
4. ⏳ Resume implementation per PROJECT-IMPLEMENTATION-GUIDE.md

---

## Change Log
- 2024-01-24: Initial documentation structure created
- 2024-01-24: Updated roles, added workflow phases and grading system 