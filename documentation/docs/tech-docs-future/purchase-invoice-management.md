---
sidebar_position: 2
title: Batch Profitability
---

# Batch Profitability Module

## Core Question
**"How much profit did we make on each batch?"**

## Problem
Currently we track purchase costs (invoice amounts) but have no visibility on revenue or profit margins per batch. We don't know which suppliers or batches are actually profitable.

## Solution

### Pricing Configuration
Set selling prices by:
- **Model + Grade combination** (iPhone 13 Pro Grade A = $450, Grade B = $380, etc.)
- **Bulk update tools** for price adjustments across models
- **Historical pricing** to track price changes over time

### Profit Calculation
For each batch, automatically calculate:
- **Purchase cost**: Already tracked (invoice amount)
- **Repair costs**: Sum of parts used for devices in batch
- **Revenue**: Sum of selling prices when devices are sold
- **Profit margin**: Revenue - Purchase cost - Repair costs

### Profitability Dashboard
Simple view showing:
- Most/least profitable batches
- Profit margins by supplier
- Grade distribution impact on profitability
- Which device models generate highest margins

## Business Value
- Identify which suppliers to buy from
- Optimize purchase decisions based on actual profit data
- Understand true cost of refurbishment
- Price devices based on real margins, not guesswork

:::info MVP Scope
Start with basic price-per-model-grade and simple profit calculation. Advanced cost allocation and detailed analytics can come later.
:::