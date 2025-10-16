---
title: Multiple Device Selection for Technicians
---

# Multiple Device Selection for Technicians

Enable technicians to work with multiple devices in parallel, improving daily throughput and reducing back-and-forth at the shared computer.

## Implemented (Option 1a)

- Technicians can start multiple repair jobs without completing current ones.
- No UI changes required; they click "Start Repair" on multiple jobs.
- 15-device maximum per technician applies to prevent overload and protect quality.
- Permissions and status flow (pending → in_progress → completed) remain unchanged.

### Why this option
- Fastest to ship, minimal risk, zero training required.
- Solves the core bottleneck immediately.

## Alternatives (Future, shortened)

- Option 1b: Batch selection with checkboxes — select many rows and "Claim Selected Jobs"; clearer UX, moderate effort.
- Option 2: Device basket — add devices to a basket then "Start All"; better planning, higher effort.
- Option 3: Bulk assignment page — advanced filters and capacity limits; powerful but heavier to build.
- Option 4: Quick Claim mode — auto-assign next jobs up to a target count; keeps single-job flow, medium effort.


