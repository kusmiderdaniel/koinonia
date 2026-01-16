# Koinonia Codebase Action Plan

**Generated**: January 16, 2026
**Tech Debt Score**: 6.5/10
**Total Issues**: 200+

---

## Phase 1: Critical Security Fixes (Immediate)

### SEC-001: Fix Information Disclosure in Error Messages
- **File**: `app/api/calendar/public/[churchSubdomain]/[campusId]/route.ts:147`
- **Issue**: Error messages expose implementation details to clients
- **Fix**: Return generic error message instead of `error.message`
- **Effort**: 1 hour

### SEC-002: Strengthen Token Validation
- **File**: `app/api/invitation/respond/route.ts:26`
- **Issue**: Only 20-character minimum length validation
- **Fix**: Use 40+ character tokens, validate format, consider hashing stored tokens
- **Effort**: 2 hours

### SEC-003: Add church_id Filter to Form Export
- **File**: `app/api/forms/[id]/export/route.ts:59-84`
- **Issue**: Missing explicit church_id verification
- **Fix**: Add `.eq('church_id', profile.church_id)` to query
- **Effort**: 30 minutes

### SEC-004: Fix Link Click Tracking church_id Source
- **File**: `app/api/links/click/route.ts:32-40`
- **Issue**: church_id comes from request body, not authenticated user
- **Fix**: Get church_id from authenticated session
- **Effort**: 1 hour

### SEC-005: Validate File Extensions Properly
- **Files**:
  - `app/dashboard/links/actions.ts:404`
  - `app/dashboard/settings/actions/church.ts:227`
  - `app/dashboard/profile/actions.ts:129`
- **Issue**: File extension extracted from filename without validation
- **Fix**: Validate extension against allowlist and verify it matches MIME type
- **Effort**: 2 hours

### SEC-006: Secure File Path Extraction
- **File**: `app/dashboard/links/actions.ts:437-447`
- **Issue**: URL parsing vulnerable to path traversal
- **Fix**: Use `path.normalize()` and check for `..` sequences
- **Effort**: 1 hour

---

## Phase 2: High Priority Performance & Security (This Week)

### PERF-001: Add Pagination to People Page
- **File**: `app/dashboard/people/page.tsx:59-63`
- **Issue**: No pagination, fetches ALL members on every load
- **Fix**: Add `.limit(50).range(offset, offset+50)` and implement infinite scroll
- **Effort**: 4 hours

### PERF-002: Replace NotificationCenter Polling with Realtime
- **File**: `components/NotificationCenter.tsx:94-98`
- **Issue**: 30-second polling instead of Supabase Realtime
- **Fix**: Use `postgres_changes` subscription
- **Effort**: 4 hours

### SEC-007: Use Constant-Time Comparison for CRON_SECRET
- **Files**: All files in `app/api/cron/`
- **Issue**: String comparison vulnerable to timing attacks
- **Fix**: Use `crypto.timingSafeEqual()`
- **Effort**: 1 hour

### SEC-008: Add Explicit Auth Checks in Admin Actions
- **File**: `app/admin/users/actions.ts`
- **Issue**: Relies only on middleware for auth
- **Fix**: Add `getAuthenticatedUserWithProfile()` check with role verification
- **Effort**: 2 hours

---

## Phase 3: Dead Code Cleanup (This Week)

### CLEAN-001: Delete Orphaned PDF Library
- **File**: `lib/pdf/legal-document.ts`
- **Issue**: Never imported anywhere, makes jspdf dependency unused
- **Action**: Delete file, then remove `jspdf` from package.json
- **Savings**: ~40KB bundle size

### CLEAN-002: Delete Unused NotificationCenter
- **File**: `components/NotificationCenter.tsx`
- **Issue**: Component defined but never imported
- **Action**: Delete file
- **Savings**: ~300 lines

### CLEAN-003: Delete Unused UnavailabilityWidget
- **File**: `components/dashboard/UnavailabilityWidget.tsx`
- **Issue**: Never imported, functionality exists in availability page
- **Action**: Delete file
- **Savings**: ~280 lines

---

## Phase 4: Code Quality Improvements (2 Weeks)

### QUAL-001: Add aria-labels to Icon Buttons
- **Files**: Multiple throughout codebase (15+ buttons)
- **Issue**: Icon-only buttons lack accessibility labels
- **Fix**: Add `aria-label` prop to all icon buttons
- **Effort**: 2 hours

### QUAL-002: Add Zod Validation to API Routes
- **Files**:
  - `app/api/public-forms/[token]/route.ts`
  - `app/api/invitation/respond/route.ts`
- **Issue**: Unsafe type assertions, minimal input validation
- **Fix**: Implement Zod schemas for all API inputs
- **Effort**: 3 hours

