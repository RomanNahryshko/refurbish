---
title: Device Statuses
sidebar_position: 2
---

# Device Statuses

This document defines all device statuses used throughout the refurbishment workflow in the MVP system.

## Status Flow Overview

The device status progression follows the main refurbishment workflow:

```
received → initial_qc → awaiting_repair → in_repair → final_qc → graded
                                              ↑                        ↓
                                              ←────────────────────────
                                            (loop back if QC fails)
```

## Primary Device Statuses

### 1. **Received**
- **Description**: Device has been received in a batch from supplier
- **Next Status**: `initial_qc`
- **Triggered By**: Batch intake process
- **User Role**: Operations Manager

### 2. **Initial QC**
- **Description**: Device is undergoing initial quality control
- **Activities**: 
  - Dr. Phone scanning for automated fault detection
  - Manual review and modification of detected faults
  - Addition of visual faults (housing damage, screen issues, etc.)
- **Next Status**: `awaiting_repair`
- **User Role**: Operations Manager

### 3. **Awaiting Repair**
- **Description**: Device has completed initial QC and is waiting for repair tasks to be assigned
- **Activities**: Operations Manager decides necessary repair actions
- **Next Status**: `in_repair`
- **User Role**: Operations Manager (assigns tasks)

### 4. **In Repair**
- **Description**: Device has active repair tasks being performed by technicians
- **Activities**: 
  - Technicians perform assigned repairs
  - Parts usage recording
  - Task status updates (pending → in_progress → completed)
- **Next Status**: `final_qc`
- **User Role**: Technicians (L1, L2, L3)

### 5. **Final QC**
- **Description**: Device repairs are complete and undergoing final quality control
- **Activities**: 
  - Complete re-run of all QC tests
  - Manual visual inspection and touchscreen checks
  - Software-based diagnostics
  - Grade determination
- **Next Status**: `graded` (if passed) or `awaiting_repair` (if failed)
- **User Role**: Quality Control

### 6. **Graded**
- **Description**: Device has passed final QC and received a grade
- **Grade Options**: A, B, or C (see Grading System below)
- **Final Status**: Yes (for MVP)
- **User Role**: Quality Control

## Loop Back to Repair

When a device fails final QC, it loops back to `awaiting_repair` status for additional repairs. This is part of the normal workflow and ensures devices meet quality standards before grading.

## Grading System

**Important**: Grading is separate from device status. A device receives a grade only after passing final QC.

- **Ungraded (UG)**: Initial state, no grade assigned yet
- **A Grade**: Best condition - minimal to no visible wear
- **B Grade**: Good condition - light cosmetic wear
- **C Grade**: Acceptable condition - moderate cosmetic wear but fully functional

## Repair Task Statuses

Within the `in_repair` device status, individual repair tasks have their own statuses:

- **Pending**: Task created but not started
- **In Progress**: Technician actively working on task
- **Completed**: Task successfully finished

**Note**: If a technician cannot complete a task, the device returns to the queue (`awaiting_repair` status) for reassignment.

## Status Permissions

| Status Change | Authorized Roles |
|--------------|-----------------|
| received → initial_qc | Operations Manager |
| initial_qc → awaiting_repair | Operations Manager |
| awaiting_repair → in_repair | Operations Manager (assigns), Technician (starts work) |
| in_repair → final_qc | Technician (when all tasks completed) |
| final_qc → graded | Quality Control |
| final_qc → awaiting_repair | Quality Control |

## MVP Limitations

- **No custom statuses**: Status list is fixed for MVP
- **No status history tracking**: Only current status is stored
- **Manual transitions**: All status changes require user action
- **No shipping module**: Shipping and related statuses not implemented in MVP
