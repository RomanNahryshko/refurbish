---
sidebar_position: 4
title: Development Guide
---

# Development Guide

This guide covers key technical constraints, dependencies, and the recommended development order for the MVP.

## Module Dependencies & Development Order

### Dependency Matrix

| Module | Depends On | Required By |
|--------|------------|-------------|
| **Batch Intake** | Auth/Users, Core DB | Phone Tracking, Inventory |
| **Phone Tracking** | Batch Intake, Auth | Repair Jobs, QC Process |
| **Repair Jobs** | Phone Tracking, Inventory | QC Process, Reporting |
| **Inventory** | Auth/Users, Core DB | Repair Jobs, Reporting |
| **Admin** | All modules | None |

### Development Order

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

### Cross-Module Impacts

**! Important!**
When implementing each module, check impacts on:
- **Database**: Schema changes affecting other modules
- **Status Workflow**: Changes to phone status flow
- **User Permissions**: Role-based access updates
- **Reporting**: New metrics or data points

## Business Constraints & Requirements

### System Constraints
- **Language**: English only (no multi-language support needed)
- **Currency**: Single currency system
- **Locations**: Single location operation
- **Integrations**: No external accounting system integration required

### Data Management
- **Batch Immutability**: Batches cannot be modified after creation
- **Cost Tracking**: No batch cost tracking in MVP
- **Purchase Invoice**: Basic invoice details captured (invoice number, amount, supplier) for future extensibility
- **Time Estimates**: No repair time estimates needed
- **Stock Levels**: No minimum stock level alerts in MVP
- **Data Retention**: Keep all records indefinitely
- **Dr. Phone Updates**: No updates/corrections after import (assumption)

### Supplier Management
- **Dual Supplier Types**: 
  - Phone suppliers (for batches)
  - Parts suppliers (for spare parts)
- **Flexible Part System**: Support for multiple manufacturers and models 