# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Koinonia is a multi-tenant SaaS platform for church operations, volunteer management, and event coordination. Built with Next.js 14+ App Router, Supabase (Postgres + Auth + Storage + Realtime), and TypeScript.

**Key Architecture Principles:**
- Multi-tenant with Row-Level Security (RLS) for data isolation
- Each church tenant isolated via `church_id` on all tables
- Subdomain routing per church (e.g., yourchurch.koinonia.app)
- Server Components by default, Client Components only when needed

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript 5.3+, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **State Management**: Zustand (UI state), TanStack Query (server state)
- **Hosting**: Vercel
- **Email**: AWS SES with React Email templates
- **Push Notifications**: Firebase Cloud Messaging (FCM)

## Git Workflow Requirements

**CRITICAL: All significant changes MUST be pushed to git.**

1. **Feature Branch Strategy**: Each feature must be created on a separate branch
   - Branch naming: `feature/feature-name`, `fix/bug-name`, `refactor/scope-name`
   - Never commit directly to `main`
   - Create PR for review before merging

2. **Commit Guidelines**:
   - Write clear, descriptive commit messages
   - Commit frequently with logical changesets
   - Push changes regularly to backup work

## Code Standards

### TypeScript Requirements

- **Use TypeScript everywhere** - No JavaScript files
- Strict type checking enabled
- Define interfaces/types for all data structures
- Use Zod schemas for runtime validation (forms, API inputs)

### Naming Conventions

- **Variables, functions, properties**: `camelCase`
  ```typescript
  const eventList = []
  const fetchUserData = async () => {}
  ```

- **Components, types, interfaces**: `PascalCase`
  ```typescript
  export function EventCard() {}
  interface UserProfile {}
  type EventStatus = 'draft' | 'published'
  ```

- **Files**:
  - Components: `PascalCase.tsx` (e.g., `EventCard.tsx`)
  - Utilities: `kebab-case.ts` (e.g., `date-utils.ts`)
  - Server Actions: `actions.ts`

### Code Style

- **Indentation**: 2 spaces (no tabs)
- **Functional components with hooks only** - No class components
- **Create reusable components**: Extract forms, dialogs, modals, inputs as reusable components
- **Refactor into smaller components** when files exceed 200-300 lines
- **Performance-first mindset**: Always consider bundle size and runtime performance

### Component Architecture

```typescript
// Prefer this pattern
'use client' // Only when needed (interactivity, hooks, browser APIs)

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface EventCardProps {
  event: Event
  onRSVP: (eventId: string) => void
}

export function EventCard({ event, onRSVP }: EventCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div>
      <h3>{event.title}</h3>
      <Button onClick={() => onRSVP(event.id)}>RSVP</Button>
    </div>
  )
}
```

## Architecture Overview

### Multi-Tenant Data Isolation

All tenant-scoped tables include `church_id` with RLS policies:

```sql
-- Example RLS policy pattern
CREATE POLICY isolation_policy ON table_name
  FOR ALL
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));
```

**Critical**: Always filter by `church_id` in queries. RLS is the primary security layer.

### Directory Structure (Planned)

```
/app                      # Next.js App Router
  /(marketing)           # Public pages (landing, pricing)
  /[church]              # Church-specific pages (subdomain routing)
    /dashboard
    /events
    /volunteers
  /api                   # API routes and webhooks
  /auth                  # Authentication flows

/components
  /ui                    # shadcn/ui components (button, dialog, etc.)
  /forms                 # Reusable form components
  /...                   # Feature-specific components

/lib
  /supabase             # Supabase client utilities
  /email                # Email sending logic (AWS SES)
  /notifications        # Push notification logic (FCM)
  /validations          # Zod schemas for input validation

/types                   # TypeScript types and interfaces
/emails                  # React Email templates
/supabase
  /migrations           # Database migrations
```

### Data Flow Pattern

1. **Server Components** (default): Fetch data directly, no client-side waterfalls
   ```typescript
   // app/[church]/events/page.tsx
   import { createClient } from '@/lib/supabase/server'

   export default async function EventsPage({ params }) {
     const supabase = createClient()
     const { data: events } = await supabase
       .from('events')
       .select('*')
       .eq('church_id', params.church)

     return <EventList events={events} />
   }
   ```

