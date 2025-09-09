# Mobile Phone Refurbishment & Inventory Management System

An internal ERP system for managing the complete lifecycle of phone refurbishment operations.

## Overview

This system digitizes and streamlines the entire workflow for used phone refurbishment, tracking each phone from receipt through repair, grading, and shipping. It provides operational visibility for managers and clear, role-based interfaces for employees.

## Tech-Stack

- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui
- **State Management**: TanStack Query (React Query) for data fetching
- **Backend & Database**: Supabase (PostgreSQL, Auth, RLS)
- **Documentation**: Docusaurus for technical documentation
- **Package Manager**: npm

## Features

- **Batch Intake**: Track incoming phone batches from suppliers
- **Quality Control**: Systematic QC process tracking
- **Repair Management**: Assign and track repair jobs
- **Inventory Control**: Manage spare parts inventory
- **Shipping**: Generate shipping manifests
- **Role-Based Access**: Different interfaces for different user roles

## User Roles

1. **admin** - System administrator
2. **general_manager** - General managers with full business access
3. **ops_manager** - Operations managers handling intake and workflow
4. **qc_controller** - Quality control staff
5. **technician** - Repair technicians (L1, L2, L3)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd remobile-refurbish
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your Supabase credentials in `.env.local`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

6. View documentation (optional):
```bash
npm run docs:dev
```

Open [http://localhost:3000](http://localhost:3000) for the app or [http://localhost:3001](http://localhost:3001) for documentation.

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run docs:dev` - Start documentation server
- `npm run docs:build` - Build documentation

## Project Structure

```
.
├── src/                  # Application source code
│   ├── app/             # Next.js app router pages & routing
│   ├── modules/         # Feature-specific business logic
│   │   ├── batch-intake/    # Batch management module
│   │   ├── phone-tracking/  # Device tracking module
│   │   ├── repair-jobs/     # Repair management module
│   │   ├── inventory/       # Parts inventory module
│   │   └── shipping/        # Shipping module
│   ├── components/      # Shared React components
│   │   ├── ui/         # Basic UI components (shadcn/ui)
│   │   ├── layout/     # Site layout components
│   │   ├── common/     # Shared utilities
│   │   └── auth/       # Authentication components
│   ├── lib/             # Core utilities & services
│   │   ├── api/        # Database API layer
│   │   ├── hooks/      # Shared React Query hooks
│   │   ├── auth/       # RBAC & permissions
│   │   ├── actions/    # Server actions
│   │   ├── supabase/   # Database clients
│   │   └── providers/  # App providers (React Query, etc.)
│   ├── types/          # TypeScript definitions
│   ├── styles/         # Global styles
│   └── middleware.ts   # Authentication middleware
├── documentation/       # Docusaurus documentation site
│   └── docs/           # Technical documentation
│       ├── tech-docs-mvp/    # MVP specifications
│       └── tech-docs-future/ # Future features
└── schema.sql          # Database schema
```

## Contributing

This is an internal company system. Please follow the established coding standards and ensure all files remain under 700 lines for maintainability.

## License

Proprietary - Internal Use Only
