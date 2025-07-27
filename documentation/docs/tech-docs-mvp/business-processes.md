---
sidebar_position: 2
title: Business Processes
---

# Business Processes

This document outlines the main business processes and workflows for the ReMobile Refurbish system during the MVP phase.

## Main Phases of the Refurbishment Workflow

1.  **Intake & Triage**
    -   Receiving a batch of phones.
    -   Scanning each phone's IMEI to create a record.
    -   Running initial QC (software and manual).
    -   Making the first key decision: Repair, Sell As-Is, or ready for final steps.

2.  **Repair & Refurbishment**
    -   Creating and assigning specific repair jobs (e.g., "Replace Screen").
    -   Technicians perform the physical work.
    -   Tracking spare parts used for each job.
    -   Marking the repair as complete.

3.  **Final Quality Control & Grading**
    -   Running the *entire* QC process again to verify the repair.
    -   Assigning the final product grade (A, B, C).
    -   If it fails, it loops back to the **Repair** phase.

4.  **Packaging & Shipping** *(we could skip this step for the 1st version of the workflow)*
    -   Generating a list of all graded, ready-to-go phones.
    -   Packing the phones into generic boxes.
    -   Updating the inventory status to "Shipped."

## Grading System
Phones are assigned grades during the Final Quality Control & Grading phase:
- **Ungraded (UG)** - Initial state or phones not yet graded
- **A grade** (the best grade)
- **B grade**
- **C grade**

*Note: Initially, stock might come in different grades like A-plus or ungraded (UG). Grades are assigned by the QC person using Dr. Phone software. The QC process is standardized across all phone models.*

## Key Business Processes

#### Batch Intake Process
- Phones arrive in batches from suppliers
- Each batch is recorded with supplier information
- Individual phones are registered within batches using IMEI
- **Important**: Batches cannot be modified after creation
- **Purchase Details**: Each batch includes invoice number, supplier name, purchase date, and total amount (for future cost tracking)

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