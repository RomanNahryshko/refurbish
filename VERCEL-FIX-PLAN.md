# Vercel Deployment Error Fix Plan

## 🎯 **Overview**
This plan outlines the steps to resolve all ESLint errors and warnings that are currently blocking the Vercel deployment.

## 📋 **Implementation Tasks**

### **Phase 1: Fix Unused Variables & Imports (High Priority)**
*   [ ] **Task 1.1**: Clean up `src/app/change-password/page.tsx`
    *   Remove unused `userProfile` variable.
*   [ ] **Task 1.2**: Clean up `src/components/auth/login-form.tsx`
    *   Remove unused `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`, and `LoadingSpinner` imports.
    *   Remove unused `router` variable.
*   [ ] **Task 1.3**: Clean up `src/components/layout/footer.tsx`
    *   Remove unused `loading` variable.
*   [ ] **Task 1.4**: Clean up `src/components/layout/header.tsx`
    *   Remove unused `AvatarImage` and `logout` imports.
    *   Remove unused `loading` variable.
*   [ ] **Task 1.5**: Clean up `src/lib/api/users.ts`
    *   Remove unused `User` and `UserAudit` imports.
    *   Remove unused `data` variable.
*   [ ] **Task 1.6**: Clean up `src/lib/auth/server-rbac.ts`
    *   Remove unused `cookiesToSet` variable.
*   [ ] **Task 1.7**: Clean up `src/lib/hooks/use-users.ts`
    *   Remove unused `usersApi` import.
*   [ ] **Task 1.8**: Clean up `src/lib/supabase/middleware.ts`
    *   Remove unused `error` variable.
*   [ ] **Task 1.9**: Clean up `src/modules/admin/components/create-user-form.tsx`
    *   Remove unused `Label`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, and `SelectValue` imports.
*   [ ] **Task 1.10**: Clean up `src/modules/admin/components/edit-user-form.tsx`
    *   Remove unused `useResetUserPassword` import.
*   [ ] **Task 1.11**: Clean up `src/modules/admin/components/user-actions.tsx`
    *   Remove unused `error` variables.

### **Phase 2: Fix React-Specific Errors**
*   [ ] **Task 2.1**: Fix unescaped apostrophes in `src/modules/admin/components/create-user-form.tsx`.
*   [ ] **Task 2.2**: Fix unescaped apostrophes in `src/modules/admin/components/edit-user-form.tsx`.

### **Phase 3: Address `any` Type Warnings (Code Quality)**
*   [ ] **Task 3.1**: Add specific types in `src/app/change-password/page.tsx`.
*   [ ] **Task 3.2**: Add specific types in `src/components/examples/user-management-example.tsx`.
*   [ ] **Task 3.3**: Add specific types in `src/components/layout/header.tsx`.
*   [ ] **Task 3.4**: Add specific types in `src/lib/api/users.ts`.
*   [ ] **Task 3.5**: Add specific types in `src/lib/auth/server-rbac.ts`.
*   [ ] **Task 3.6**: Add specific types in `src/lib/hooks/use-phones.ts`.
*   [ ] **Task 3.7**: Add specific types in `src/lib/hooks/use-toast.ts`.
*   [ ] **Task 3.8**: Add specific types in `src/lib/supabase/client.ts`.
*   [ ] **Task 3.9**: Add specific types in `src/lib/supabase/server.ts`.
*   [ ] **Task 3.10**: Add specific types in `src/lib/supabase.ts`.
*   [ ] **Task 3.11**: Add specific types in `src/modules/admin/components/edit-user-form.tsx`.
*   [ ] **Task 3.12**: Add specific types in `src/modules/admin/components/user-actions.tsx`.
*   [ ] **Task 3.13**: Add specific types in `src/modules/admin/components/user-list.tsx`.

### **Phase 4: Final Validation**
*   [ ] **Task 4.1**: Run `npx eslint src --ext .ts,.tsx --max-warnings 0` to confirm all issues are resolved.

---
## 📝 **Change Log**

*This section will be updated as each task is completed.*
