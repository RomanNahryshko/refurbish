---
sidebar_position: 1
title: Overview
---

# ReMobile Refurbish - MVP Overview

Welcome to the MVP documentation for the ReMobile Refurbish ERP system. This section provides a technical overview of the project's scope, goals, and core business processes.

## Project Overview

### Business Context
ReMobile Refurbish is an internal ERP system designed to manage the complete lifecycle of phone refurbishment operations, from batch intake through quality control and grading.

### Core Business Goals
- Streamline phone refurbishment workflow
- Track inventory and repair status in real-time
- Manage quality control processes
- Optimize repair job allocation
- Monitor business metrics and performance

## Main Refurbishment Workflow

1. **Intake & Triage**
   - Receiving batches of phones from suppliers
   - Dr. Phone scanning and data import
   - Manual fault review and modification
   - Label generation for physical identification

2. **Repair & Refurbishment**
   - Queue-based repair job assignment
   - Technician self-selection from available repairs
   - Parts tracking and usage recording
   - Digital job sheets for each device

3. **Final Quality Control & Grading**
   - Complete QC re-run after repairs
   - Grade assignment (Ungraded, A, B, C)
   - Loop back to repair if needed

## Grading System
- **Ungraded (UG)** - Initial state
- **A grade** - Best condition
- **B grade** - Good condition  
- **C grade** - Acceptable condition

## Core Modules

- **Batch Intake**: Managing incoming phone batches and Dr. Phone integration
- **Devices**: Central device tracking and digital job sheets
- **Repair Jobs**: Queue-based repair management with fixed task types
- **Inventory**: Spare parts tracking and supplier management
- **Admin & Reporting**: User management and operational KPIs

## Key Features

- Dr. Phone integration with manual fault modification
- Queue-based repair assignment (self-selection)
- Label generation and printing for physical identification
- Digital job sheets accessible by IMEI or Internal ID
- Manual QC processes with human judgment
- Basic invoice tracking for batch purchases

## Physical Operations

### Device Identification
Devices are identified through printed labels containing:
- Internal ID (8-digit system-generated)
- IMEI (15-digit unique identifier)
- Model Number and Serial Number

### Storage Organization
*Reference only - doesn't affect software:*
- Organized by Brand, Model, and Condition
- Labeled bins/shelves for different process stages
- Hand-off containers for station transfers

## User Roles Summary

- **General Manager**: Full system access, reporting and analytics
- **Operations Manager**: Batch intake, Final QC, repair job creation
- **Quality Control**: Post-repair QC, grading decisions
- **Technicians**: L1 (Housing), L2 (Glass), L3 (Battery + Others), Software Updates

Navigate through the sidebar to explore detailed specifications for each module. 