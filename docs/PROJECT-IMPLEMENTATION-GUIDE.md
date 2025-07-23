# Refurbishment & Inventory Management System - Implementation Guide

## Project Overview

### Project Name
**Mobile Phone Refurbishment & Inventory Management System** (Internal ERP)

### Project Goal
Digitize and streamline the entire workflow for used phone refurbishment, tracking each phone from receipt through repair, grading, and shipping. This is an **internal ERP system** designed to provide operational visibility for managers and clear, role-based interfaces for employees.

### Business Process
The company buys used phones, performs quality control checks, repairs them if necessary (e.g., changing batteries, screens), assigns a final grade (A, B, C), and then packs and ships them. The system must manage inventory for both phones and spare parts.

### Tech Stack
- **Frontend Framework**: Next.js 15 (or the latest stable release)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend & Database**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: TBD

---

## Technical Specifications

### Core Requirements
- App Router (not Pages Router)
- TypeScript for all files
- Tailwind CSS with custom configuration
- Role-Based Access Control (RBAC)
- Real-time updates
- Responsive design

### User Roles
1. **data_entry** - Data entry personnel
2. **qc_controller** - Quality control staff
3. **technician** - Repair technicians
4. **ops_manager** - Operations managers

### Phone Status Workflow
1. Received
2. In QC
3. Awaiting Repair
4. In Repair
5. Final QC
6. Graded
7. Shipped

---

## Implementation TODO List

### Phase 1: Project Initialization & Setup

#### 1. Project Creation
- [ ] Create new Next.js project with TypeScript
  ```bash
  npx create-next-app@latest saas-framework --typescript --tailwind --eslint --app --src-dir --import-alias
  ```
- [ ] Verify App Router is configured
- [ ] Confirm TypeScript configuration
- [ ] Verify Tailwind CSS setup

#### 2. Git Setup
- [ ] Initialize git repository
- [ ] Create comprehensive .gitignore file
- [ ] Make initial commit with message: "Initial project setup with Next.js 15, TypeScript, and Tailwind"
- [ ] Create README.md