2. **Client Components**: Use for interactivity, real-time updates, browser APIs
   ```typescript
   'use client'

   export function EventList({ events }) {
     // Real-time subscription for live updates
     useEffect(() => {
       const channel = supabase
         .channel('events')
         .on('postgres_changes', { ... }, handleUpdate)
         .subscribe()
       return () => supabase.removeChannel(channel)
     }, [])
   }
   ```

3. **Server Actions**: For mutations (create, update, delete)
   ```typescript
   'use server'

   import { revalidatePath } from 'next/cache'

   export async function createEvent(formData: FormData) {
     const supabase = createClient()
     // Validate with Zod
     // Insert to database
     revalidatePath('/events')
   }
   ```

### Authentication Pattern

```typescript
// Server Component - check auth
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  // Fetch user's profile with church context
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, church:churches(*)')
    .eq('id', user.id)
    .single()
}
```

### Performance Optimization Guidelines

1. **Bundle Size**:
   - Use dynamic imports for heavy components: `dynamic(() => import('./HeavyComponent'))`
   - Import only what's needed: `import debounce from 'lodash/debounce'` not `import _ from 'lodash'`

2. **Caching**:
   - Use ISR for mostly-static pages: `export const revalidate = 300`
   - Tag cache for targeted invalidation: `fetch(url, { next: { tags: ['events'] } })`

3. **Database**:
   - Always use connection pooler (port 6543) for serverless functions
   - Avoid N+1 queries - use joins/selects with Supabase
   - Add indexes on `church_id` and timestamp columns

4. **Images**:
   - Use `next/image` with proper sizing
   - Use Supabase Storage transforms for optimization
   - Convert to WebP when possible

## Database Migrations

```bash
# Create new migration
supabase migration new migration_name

# Apply locally
supabase db reset
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts

# Apply to production
supabase db push --linked
```

## Real-time Features

Supabase Realtime is used for live updates. Pattern:

```typescript
'use client'

useEffect(() => {
  const channel = supabase
    .channel('channel-name')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events',
      filter: `church_id=eq.${churchId}`
    }, (payload) => {
      // Handle INSERT, UPDATE, DELETE
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [churchId])
```

## Email & Notifications

- **Email**: AWS SES with React Email templates in `/emails`
- **Push**: Firebase Cloud Messaging (FCM) with service worker
- Store FCM tokens in `push_tokens` table
- Send via Firebase Admin SDK from server actions

## Key Database Tables

- `churches` - Tenant organizations
- `profiles` - User profiles (extends auth.users, includes church_id)
- `ministries` - Departments within churches
- `events` - Church events with full-text search
- `volunteer_roles` - Positions needed per event
- `volunteer_assignments` - Sign-ups with status tracking
- `availability` - Volunteer availability schedules
- `songs` + `setlists` - Worship planning

## Development Phases

**Current Phase**: Pre-development (documentation complete, ready to build)

**Phase 1 MVP** (Months 1-3):
1. Database schema + RLS policies
2. Authentication (email/password, Google OAuth, magic links)
3. Church creation + invitation system
4. Basic event + volunteer management
5. Email notifications

**Phase 2** (Months 4-6): Push notifications, real-time updates, calendar integrations, song bank

## Common Patterns

### Form Validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema } from '@/lib/validations/event'

const form = useForm({
  resolver: zodResolver(eventSchema),
})
```

### Error Handling
```typescript
try {
  const { data, error } = await supabase.from('events').insert(...)
  if (error) throw error
} catch (error) {
  // Log to Sentry
  // Show user-friendly message
}
```

### Reusable Components Priority

Always create reusable components for:
- Form inputs (text, select, date, time)
- Dialogs and modals
- Buttons with loading states
- Cards and list items
- Data tables with sorting/filtering
- Empty states and loading skeletons

## Security Checklist

- [ ] All queries filtered by `church_id` (RLS enforces but double-check)
- [ ] Input validated with Zod schemas
- [ ] File uploads restricted by size and type
- [ ] Rate limiting on public endpoints
- [ ] Sensitive operations logged for audit trail
- [ ] No secrets in client-side code
