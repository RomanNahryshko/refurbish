# Database Design Process

**Status**: 🟡 In Progress  
**Last Updated**: 2024-01-24

## Table of Contents
1. [Design Process Overview](#design-process-overview)
2. [Current Schema Status](#current-schema-status)
3. [Entity Identification](#entity-identification)
4. [Relationship Mapping](#relationship-mapping)
5. [Field Specifications](#field-specifications)
6. [Constraints & Validations](#constraints--validations)
7. [Indexes & Performance](#indexes--performance)
8. [Security Considerations](#security-considerations)
9. [Migration Strategy](#migration-strategy)
10. [Definition of Done](#definition-of-done)
11. [Approval Checklist](#approval-checklist)

---

## 1. Design Process Overview

### Phases
1. **Requirements Gathering** ← Current Phase
   - [ ] Document all business processes
   - [ ] Identify all entities
   - [ ] Define relationships
   - [ ] Determine data requirements

2. **Design & Modeling**
   - [ ] Create ERD diagram
   - [ ] Define all tables
   - [ ] Specify all fields and types
   - [ ] Design constraints

3. **Review & Refinement**
   - [ ] Review with stakeholders
   - [ ] Optimize for performance
   - [ ] Ensure scalability
   - [ ] Validate against use cases

4. **Implementation**
   - [ ] Generate final schema.sql
   - [ ] Create migration scripts
   - [ ] Deploy to Supabase
   - [ ] Verify deployment

### Design Principles
- **Normalization**: Aim for 3NF where appropriate
- **Performance**: Balance normalization with query performance
- **Scalability**: Design for future growth
- **Integrity**: Enforce data consistency at DB level
- **Security**: Implement RLS from the start

---

## 2. Current Schema Status

### Existing Tables (Basic Schema)
✅ **Created in schema.sql:**
- `batches` - Basic structure
- `phones` - Basic structure
- `spare_parts` - Basic structure
- `user_profiles` - Basic structure

### Missing Tables
❌ **To be designed:**
- `repair_jobs`
- `repair_job_parts`
- `phone_assessments`
- `qc_checks`
- `shipments`
- `audit_logs`
- `suppliers`
- `customers` (if needed)
- `notifications`
- `system_settings`

---

## 3. Entity Identification

### Core Entities

#### 3.1 Batch
**Purpose**: Group of phones received together  
**Key Attributes**: [To be defined based on business process]
- [ ] Batch ID
- [ ] Supplier reference
- [ ] Date received
- [ ] Total phones
- [ ] Status
- [ ] Cost information

#### 3.2 Phone
**Purpose**: Individual phone unit  
**Key Attributes**: [To be defined]
- [ ] Unique identifier (IMEI/Serial)
- [ ] Model information
- [ ] Condition/Grade
- [ ] Current status
- [ ] Location tracking

#### 3.3 Repair Job
**Purpose**: [To be defined]  
**Key Attributes**: [To be defined]

#### 3.4 Spare Part
**Purpose**: Inventory items used in repairs  
**Key Attributes**: [To be defined]

#### 3.5 User
**Purpose**: System users with different roles  
**Key Attributes**: ✅ Partially defined

### Supporting Entities
[To be identified based on business processes]

---

## 4. Relationship Mapping

### Identified Relationships
```
batches (1) ← → (N) phones
phones (1) ← → (N) repair_jobs
repair_jobs (N) ← → (N) spare_parts (through repair_job_parts)
users (1) ← → (N) repair_jobs (as technician)
users (1) ← → (N) qc_checks (as controller)
```

### Relationship Rules
- [ ] Can a phone exist without a batch?
- [ ] Can a phone have multiple active repair jobs?
- [ ] Can spare parts be reserved for specific repairs?
- [ ] Can users be assigned to specific batches/phones?

---

## 5. Field Specifications

### Naming Conventions
- **Tables**: plural, snake_case (e.g., `repair_jobs`)
- **Fields**: snake_case (e.g., `created_at`)
- **Primary Keys**: `id` (UUID)
- **Foreign Keys**: `{table_singular}_id` (e.g., `phone_id`)
- **Timestamps**: `created_at`, `updated_at`

### Standard Fields (All Tables)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)
```

### Data Types Policy
- **IDs**: UUID (for security and distribution)
- **Money**: DECIMAL(10,2)
- **Status**: ENUM types
- **Dates**: TIMESTAMPTZ
- **Text**: VARCHAR with length limits

---

## 6. Constraints & Validations

### Types of Constraints
- [ ] Primary Keys
- [ ] Foreign Keys with CASCADE rules
- [ ] Unique constraints
- [ ] Check constraints
- [ ] Not null constraints

### Validation Rules
[To be defined based on business rules]

---

## 7. Indexes & Performance

### Index Strategy
- [ ] Primary key indexes (automatic)
- [ ] Foreign key indexes
- [ ] Frequently queried fields
- [ ] Composite indexes for common queries

### Performance Considerations
- [ ] Identify high-frequency queries
- [ ] Plan for data growth
- [ ] Consider partitioning strategy

---

## 8. Security Considerations

### Row Level Security (RLS)
- [ ] Define policies per table
- [ ] Role-based access rules
- [ ] Data isolation requirements

### Audit Requirements
- [ ] Track all changes
- [ ] Store who/when/what
- [ ] Compliance needs

---

## 9. Migration Strategy

### Approach
- [ ] Initial schema creation
- [ ] Seed data requirements
- [ ] Future migration process
- [ ] Rollback procedures

---

## 10. Definition of Done

### For Each Table/Entity Design:
- [ ] **Entity Defined**: Purpose, attributes, and relationships documented
- [ ] **Dependency Check**: 
  - Which existing tables does this impact?
  - Do any existing tables need new fields/relationships?
  - Are there cascade effects to consider?
- [ ] **Integration Points**: How will other modules interact with this entity?
- [ ] **Future Considerations**: Will this design support known future requirements?

### For Each Module Documentation:
- [ ] **Business Process**: Clearly documented and validated
- [ ] **Data Requirements**: All needed fields/tables identified
- [ ] **Dependency Check**:
  - Review all modules that might be affected
  - Update their documentation if needed
  - Note any breaking changes
- [ ] **API Contract**: If module exposes data, document the interface

### Dependency Check Questions:
1. **When adding a new field/table:**
   - Does this affect existing queries in other modules?
   - Do related tables need corresponding updates?
   - Are there reports/views that need updating?

2. **When changing a relationship:**
   - What modules rely on this relationship?
   - Are there cascade deletes/updates to reconsider?
   - Do access policies need updating?

3. **When modifying business logic:**
   - Which modules consume this logic?
   - Are there status workflows that need adjustment?
   - Do validation rules in other modules need updates?

### Documentation Update Protocol:
When a dependency is identified:
1. Note it in the current module's documentation
2. Update the affected module's documentation
3. Add a change log entry in both places
4. Flag for testing during implementation

---

## 11. Approval Checklist

### Before Finalizing Schema
- [ ] All business processes documented
- [ ] All entities identified
- [ ] All relationships defined
- [ ] All fields specified with types
- [ ] All constraints defined
- [ ] Performance considerations addressed
- [ ] Security policies defined
- [ ] Client review completed
- [ ] Test cases prepared

### Sign-off Required From
- [ ] Technical Lead
- [ ] Business Stakeholder
- [ ] Database Administrator (if applicable)

---

## Appendix

### A. Current schema.sql
```sql
-- Current basic schema
-- See: /schema.sql
```

### B. ERD Diagram
[To be created]

### C. Sample Queries
[To be documented]

---

## Change Log
- 2024-01-24: Initial process document created
- [Future dates]: Document updates as design progresses 