# Performance Optimization Plan

**Created:** 2025-12-30
**Status:** In Progress

This document outlines the performance issues identified in the Koinonia codebase and the action plan to resolve them.

---

## Executive Summary

Performance analysis identified **15 key issues** across 5 categories:
- Data Fetching (40% of slowness)
- Rendering (25% of slowness)
- Network/Assets (20% of slowness)
- Bundle Size (15% of slowness)

---

## Critical Issues

### 1. Sequential Database Operations in Loops
**Severity:** Critical
**File:** `app/dashboard/events/actions/agenda.ts:122-133`

**Problem:** Each agenda reorder makes N database calls instead of 1:
```typescript
for (let i = 0; i < itemIds.length; i++) {
  await adminClient.from('event_agenda_items').update({ sort_order: i })...
}
```

**Solution:** Batch updates using `Promise.all()` or a single query with CASE statements.

---

### 2. Full Data Reload on Every Mutation
**Severity:** Critical
**Files:**
- `app/dashboard/ministries/hooks/useMinistryDetail.ts:95-146`
- `app/dashboard/events/hooks/useEventDetail.ts:115-145`

**Problem:** Every mutation (save role, add member, update field) triggers a full reload of 4+ queries.

**Solution:** Implement granular cache invalidation - only refetch the changed entity.

---

### 3. Missing Error Boundaries
**Severity:** Critical
**File:** `app/dashboard/page.tsx:28-34`

**Problem:** Dashboard crashes entirely if any data fetch fails. No `error.tsx` files in dashboard routes.

**Solution:** Add `error.tsx` to `/dashboard` and key sub-routes.

---

### 4. Three Fonts Loading Without `font-display: swap`
**Severity:** Critical
**File:** `app/layout.tsx:2-17`

**Problem:**
- Loading 3 fonts: Inter, Geist, Geist_Mono (~150KB)
- No `font-display: swap` causes Flash of Invisible Text (FOIT)
- Geist_Mono likely unnecessary

**Solution:**
```typescript
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'  // Add this
});
// Remove Geist_Mono unless needed for code blocks
```

---

## High Priority Issues

### 5. Data Fetching Waterfalls
**File:** `app/dashboard/people/page.tsx:44-96`

**Problem:** 3 sequential queries that could be parallel:
1. Pending registrations count
2. Church join code
3. Members data

**Solution:** Use `Promise.all()` for independent queries.

---

### 6. Non-Optimized `<img>` Tag
**File:** `app/dashboard/profile/page.tsx:229-233`

**Problem:**
```tsx
<img src={avatarUrl} alt="Profile photo" className="w-full h-full object-cover" />
```
- Missing width/height causes Cumulative Layout Shift (CLS)
- Not using Next.js Image optimization

**Solution:**
```tsx
import Image from 'next/image'

<Image
  src={avatarUrl}
  alt="Profile photo"
  width={96}
  height={96}
  className="w-full h-full object-cover"
/>
```

---

### 7. Multiple TooltipProvider Instances Per Row
**File:** `app/dashboard/people/members-table.tsx:171-212`

**Problem:** 6 separate TooltipProvider contexts created in table header.

**Solution:** Move single TooltipProvider to table-level wrapper.

---

### 8. Missing React.memo on List Items
**Files:**
- `app/dashboard/ministries/components/MemberRow.tsx`
- `app/dashboard/people/components/MemberRow.tsx`

**Problem:** All list items re-render when any parent state changes.

**Solution:** Wrap components with `React.memo()` and extract inline handlers to `useCallback`.

---

### 9. Aggressive `refetchOnWindowFocus`
**File:** `components/providers/QueryProvider.tsx:19`

**Problem:** Every tab switch triggers data refetch for all queries.

**Solution:** Set `refetchOnWindowFocus: false` as default, enable selectively for critical data.

---

### 10. Missing Pagination
**Files:**
- `app/dashboard/events/actions/event-crud.ts`
- `app/dashboard/ministries/actions/queries.ts`
- `app/dashboard/songs/actions/song-crud.ts`
- `app/dashboard/people/pending/actions.ts`

**Problem:** All list queries fetch entire dataset - memory issues with large churches.

**Solution:** Implement cursor-based or offset pagination.

---

## Medium Priority Issues

### 11. Large Components Need Splitting

