# Mobile Phone Refurbishment & Inventory Management System

An internal ERP system for managing the complete lifecycle of phone refurbishment operations.

## Overview

This system digitizes and streamlines the entire workflow for used phone refurbishment, tracking each phone from receipt through repair, grading, and shipping. It provides operational visibility for managers and clear, role-based interfaces for employees.

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui
- **Backend & Database**: Supabase (PostgreSQL, Auth, RLS)
- **Package Manager**: npm

## Features

- **Batch Intake**: Track incoming phone batches from suppliers
- **Quality Control**: Systematic QC process tracking
- **Repair Management**: Assign and track repair jobs
- **Inventory Control**: Manage spare parts inventory
- **Shipping**: Generate shipping manifests
- **Role-Based Access**: Different interfaces for different user roles

## User Roles

1. **data_entry** - Data entry personnel
2. **qc_controller** - Quality control staff
3. **technician** - Repair technicians
4. **ops_manager** - Operations managers

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

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Layout components
│   └── common/      # Shared components
├── lib/             # Utility functions and types
└── types/           # TypeScript type definitions
```

## Contributing

This is an internal company system. Please follow the established coding standards and ensure all files remain under 700 lines for maintainability.

## License

Proprietary - Internal Use Only
