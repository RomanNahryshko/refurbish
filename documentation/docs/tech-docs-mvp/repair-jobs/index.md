---
title: Repair Jobs Module
---

# Repair Jobs Module

Manage repair task creation and assignment.

## Key Features
- Queue-based repair management
- Parts allocation tracking

## Repair Task Types

The following repair tasks are available in the MVP:

1. **Housing Change** (L1 Technician only)
2. **Glass Change** (L2 Technician only)
3. **Battery Change** (L3 Technician only)
4. **Software Update** (Any technician - pending approval with Hassib)
5. **Other** (With text description field)

**Note**: This task list is fixed for MVP. The ability to add or edit task types will be available in future releases.

## Software Update Task

- Required when a new battery is installed (approximately 80% of cases)
- Part of the QC process
- Must be manually added as a separate task (no automatic dependencies in MVP)
- **Assumption**: Any technician can perform software updates (to be confirmed with Hassib)

After repairs are completed, each device undergoes a [final quality control check](../device-tracking/quality-control.md#final-qc). 