| File | Lines | Action |
|------|-------|--------|
| `events/[id]/song-picker.tsx` | 733 | Split into sub-components |
| `events/event-dialog.tsx` | 549 | Extract dialog sections |
| `profile/page.tsx` | 518 | Extract form sections |
| `events/components/EventDetailPanel.tsx` | 512 | Split by concern |

---

### 12. Over-Fetching in Queries
**File:** `app/dashboard/events/actions/event-crud.ts:84-111`

**Problem:** Event query has 4 levels of nesting with `*` selectors.

**Solution:** Create separate queries:
1. Event detail (basic fields only)
2. Agenda items with relations
3. Positions with assignments
4. Invitations

---

### 13. Presentation Components as 'use client'
**Files:**
- `components/dashboard/UpcomingEventsWidget.tsx`
- `components/dashboard/MyAssignmentsWidget.tsx`
- `components/EmptyState.tsx`

**Problem:** Pure presentation components marked as client components.

**Solution:** Remove `'use client'` directive, convert to Server Components.

---

### 14. Unused Dependencies
**File:** `package.json`

| Package | Status | Action |
|---------|--------|--------|
| `tw-animate-css` | No references found | Remove |
| `@base-ui/react` | Not imported | Remove |
| `radix-ui` | Redundant | Replace with direct `@radix-ui/*` imports |

---

### 15. Inefficient Cache Invalidation
**Problem:** 103 occurrences of `revalidatePath()` with multiple sequential calls.

**Solution:** Create utility function to batch revalidations or use `revalidateTag()`.

---

## Implementation Timeline

### Week 1: Quick Wins
- [ ] Add `font-display: 'swap'` to fonts
- [ ] Remove Geist_Mono font
- [ ] Fix agenda.ts loop to batch updates
- [ ] Add `error.tsx` to dashboard routes
- [ ] Disable `refetchOnWindowFocus` by default
- [ ] Replace `<img>` with Next.js `Image` in profile page

### Week 2: Data Layer
- [ ] Parallelize people page queries with `Promise.all()`
- [ ] Implement granular cache invalidation for ministries
- [ ] Implement granular cache invalidation for events
- [ ] Add ISR to settings page
- [ ] Add pagination to events list
- [ ] Add pagination to songs list

### Week 3: Component Optimization
- [ ] Add `React.memo` to MemberRow components
- [ ] Move TooltipProvider to table-level wrapper
- [ ] Split song-picker.tsx into sub-components
- [ ] Split event-dialog.tsx into sub-components
- [ ] Convert presentation components to Server Components

### Week 4: Bundle Optimization
- [ ] Remove unused dependencies
- [ ] Replace `radix-ui` with direct imports
- [ ] Run bundle analysis and verify improvements
- [ ] Document final bundle size

---

## Verification Checklist

After completing optimizations, verify:

- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size reduced by target %
- [ ] No console errors in production
- [ ] All existing tests pass

---

## Files Reference

### Critical Files to Modify
```
app/layout.tsx                                    # Font optimization
app/dashboard/page.tsx                            # Error boundaries
app/dashboard/events/actions/agenda.ts            # Batch updates
app/dashboard/ministries/hooks/useMinistryDetail.ts  # Granular invalidation
app/dashboard/events/hooks/useEventDetail.ts      # Granular invalidation
```

### High Priority Files
```
app/dashboard/people/page.tsx                     # Parallel queries
app/dashboard/profile/page.tsx                    # Image optimization
app/dashboard/people/members-table.tsx            # TooltipProvider
app/dashboard/ministries/components/MemberRow.tsx # React.memo
app/dashboard/people/components/MemberRow.tsx     # React.memo
components/providers/QueryProvider.tsx            # Query defaults
```

### Medium Priority Files
```
app/dashboard/events/[id]/song-picker.tsx         # Split component
app/dashboard/events/event-dialog.tsx             # Split component
app/dashboard/events/actions/event-crud.ts        # Query optimization
components/dashboard/UpcomingEventsWidget.tsx     # Server Component
components/dashboard/MyAssignmentsWidget.tsx      # Server Component
package.json                                      # Remove unused deps
```

---

## Notes

- Always test changes locally before deploying
- Run `npm run build` to verify no type errors after changes
- Use `ANALYZE=true npm run build` to check bundle size impact
- Commit changes incrementally with clear messages
