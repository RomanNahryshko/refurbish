---
title: Job Sheet
---

# Job Sheet

Each device has a dedicated job sheet page that serves as the central hub for all device-related information and repair activities. The job sheet is accessed by searching for the device using its IMEI or Internal ID.

## Access Method

- **Search by Internal ID**, OR
- **Search by IMEI**

## Job Sheet Contents

### Device Information
- Model Number
- IMEI
- Serial Number
- Internal ID
- Current Grade (Ungraded, A, B, C)
- Current Status
- Batch Information

### Repair History
- List of all repair tasks/jobs
- Task status (Pending, In Progress, Completed)
- Assigned technician level
- Completion timestamps

### Current Tasks
- Active/Open repair jobs

### Spare Parts Section
- Parts used for each repair
- Simple interface (possibly as popup)
- Part type and quantity tracking

## Technician Capabilities

Technicians can:
- **Update job status**: Mark tasks as in progress or completed
- **View all device information**: Read-only access to device details
- **Record parts usage**: Track which parts were used for repairs

Technicians cannot:
- **Add new tasks**: Task creation restricted to Operations Manager
- **Edit task definitions**: Predefined task types cannot be modified
- **Delete existing tasks**: No removal of assigned tasks

## MVP Limitations

- **No audit log**: Status changes are not tracked in history
- **No task dependencies**: Tasks are independent of each other
- **No file attachments**: Cannot attach photos or documents
- **No printed job sheets**: Digital only, no print functionality 