# Development Workflow Guide

Complete guide for implementing features from local development to production deployment.

## Table of Contents
- [Quick Reference](#quick-reference)
- [Development Process](#development-process)
- [Database Migrations](#database-migrations)
- [Environment Setup](#environment-setup)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Essential Commands

```bash
# Start local development
supabase start                                    # Start local Supabase
npm run dev                                       # Start Next.js

# Database operations
supabase migration new migration_name             # Create migration
supabase db reset                                 # Apply migrations locally
supabase db push --linked                         # Apply to production
supabase gen types typescript --local > types/supabase.ts  # Generate types

# Git workflow
git checkout -b feature/name                      # Create feature branch
git add . && git commit -m "message"              # Commit changes
git push -u origin feature/name                   # Push to GitHub
gh pr create                                      # Create pull request

# Utilities
supabase status                                   # Check service status
supabase stop                                     # Stop services
supabase db diff                                  # View schema changes
```

---

## Development Process

### Phase 1: Local Development

#### 1. Create Feature Branch
```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create feature branch (naming: feature/*, fix/*, refactor/*)
git checkout -b feature/event-management
```

#### 2. Start Local Services
```bash
# Terminal 1: Start local Supabase (if not running)
supabase start

# Terminal 2: Start Next.js dev server
npm run dev
```

**Your app**: `http://localhost:3000` (uses local Supabase)
**Studio**: `http://127.0.0.1:54323` (database GUI)
**Mailpit**: `http://127.0.0.1:54324` (email testing)

#### 3. Create Database Changes (if needed)

```bash
# Create migration file
supabase migration new add_events_table
```

Edit `supabase/migrations/XXXXXX_add_events_table.sql`:

```sql
-- Example: Create events table with RLS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS policy for multi-tenant isolation
CREATE POLICY "Users can view events from their church"
  ON events FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create events for their church"
  ON events FOR INSERT
  WITH CHECK (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Add indexes
CREATE INDEX events_church_id_idx ON events(church_id);
CREATE INDEX events_start_time_idx ON events(start_time);
```

#### 4. Apply Migration Locally

```bash
# Apply migration to local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

#### 5. Write Feature Code

Follow code standards from CLAUDE.md:
- Server Components by default
- Client Components only when needed (interactivity, hooks)
- TypeScript with strict typing
- Zod validation for forms/API inputs
- 2-space indentation

Example:
```typescript
// app/[church]/events/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'

export default async function EventsPage({ params }: { params: { church: string } }) {
  const supabase = createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', params.church)
    .order('start_time', { ascending: true })

  return <EventList events={events} />
}
```

#### 6. Test Locally

- **Functionality**: Test at `http://localhost:3000`
- **Emails**: Check Mailpit at `http://127.0.0.1:54324`
- **Database**: Inspect in Studio at `http://127.0.0.1:54323`
- **Types**: Run `npm run type-check` to verify TypeScript
- **Lint**: Run `npm run lint` to check code quality

---

### Phase 2: Push to GitHub (Triggers CI)

#### 7. Commit Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add event management feature

- Create events table with RLS policies
- Add events list page with server-side rendering
- Implement event creation form with validation
- Generate TypeScript types for events table

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push -u origin feature/event-management
```

#### 8. Automated CI Checks

GitHub Actions runs automatically (`.github/workflows/ci.yml`):
- ✅ **Type Check** (`npm run type-check`)
- ✅ **Lint** (`npm run lint`)
- ✅ **Build** (`npm run build`)

**All checks must pass** before merging (enforced by branch protection).

---

### Phase 3: Preview Deployment (Testing)

#### 9. Create Pull Request

```bash
# Using GitHub CLI
gh pr create --title "Add event management feature" --body "
## Summary
- Adds events table with multi-tenant RLS policies
- Implements event list page with SSR
- Adds event creation form with Zod validation

## Database Changes
- New table: \`events\`
- RLS policies for church isolation
- Indexes on \`church_id\` and \`start_time\`

## Test Plan
- [ ] Create event from dashboard
- [ ] View events list filtered by church
- [ ] Verify RLS isolation between churches
- [ ] Test form validation

🤖 Generated with [Claude Code](https://claude.com/claude-code)
"

# Or use GitHub UI
# Navigate to repository and click "Create Pull Request"
```

#### 10. Vercel Preview Deployment

Vercel automatically:
1. Builds your branch
2. Deploys to preview URL: `https://koinonia-git-feature-event-xyz.vercel.app`
3. Uses **production Supabase** database
4. Comments on PR with deployment URL

#### 11. Apply Migration to Production Database

**IMPORTANT**: Apply migration before testing preview!

```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push --linked

# Option 2: Manual (via Supabase Dashboard)
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy migration SQL from supabase/migrations/
# 3. Execute
```

#### 12. Test Preview Deployment

- Open preview URL from PR comment
- Test feature in production-like environment
- Verify database operations work correctly
- Check Vercel logs for errors
- Request code review from team members

---

### Phase 4: Production Deployment

#### 13. Merge Pull Request

Once CI passes and review approved:

```bash
# On GitHub, click "Squash and merge"
# This creates one clean commit on main
```

#### 14. Automatic Production Deployment

When merged to `main`:
1. **GitHub Actions** runs CI checks again
2. **Vercel** automatically deploys to production: `https://koinonia.vercel.app`
3. Goes live in ~2 minutes

#### 15. Verify Production

- Visit production URL
- Test new feature
- Monitor Vercel logs
- Check error tracking (if Sentry configured)

---

## Database Migrations

### Migration Best Practices

1. **One logical change per migration**
   - ✅ Good: One migration for `events` table
   - ❌ Bad: One migration for `events`, `volunteers`, and `ministries`

2. **Always include RLS policies**
   - Enable RLS on all tables: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
   - Add policies for multi-tenant isolation
   - Filter by `church_id` in policies

3. **Add indexes for common queries**
   - Index foreign keys
   - Index timestamp columns used in sorting/filtering
   - Index columns used in WHERE clauses

4. **Test locally before production**
   ```bash
   supabase db reset          # Apply all migrations
   supabase db diff           # Check what changed
   ```

5. **Make migrations reversible when possible**
   - Use `IF EXISTS` for drops
   - Document rollback steps if needed

### Migration Workflow

```bash
# 1. Create migration
supabase migration new add_feature

# 2. Write SQL in supabase/migrations/XXXXXX_add_feature.sql

# 3. Test locally
supabase db reset

# 4. Generate types
supabase gen types typescript --local > types/supabase.ts

# 5. Commit migration file
git add supabase/migrations/ types/supabase.ts
git commit -m "Add database migration for feature"

# 6. Apply to production (after PR created)
supabase db push --linked
```

---

## Environment Setup

### Local Environment

**File**: `.env.local`
```bash
# Local Supabase (for development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production Environment

**Vercel Dashboard** → Settings → Environment Variables:
```bash
# Production Supabase (from .env.local.example)
NEXT_PUBLIC_SUPABASE_URL=https://neuhbjoimwnvnhirtluh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=https://koinonia.vercel.app
```

### Environment Comparison

| Environment | Database | Code Source | URL | Usage |
|-------------|----------|-------------|-----|-------|
| **Local** | Local Supabase (Docker) | Your machine | localhost:3000 | Daily development |
| **Preview** | Production Supabase | Feature branch | preview-xyz.vercel.app | Testing PRs |
| **Production** | Production Supabase | main branch | koinonia.vercel.app | Live users |

---

## Common Commands

### Supabase Commands

```bash
# Service management
supabase start                        # Start all services
supabase stop                         # Stop all services
supabase status                       # Check service status

# Database operations
supabase db reset                     # Reset and apply all migrations
supabase db push --linked             # Push migrations to production
supabase db diff                      # Show schema differences
supabase db dump -f dump.sql          # Backup database

# Migrations
supabase migration new name           # Create new migration
supabase migration list               # List all migrations

# Type generation
supabase gen types typescript --local > types/supabase.ts  # Local
supabase gen types typescript --linked > types/supabase.ts # Production

# Linking
supabase link --project-ref YOUR_REF  # Link to production project
```

### Git Commands

```bash
# Branch management
git checkout main                     # Switch to main
git pull origin main                  # Update main
git checkout -b feature/name          # Create feature branch
git branch -d feature/name            # Delete local branch

# Committing
git status                            # Check changes
git add .                             # Stage all changes
git add file.ts                       # Stage specific file
git commit -m "message"               # Commit with message
git push -u origin feature/name       # Push and set upstream

# Pull requests
gh pr create                          # Create PR (GitHub CLI)
gh pr list                            # List PRs
gh pr view                            # View current PR
gh pr checkout 123                    # Checkout PR locally
```

### NPM Commands

```bash
# Development
npm run dev                           # Start dev server
npm run build                         # Build for production
npm run start                         # Start production server

# Code quality
npm run lint                          # Run ESLint
npm run type-check                    # Run TypeScript check

# Dependencies
npm install                           # Install dependencies
npm install package-name              # Add new package
npm uninstall package-name            # Remove package
```

---

## Troubleshooting

### Local Development Issues

#### Docker Not Running
```
Error: Cannot connect to Docker daemon
```
**Solution**: Start Docker Desktop and wait for it to fully start

#### Port Already in Use
```
Error: Port 54321 is already allocated
```
**Solution**:
```bash
supabase stop
# Or kill the process using the port
lsof -ti:54321 | xargs kill -9
supabase start
```

#### Migration Fails Locally
```
Error: relation "table_name" already exists
```
**Solution**:
```bash
# Reset database to clean state
supabase db reset

# If still fails, check migration SQL syntax
```

### GitHub Actions Issues

#### CI Checks Fail: Type Errors
**Solution**:
1. Run `npm run type-check` locally
2. Fix errors
3. Regenerate types: `supabase gen types typescript --local > types/supabase.ts`
4. Commit and push

#### CI Checks Fail: Lint Errors
**Solution**:
1. Run `npm run lint` locally
2. Fix errors
3. Commit and push

#### CI Checks Fail: Build Errors
**Solution**:
1. Run `npm run build` locally
2. Check for missing environment variables
3. Fix errors and push

### Vercel Deployment Issues

#### Preview Shows Old Code
**Solution**: Vercel caches builds
1. Go to Vercel Dashboard → Deployments
2. Find preview deployment
3. Click "Redeploy"

#### Environment Variables Missing
**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Add missing variables
3. Redeploy

#### Database Connection Fails
**Solution**:
1. Verify production Supabase credentials in Vercel
2. Check Supabase project is not paused
3. Verify RLS policies allow operations

### Database Migration Issues

#### Migration Fails in Production
```
Error: permission denied for table
```
**Solution**:
1. Check Supabase logs for details
2. Test migration locally first
3. Verify SQL syntax
4. Consider rolling back if needed

#### RLS Policies Block Operations
```
Error: new row violates row-level security policy
```
**Solution**:
1. Review RLS policies in migration
2. Test policies locally with different users
3. Ensure `church_id` is properly set
4. Check auth.uid() is accessible

#### Type Generation Errors
```
Error: Failed to generate types
```
**Solution**:
```bash
# Ensure database is running
supabase status

# Try local generation
supabase gen types typescript --local > types/supabase.ts

# Or production
supabase gen types typescript --linked > types/supabase.ts
```

---

## Best Practices Summary

### Code
- ✅ Use TypeScript everywhere
- ✅ Server Components by default
- ✅ Validate with Zod schemas
- ✅ Follow naming conventions (camelCase variables, PascalCase components)
- ✅ Keep components under 200-300 lines

### Git
- ✅ Always work on feature branches
- ✅ Write descriptive commit messages
- ✅ Commit logical changesets
- ✅ Push regularly to backup work
- ✅ Use "Squash and merge" for PRs

### Database
- ✅ Test migrations locally first
- ✅ Always include RLS policies
- ✅ Add indexes for performance
- ✅ Filter by `church_id` everywhere
- ✅ Generate types after schema changes

### Deployment
- ✅ Let CI checks complete
- ✅ Test preview deployments
- ✅ Apply migrations before testing
- ✅ Monitor production after deployment
- ✅ Keep environment variables in sync

---

## Quick Troubleshooting Checklist

When something breaks, check:

1. ✅ Is Docker running? (`supabase status`)
2. ✅ Are migrations applied? (`supabase db reset`)
3. ✅ Are types generated? (`supabase gen types...`)
4. ✅ Does it build locally? (`npm run build`)
5. ✅ Are environment variables set? (Check `.env.local` and Vercel)
6. ✅ Did CI checks pass? (Check GitHub Actions)
7. ✅ Are RLS policies correct? (Check Supabase Studio)

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions
- **Project Instructions**: See `CLAUDE.md` in repository root

---

**Last Updated**: 2025-11-21