### QUAL-003: Add Alt Text to Images
- **Files**: `app/dashboard/settings/components/ChurchDetailsTab.tsx` and others
- **Issue**: Images missing alt attributes
- **Fix**: Add descriptive alt text
- **Effort**: 1 hour

### QUAL-004: Extract Error Message Constants
- **Files**: 20+ action files with hardcoded strings
- **Issue**: 75+ hardcoded error messages
- **Fix**: Create `/lib/constants/error-messages.ts`
- **Effort**: 3 hours

### QUAL-005: Add Tests for Server Actions
- **Directory**: `__tests__/`
- **Issue**: Only 3 test files, 20+ server actions untested
- **Fix**: Add tests for auth, admin, and critical dashboard actions
- **Effort**: 16 hours

---

## Phase 5: Refactoring (1 Month)

### REFAC-001: Split Large Action Files
- **Files to split**:
  - `app/dashboard/profile/actions.ts` (632 lines) → profile-crud, avatar, preferences
  - `app/onboarding/actions.ts` (585 lines) → church-creation, profile-completion, consent
  - `app/dashboard/people/actions.ts` (536 lines) → role-management, member-status, member-crud
- **Effort**: 8 hours

### REFAC-002: Consolidate LeaderPicker Components
- **Files**: 3 versions in ministries, events, song-editor
- **Fix**: Create single reusable component with optional features
- **Effort**: 4 hours

### REFAC-003: Extract Shared Filter Logic
- **Files**:
  - `app/dashboard/people/filter-logic.ts`
  - `app/dashboard/tasks/filter-logic.ts`
- **Issue**: Duplicate `calculateAge()`, `evaluateRule()`, `getFieldValue()`
- **Fix**: Create `/lib/filters/filter-logic-helpers.ts`
- **Effort**: 6 hours

### REFAC-004: Standardize Dialog State Management
- **Issue**: 3 different patterns (manual state, generic hooks, custom hooks)
- **Fix**: Migrate all to generic `useDialogState`, `useConfirmDialog` hooks
- **Effort**: 4 hours

### REFAC-005: Create Generic FilterBuilder Component
- **Files**: `people/filter-builder.tsx`, `tasks/filter-builder.tsx`
- **Issue**: Near-identical implementations
- **Fix**: Create `GenericFilterBuilder` with entity-specific configs
- **Effort**: 6 hours

### REFAC-006: Extract Magic Numbers/Strings
- **Files**: Multiple
- **Items**:
  - Subdomain length limits → `/lib/constants/validation.ts`
  - Role hierarchy → `/lib/constants/roles.ts`
  - Date format regex → `/lib/validations/formats.ts`
- **Effort**: 2 hours

---

## Phase 6: Performance Optimization (Ongoing)

### PERF-003: Dynamic Import Recharts
- **File**: `app/dashboard/links/components/AnalyticsChart.tsx`
- **Issue**: ~100KB library imported directly
- **Fix**: Wrap in `dynamic()` import
- **Effort**: 30 minutes

### PERF-004: Add staleTime to TanStack Queries
- **Files**: Dashboard query hooks
- **Issue**: Default 0ms staleTime causes refetch on every focus
- **Fix**: Set `staleTime: 60000` (1 minute)
- **Effort**: 1 hour

### PERF-005: Add useCallback to EventDetailPanel Handlers
- **File**: `app/dashboard/events/EventsPageClient.tsx`
- **Issue**: 30+ handlers recreated on every render
- **Fix**: Wrap handlers in `useCallback()`
- **Effort**: 2 hours

### PERF-006: Change People Page to ISR
- **File**: `app/dashboard/people/page.tsx`
- **Issue**: `force-dynamic` prevents all caching
- **Fix**: Use `revalidate = 60` with client-side updates
- **Effort**: 1 hour

---

## Summary

| Phase | Tasks | Total Effort | Priority |
|-------|-------|--------------|----------|
| 1. Critical Security | 6 | ~8 hours | IMMEDIATE |
| 2. High Priority | 4 | ~11 hours | This Week |
| 3. Dead Code Cleanup | 3 | ~1 hour | This Week |
| 4. Code Quality | 5 | ~25 hours | 2 Weeks |
| 5. Refactoring | 6 | ~30 hours | 1 Month |
| 6. Performance | 4 | ~5 hours | Ongoing |

**Total Estimated Effort**: ~80 hours

---

## Expected Improvements

After completing all phases:
- **Tech Debt Score**: 6.5 → 8.5/10
- **Security**: All critical and high vulnerabilities resolved
- **Bundle Size**: -40KB (jspdf removal)
- **Dead Code Removed**: ~600 lines
- **Test Coverage**: From 3 test files to comprehensive coverage
- **Performance**: Pagination prevents timeouts, realtime reduces server load by 90%+
