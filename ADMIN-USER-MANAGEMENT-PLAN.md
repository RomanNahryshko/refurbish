# Admin-Only User Management Implementation Plan

## 🎯 **Overview**
Convert the current public sign-up system to an admin-controlled user creation system for the internal ERP.

## ⚠️ **Implementation Process**
**IMPORTANT**: This implementation follows a phase-by-phase approach. After completing each phase, approval is required before proceeding to the next phase.

## 📋 **Implementation Tasks**

### **Phase 1: Remove Public Sign-up**
- [x] **Task 1.1**: Delete `/src/app/(auth)/signup/` folder and page
- [x] **Task 1.2**: Remove signup route from middleware protection
- [x] **Task 1.3**: Remove signup links from login page
- [x] **Task 1.4**: Update navigation components to remove signup references
- [x] **Task 1.5**: Update auth actions to remove signup function

### **Phase 2: Create Admin User Management Structure**
- [x] **Task 2.1**: Create `/src/app/admin/users/` folder structure
- [x] **Task 2.2**: Create user list page (`users/page.tsx`)
- [x] **Task 2.3**: Create user creation page (`users/create/page.tsx`)
- [x] **Task 2.4**: Create user edit page (`users/[id]/page.tsx`)
- [x] **Task 2.5**: Update admin dashboard to include user management links

### **Phase 3: Implement User Management API**
- [x] **Task 3.1**: Create `src/lib/api/users.ts` with admin functions
- [x] **Task 3.2**: Add user creation function using Supabase Admin API
- [x] **Task 3.3**: Add user listing/search functions
- [x] **Task 3.4**: Add user update functions (role, status, password reset)
- [x] **Task 3.5**: Create React Query hooks for user management

### **Phase 4: Build User Management Components**
- [x] **Task 4.1**: Create `UserList` component with table and search
- [x] **Task 4.2**: Create `CreateUserForm` component
- [x] **Task 4.3**: Create `EditUserForm` component
- [x] **Task 4.4**: Create user action buttons (edit, disable, reset password)
- [x] **Task 4.5**: Add role selection dropdown component

### **Phase 5: Security & Password Management**
- [x] **Task 5.1**: Implement temporary password generation
- [x] **Task 5.2**: Add "must_change_password" flag to user profiles
- [x] **Task 5.3**: Create force password change flow for first login
- [x] **Task 5.4**: Add RBAC check - only ops_manager can manage users
- [x] **Task 5.5**: Implement user disable/enable functionality

### **Phase 6: Enhancements & Polish**
- [ ] **Task 6.1**: Add user activity audit trail
- [ ] **Task 6.2**: Create user management documentation

## 🔧 **Technical Details**

### **New File Structure**
```
src/app/admin/
├── page.tsx                    # Admin dashboard  
└── users/
    ├── page.tsx               # User list and management
    ├── create/
    │   └── page.tsx          # Create new user form
    └── [id]/
        └── page.tsx          # Edit existing user

src/modules/admin/
├── components/
│   ├── user-list.tsx
│   ├── create-user-form.tsx
│   ├── edit-user-form.tsx
│   └── user-actions.tsx
├── hooks/
│   └── use-users.ts
└── types/
    └── user-management.ts

src/lib/api/
└── users.ts                  # Admin user management API
```

### **Database Changes Needed**
```sql
-- Add to user_profiles table
ALTER TABLE user_profiles ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE user_profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE user_profiles ADD COLUMN last_login TIMESTAMPTZ;

-- Create user activity audit table
CREATE TABLE user_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Security Considerations**
- Only `ops_manager` role can access user management
- Use Supabase Admin API (service role key) for user creation
- Implement strong temporary password generation
- Force password change on first login
- Audit all user management actions

### **User Creation Flow**
1. Admin accesses `/admin/users/create`
2. Admin fills form: email, full name, role
3. System generates secure temporary password
4. User account created with `must_change_password: true`
5. Admin can share credentials with user
6. User logs in and is forced to change password

### **Task Updates**
*Update this section after completing each task with date and notes*

- 2024-12-19, Phase 1: Public sign-up removed completely (signup folder, middleware, login links, auth functions, types, constants)
- 2024-12-19, Phase 2: Admin structure created (/admin routes, user management pages, navigation updates, RBAC protection)
- 2024-12-19, Phase 3: User Management API implemented (admin client, user CRUD operations, React Query hooks, password management)
- 2024-12-19, Phase 4: User Management UI completed (UserList, CreateUserForm, EditUserForm, UserActions, RoleSelector, forms with validation)
- 2024-12-19, Phase 5: Security & Password Management completed (force password change flow, RBAC protection for all API routes, enhanced security)