#### 3. Environment Configuration
- [ ] Create `.env.local.example` file with placeholders:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```
- [ ] Create `.env.local` file (add to .gitignore)
- [ ] Configure environment validation

### Phase 2: Core Configuration

#### 4. Configuration Files Setup
- [ ] Configure `tailwind.config.ts`:
  - [ ] Add custom colors for branding (primary, secondary, accent)
  - [ ] Set up responsive breakpoints
  - [ ] Configure dark mode support
- [ ] Create `prettier.config.js`:
  - [ ] Add tailwindcss plugin for class sorting
  - [ ] Configure formatting rules
- [ ] Update `next.config.js`:
  - [ ] Optimize for production
  - [ ] Set up proper headers
  - [ ] Configure redirects
- [ ] Configure ESLint rules for consistent code style

#### 5. shadcn/ui Integration
- [ ] Initialize shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Configure components.json for consistent theming
- [ ] Install essential components:
  - [ ] button
  - [ ] card
  - [ ] input
  - [ ] label
  - [ ] form
  - [ ] dropdown-menu
  - [ ] navigation-menu
  - [ ] sheet
  - [ ] dialog
  - [ ] avatar
- [ ] Set up proper import aliases for components

### Phase 3: Project Structure Implementation

#### 6. Folder Structure Creation
- [ ] Create complete folder structure (with modular component architecture):
  ```
  src/
  ├── app/
  │   ├── globals.css
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── (auth)/
  │   │   ├── login/
  │   │   │   └── page.tsx
  │   │   └── signup/
  │   │       └── page.tsx
  │   └── dashboard/
  │       ├── page.tsx
  │       ├── batch-intake/
  │       │   └── page.tsx
  │       ├── phone-tracking/
  │       │   └── page.tsx
  │       ├── repair-jobs/
  │       │   └── page.tsx
  │       ├── inventory/
  │       │   └── page.tsx
  │       ├── shipping/
  │       │   └── page.tsx
  │       └── admin/
  │           └── page.tsx
  ├── components/
  │   ├── ui/
  │   ├── layout/
  │   │   ├── header.tsx
  │   │   ├── footer.tsx
  │   │   └── navigation.tsx
  │   └── common/
  │       ├── loading-spinner.tsx
  │       └── theme-toggle.tsx
  ├── lib/
  │   ├── utils.ts
  │   ├── constants.ts
  │   └── types.ts
  ├── styles/
  │   └── globals.css
  └── types/
      ├── auth.ts
      └── subscription.ts
  ```

#### 7. Create Placeholder Pages
- [ ] Dashboard main page with module cards
- [ ] Batch Intake page (`<h1>Batch Intake</h1>`)
- [ ] Phone Tracking page (`<h1>Phone Tracking</h1>`)
- [ ] Repair Jobs page (`<h1>Repair Jobs</h1>`)
- [ ] Inventory page (`<h1>Inventory</h1>`)
- [ ] Shipping page (`<h1>Shipping</h1>`)
- [ ] Admin page (`<h1>Admin Dashboard</h1>`)

### Phase 4: Backend & Database Setup

#### 8. Supabase Integration
- [ ] Install Supabase dependencies:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [ ] Create Supabase client configuration
- [ ] Set up server-side Supabase client
- [ ] Configure client-side Supabase client
- [ ] Test connection to Supabase

#### 9. Database Schema Implementation
- [ ] Create `schema.sql` file in project root
- [ ] Add custom types:
  - [ ] `phone_status` enum
  - [ ] `user_role` enum
- [ ] Create core tables:
  - [ ] `batches` table
  - [ ] `phones` table
  - [ ] `spare_parts` table
  - [ ] `user_profiles` table
- [ ] Run schema in Supabase
- [ ] Verify table creation
The following Schema is a first version and definetely will be correctly re-created or updated with a full and correct DB design.

### Phase 5: Authentication & Authorization

#### 10. Authentication Setup
- [ ] Create authentication middleware (`middleware.ts`)
- [ ] Implement route protection
- [ ] Create login page with:
  - [ ] Email/password form
  - [ ] Supabase Auth integration
  - [ ] Error handling
- [ ] Create signup page with:
  - [ ] Registration form
  - [ ] Role selection
  - [ ] Profile creation
- [ ] Implement logout functionality
- [ ] Add session management

#### 11. Role-Based Access Control (RBAC)
- [ ] Create RLS policies for each table
- [ ] Implement role checking utilities
- [ ] Create role-based route guards
- [ ] Test access control for each role:
  - [ ] data_entry access
  - [ ] qc_controller access
  - [ ] technician access
  - [ ] ops_manager access

### Phase 6: Core Components Development

#### 12. Layout Components
- [ ] Header component:
  - [ ] Logo placement (any placeholder for now)
  - [ ] Navigation menu
  - [ ] User avatar/profile dropdown
  - [ ] Auth status indicator
- [ ] Footer component:
  - [ ] Company information
  - [ ] Navigation links
  - [ ] Social media links
- [ ] Navigation component:
  - [ ] Desktop navigation
  - [ ] Mobile responsive menu (using Sheet)
  - [ ] Role-based menu items

#### 13. Common Components
- [ ] Loading spinner component
- [ ] Theme light/dark mode toggle/selector (using next-themes)
- [ ] Error boundary component
- [ ] Toast/notification component
- [ ] Confirmation dialog component

### Phase 7: TypeScript & Type Safety

#### 14. Type Definitions
- [ ] Create auth types in `types/auth.ts`:
  - [ ] User interface
  - [ ] Session interface
  - [ ] Role types
- [ ] Create business types in `lib/types.ts`:
  - [ ] Phone interface
  - [ ] Batch interface
  - [ ] SparePart interface
  - [ ] RepairJob interface
- [ ] Create API response types
- [ ] Create form validation schemas

### Phase 8: Styling & Theming

#### 15. Theme Configuration
- [ ] Set up CSS variables for:
  - [ ] Brand colors (primary, secondary, accent)
  - [ ] Status colors (success, warning, error)
  - [ ] Neutral colors
- [ ] Configure dark mode support
- [ ] Create consistent spacing system
- [ ] Set up typography scale

#### 16. Responsive Design
- [ ] Implement mobile-first breakpoints
- [ ] Test all pages on mobile devices
- [ ] Ensure touch-friendly interfaces
- [ ] Optimize for tablet views

### Phase 9: Development Workflow

#### 17. Scripts & Automation
- [ ] Add development scripts to `package.json`:
  - [ ] `dev`: Development server
  - [ ] `build`: Production build
  - [ ] `start`: Production server
  - [ ] `lint`: ESLint checking
  - [ ] `format`: Prettier formatting
  - [ ] `type-check`: TypeScript validation
- [ ] Create pre-commit hooks
- [ ] Set up GitHub Actions workflow for CI/CD

### Phase 10: Documentation

#### 18. Documentation
- [ ] Complete README.md
- [ ] Document component usage
- [ ] Create architecture decision records (ADRs)

---

## Future Implementation Phases (Not in Current Scope)

### Phase 11: Feature Modules
- Batch Intake Module
- Phone Tracking System (IMEI-based)
- Repair Job Management
- Inventory Management
- Shipping Manifest Generator
- Real-time Dashboard

### Phase 12: Advanced Features
- Barcode/QR code scanning
- Photo capture for phone condition
- Automated grading system
- Analytics and reporting
- Export functionality
- API for external integrations

---

## Notes

- Each checkbox represents a discrete task that can be completed independently
- Tasks should be completed in order within each phase
- Some phases can be worked on in parallel
- Mark tasks as complete by replacing `[ ]` with `[x]`
- Add subtasks as needed for complex implementations
- Document any deviations or additional requirements discovered during implementation
- **Code Organization**: When implementing features, ensure files stay within 300-700 lines by breaking down into smaller, focused components
- **Internal System**: This is an internal ERP system, not a SaaS product - no landing pages or marketing components needed

---

## Development Guidelines

1. **Code Quality**: Follow TypeScript best practices and maintain type safety
2. **Component Design**: Keep components small, focused, and reusable
3. **File Size Limits**: 
   - **CRITICAL**: No file should exceed 700 lines of code
   - Ideal file size: 300-500 lines
   - Split large modules into smaller, reusable components
   - This ensures maintainability and easier debugging
4. **State Management**: Use React Server Components where possible
5. **Performance**: Optimize for Core Web Vitals
6. **Accessibility**: Follow WCAG 2.1 AA standards
7. **Security**: Implement proper authentication and authorization at all levels

---

Last Updated: [Date will be added when implementation begins] 