# Koinonia - Technical Specification Document v2.0

## Document Overview

**Version**: 2.0  
**Last Updated**: November 2024  
**Stack**: Option A - Supabase-Centered Architecture  
**Status**: Development Ready

## Executive Technical Summary

This document specifies the complete technical architecture for Koinonia, a multi-tenant church management SaaS platform. The architecture is optimized for:
- **Cost Efficiency**: $0 during development, $45-75/month at launch, $200-500/month at 50 churches
- **Rapid Development**: 90-day MVP timeline using integrated Supabase platform
- **Scalability**: Support 1-1000 churches on single architecture
- **Security**: Database-level multi-tenant isolation via Row-Level Security

## Technology Stack

### Frontend Stack

#### Core Framework
```json
{
  "framework": "Next.js 14.2+",
  "router": "App Router (app directory)",
  "language": "TypeScript 5.3+",
  "runtime": "Node.js 20 LTS"
}
```

**Why Next.js 14 App Router:**
- Server Components reduce client bundle size by 30-40%
- Streaming SSR improves perceived performance
- Built-in caching (4 layers) reduces database load
- Excellent Vercel integration for zero-config deployment
- Server Actions simplify form submissions

#### Styling & UI
```json
{
  "css": "Tailwind CSS 3.4+",
  "components": "shadcn/ui (Radix UI primitives)",
  "icons": "Lucide React",
  "fonts": "next/font with Inter variable font"
}
```

**Design System Approach:**
- shadcn/ui provides copy-paste components (no npm dependency bloat)
- Tailwind's utility-first keeps CSS bundle size minimal
- CSS variables for church-specific theme customization
- Mobile-first responsive design (min-width breakpoints)

#### State Management
```json
{
  "client": "Zustand 4.4+ for complex UI state",
  "server": "React Server Components + React Context",
  "forms": "React Hook Form 7.48+ with Zod validation",
  "async": "TanStack Query (React Query) 5+ for data fetching"
}
```

**State Architecture:**
- Server Components handle data fetching by default (no client-side waterfalls)
- Zustand stores for UI state (modals, filters, temporary selections)
- React Query for client-side mutations and optimistic updates
- React Context for theme and user preferences

#### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "typescript": "^5.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.294.0",
    "date-fns": "^3.0.0",
    "react-email": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  }
}
```

### Backend & Infrastructure

#### Hosting Platform
**Vercel**
- **Development**: Hobby tier (free, non-commercial)
- **Production**: Pro tier ($20/month)
- **Features Used**:
  - Automatic deployments from Git
  - Preview deployments for every PR
  - Edge Network for global low latency
  - Serverless Functions (Node.js 20)
  - Built-in analytics and Web Vitals monitoring

#### Database
**Supabase Postgres**
- **Development**: Free tier (500MB, 50K MAUs)
- **Production**: Pro tier ($25/month base)
- **Connection Details**:
  ```
  Direct: postgres://[user]:[password]@[host]:5432/postgres
  Pooler: postgres://[user]:[password]@[host]:6543/postgres?pgbouncer=true
  ```
- **Key Features Used**:
  - PostgreSQL 15+ (latest stable)
  - Row-Level Security for multi-tenancy
  - Full-text search (tsvector)
  - JSON/JSONB columns for flexible data
  - Automatic connection pooling (Supavisor)
  - Point-in-time recovery (PITR) backups

#### Authentication
**Supabase Auth**
- **Providers**:
  - Email/Password with email verification
  - Google OAuth 2.0
  - Magic Link (passwordless email)
- **Security Features**:
  - JWT tokens (signed with HMAC-SHA256)
  - MFA via TOTP (included in Pro)
  - Session management with automatic refresh
  - Configurable password policies
- **Integration**: Native RLS integration via `auth.uid()` function

#### File Storage
**Supabase Storage**
- **Included**: 100GB in Pro plan
- **Pricing**: $0.021/GB beyond 100GB
- **Features**:
  - Automatic image optimization and resizing
  - CDN-backed with edge caching
  - RLS policies for access control
  - Signed URLs with expiration
  - Upload resumability for large files
- **Buckets**:
  - `church-logos`: Public bucket for church branding
  - `user-avatars`: Public bucket for profile photos
  - `event-images`: Public bucket for event covers
  - `documents`: Private bucket for internal files

#### Real-time Features
**Supabase Realtime**
- **Included**: 5M messages, 500 concurrent connections in Pro
- **Channels**:
  - Database changes (Postgres CDC)
  - Presence tracking (who's online)
  - Broadcast messaging
- **Implementation**:
  ```typescript
  // Subscribe to event updates
  const channel = supabase
    .channel('events')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      (payload) => handleEventUpdate(payload)
    )
    .subscribe()
  ```

#### Caching Strategy
**Next.js Built-in Caching**
- **Data Cache**: Persistent cache for fetch requests
  ```typescript
  // Cache for 1 hour, revalidate in background
  fetch(url, { next: { revalidate: 3600 } })
  ```
- **Full Route Cache**: Pre-rendered pages cached at build time
- **Router Cache**: Client-side navigation cache
- **ISR (Incremental Static Regeneration)**:
  ```typescript
  // Church profile pages with 5-minute revalidation
  export const revalidate = 300
  ```

**Future: Upstash Redis (when needed at ~500 churches)**
- Session data and rate limiting
- Cross-request caching
- Real-time pub/sub

### Communication Services

#### Email Service
**AWS SES (Simple Email Service)**
- **Free Tier**: 3,000 emails/month (12 months for new accounts)
- **Pricing**: $0.10 per 1,000 emails after free tier
- **Setup Requirements**:
  - Domain verification (DNS records)
  - SPF record: `v=spf1 include:amazonses.com ~all`
  - DKIM signing (AWS provides keys)
  - DMARC policy: `v=DMARC1; p=quarantine; rua=mailto:dmarc@domain.com`
- **Rate Limits**: Start at 200 emails/day, request increase to 50,000/day
- **Bounce Handling**: SNS webhooks for bounces and complaints

**Email Templates with React Email**
```typescript
import { Html, Button } from '@react-email/components';

export function EventInvite({ eventName, churchName, acceptUrl }) {
  return (
    <Html>
      <h1>You're invited to {eventName}</h1>
      <p>{churchName} needs your help!</p>
      <Button href={acceptUrl}>I'm Available</Button>
    </Html>
  );
}
```

#### Push Notifications
**Firebase Cloud Messaging (FCM)**
- **Cost**: Free, unlimited
- **Platforms**: Web (PWA), iOS, Android
- **Implementation**:
  ```typescript
  // Initialize Firebase in Next.js
  import { initializeApp } from 'firebase/app';
  import { getMessaging, getToken } from 'firebase/messaging';
  
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  
  // Request permission and get token
  const token = await getToken(messaging, { 
    vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY 
  });
  ```
- **Server-side Sending**:
  ```typescript
  import admin from 'firebase-admin';
  
  admin.messaging().send({
    token: userToken,
    notification: {
      title: 'Schedule Updated',
      body: 'Your Sunday service time has changed'
    },
    data: { eventId: '123', type: 'schedule_change' }
  });
  ```

### Observability & Monitoring

#### Error Tracking
**Sentry**
- **Free Tier**: 5,000 events/month
- **Features**: Error grouping, source maps, user context
- **Integration**:
  ```typescript
  // next.config.js
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
    org: 'koinonia',
    project: 'church-saas'
  });
  ```

#### Analytics
**PostHog (Open Source Analytics)**
- **Free Tier**: 1M events/month
- **Features**: Session recording, feature flags, A/B testing
- **Privacy**: Self-hostable, GDPR compliant

#### Logging
**Supabase Logs**
- Database query logs
- API request logs
- Real-time subscription logs
- Custom application logs via `supabase.functions.invoke()`

#### Uptime Monitoring
**BetterStack (formerly Better Uptime)**
- **Free Tier**: 10 monitors, 1-minute checks
- **Alerts**: Email, Slack, webhook
- **Status Page**: Public status page for transparency

## Database Architecture

### Schema Design

#### Core Tables

**churches** (tenant table)
```sql
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- for subdomain
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'US',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_churches_slug ON churches(slug);
CREATE INDEX idx_churches_created_at ON churches(created_at);

-- RLS Policies
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own church
CREATE POLICY church_isolation ON churches
  FOR ALL
  USING (id = (SELECT church_id FROM profiles WHERE id = auth.uid()));
```

**profiles** (extends auth.users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'volunteer', -- super_admin, church_admin, leader, volunteer
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL, -- synced from auth.users
  phone VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[], -- array of skill tags
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(50),
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_profiles_church_id ON profiles(church_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills); -- for array search

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can see profiles in their church
CREATE POLICY profiles_isolation ON profiles
  FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Users can only update their own profile (except admins)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (id = auth.uid());
```

**ministries**
```sql
CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- for calendar color coding
  leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ministries_church_id ON ministries(church_id);
CREATE INDEX idx_ministries_leader_id ON ministries(leader_id);

-- RLS Policies
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ministries_isolation ON ministries
  FOR ALL
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));
```

**events**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- iCal RRULE format
  cover_image_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, completed, cancelled
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search column
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED
);

-- Indexes
CREATE INDEX idx_events_church_id ON events(church_id);
CREATE INDEX idx_events_ministry_id ON events(ministry_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_search ON events USING GIN(search_vector); -- full-text search

-- Composite index for common queries
CREATE INDEX idx_events_church_time ON events(church_id, start_time DESC);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_isolation ON events
  FOR ALL
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));
```

**volunteer_roles**
```sql
CREATE TABLE volunteer_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  required_count INTEGER NOT NULL DEFAULT 1, -- how many volunteers needed
  required_skills TEXT[], -- skills required for this role
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_volunteer_roles_event_id ON volunteer_roles(event_id);

-- RLS Policies (inherits from events)
ALTER TABLE volunteer_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_isolation ON volunteer_roles
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );
```

**volunteer_assignments**
```sql
CREATE TABLE volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES volunteer_roles(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'invited', -- invited, accepted, declined, confirmed, completed, no_show
  response_time TIMESTAMPTZ, -- when they accepted/declined
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role_id, volunteer_id) -- prevent duplicate assignments
);

-- Indexes
CREATE INDEX idx_assignments_role_id ON volunteer_assignments(role_id);
CREATE INDEX idx_assignments_volunteer_id ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_assignments_status ON volunteer_assignments(status);

-- RLS Policies
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignments_isolation ON volunteer_assignments
  FOR ALL
  USING (
    volunteer_id IN (
      SELECT id FROM profiles 
      WHERE church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );
```

**availability**
```sql
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_availability_volunteer_id ON availability(volunteer_id);
CREATE INDEX idx_availability_day ON availability(day_of_week);

-- RLS Policies
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY availability_isolation ON availability
  FOR ALL
  USING (
    volunteer_id IN (
      SELECT id FROM profiles 
      WHERE church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Volunteers can manage their own availability
CREATE POLICY availability_own ON availability
  FOR ALL
  USING (volunteer_id = auth.uid());
```

**songs** (for song bank)
```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  ccli_number VARCHAR(50),
  key VARCHAR(10), -- musical key (C, D, Em, etc.)
  tempo INTEGER, -- BPM
  time_signature VARCHAR(10), -- 4/4, 3/4, 6/8, etc.
  lyrics TEXT,
  chords TEXT,
  themes TEXT[], -- array of themes/tags
  copyright_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_songs_church_id ON songs(church_id);
CREATE INDEX idx_songs_ccli ON songs(ccli_number);
CREATE INDEX idx_songs_themes ON songs USING GIN(themes);

-- RLS Policies
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY songs_isolation ON songs
  FOR ALL
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));
```

**setlists**
```sql
CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  song_order JSONB NOT NULL, -- [{songId: "uuid", key: "D", notes: "intro only"}, ...]
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_setlists_event_id ON setlists(event_id);
CREATE INDEX idx_setlists_created_by ON setlists(created_by);

-- RLS Policies (inherits from events)
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY setlists_isolation ON setlists
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );
```

**push_tokens** (for FCM)
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type VARCHAR(50), -- web, ios, android
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY tokens_own ON push_tokens
  FOR ALL
  USING (user_id = auth.uid());
```

### Database Functions & Triggers

**Update updated_at timestamp automatically**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... repeat for other tables
```

**Sync auth.users email to profiles**
```sql
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();
```

**Create profile on user signup**
```sql
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, church_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'church_id',
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();
```

### Migration Strategy

**Use Supabase Migrations**
```bash
# Initialize migrations
supabase migration new initial_schema

# Create migration files in supabase/migrations/
# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

**Migration File Structure:**
```
supabase/
  migrations/
    20240101000000_initial_schema.sql
    20240102000000_add_songs_table.sql
    20240103000000_add_rls_policies.sql
  seed.sql (for development data)
```

## Multi-Tenant Implementation

### Row-Level Security Patterns

**Setting Church Context**
```typescript
// middleware.ts - Set tenant context for all requests
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    // Get user's church_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.church_id) {
      // Set Postgres session variable for RLS
      await supabase.rpc('set_church_context', { 
        church_uuid: profile.church_id 
      })
    }
  }
  
  return res
}
```

**Helper Function for Church Context**
```sql
-- Create function to set church context
CREATE OR REPLACE FUNCTION set_church_context(church_uuid UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_church', church_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Advanced RLS Policy with Context**
```sql
-- Policy that uses session variable
CREATE POLICY advanced_isolation ON events
  FOR ALL
  USING (
    church_id = COALESCE(
      current_setting('app.current_church', true)::uuid,
      (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );
```

### Tenant Subdomain Routing

**Middleware for Subdomain Detection**
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')
  const url = req.nextUrl
  
  // Extract subdomain
  const subdomain = hostname?.split('.')[0]
  
  // Skip for main domain and localhost
  if (subdomain === 'www' || subdomain === 'koinonia' || hostname?.includes('localhost')) {
    return NextResponse.next()
  }
  
  // Rewrite to /[church] route
  url.pathname = `/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}
```

**File Structure for Multi-tenant Pages**
```
app/
  (marketing)/          # Public marketing pages
    page.tsx
    about/
    pricing/
  [church]/             # Church-specific pages
    layout.tsx          # Fetch church data
    dashboard/
    events/
    volunteers/
  api/
    auth/
    webhooks/
```

## Authentication Implementation

### Supabase Auth Setup

**Initialize Supabase Client (Server-side)**
```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

**Initialize Supabase Client (Client-side)**
```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Authentication Flows

**Email/Password Signup**
```typescript
// app/auth/signup/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = createClient()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        church_id: formData.get('churchId') as string,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  }
  
  const { error } = await supabase.auth.signUp(data)
  
  if (error) {
    return { error: error.message }
  }
  
  redirect('/auth/verify-email')
}
```

**Google OAuth**
```typescript
// app/auth/google/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${requestUrl.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (data.url) {
    return NextResponse.redirect(data.url)
  }
  
  return NextResponse.redirect('/auth/error')
}
```

**Magic Link**
```typescript
// app/auth/magic-link/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendMagicLink(email: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}
```

**Auth Callback Handler**
```typescript
// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### Protected Routes

**Route Protection Middleware**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
  
  // Redirect logged-in users away from auth pages
  if (req.nextUrl.pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Session Management

**Get Current User (Server Component)**
```typescript
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, church:churches(*)')
    .eq('id', user.id)
    .single()
  
  return <div>Welcome {profile.first_name}!</div>
}
```

**Auth Context (Client Components)**
```typescript
// contexts/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

const AuthContext = createContext<{ user: User | null }>({ user: null })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

## Real-time Features

### Database Change Subscriptions

**Subscribe to Event Updates**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function EventList({ churchId }: { churchId: string }) {
  const [events, setEvents] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    // Initial fetch
    fetchEvents()
    
    // Subscribe to changes
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `church_id=eq.${churchId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents((current) => [...current, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setEvents((current) =>
              current.map((event) =>
                event.id === payload.new.id ? payload.new : event
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setEvents((current) =>
              current.filter((event) => event.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [churchId])
  
  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('church_id', churchId)
      .order('start_time', { ascending: true })
    
    setEvents(data || [])
  }
  
  return (
    <div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
```

### Presence Tracking

**Track Active Users**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: 'user_id' } },
    })
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state).map((key) => state[key][0])
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            })
          }
        }
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return (
    <div>
      {onlineUsers.length} users online
    </div>
  )
}
```

### Broadcast Messages

**Real-time Notifications**
```typescript
// Server action to send notification
'use server'

import { createClient } from '@/utils/supabase/server'

export async function notifyVolunteers(eventId: string, message: string) {
  const supabase = createClient()
  
  // Broadcast to event channel
  await supabase.channel(`event-${eventId}`).send({
    type: 'broadcast',
    event: 'notification',
    payload: { message, timestamp: new Date().toISOString() },
  })
}
```

```typescript
// Client component listening
'use client'

export function EventNotifications({ eventId }: { eventId: string }) {
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel(`event-${eventId}`)
      .on('broadcast', { event: 'notification' }, ({ payload }) => {
        toast.info(payload.message)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])
  
  return null // Just listens, doesn't render
}
```

## Email Implementation

### AWS SES Setup

**1. Domain Verification**
```bash
# Add TXT record to your domain DNS
Name: _amazonses.yourdomain.com
Value: [provided by AWS]
```

**2. DKIM Configuration**
```bash
# Add CNAME records provided by AWS
[token1]._domainkey.yourdomain.com -> [token1].dkim.amazonses.com
[token2]._domainkey.yourdomain.com -> [token2].dkim.amazonses.com
[token3]._domainkey.yourdomain.com -> [token3].dkim.amazonses.com
```

**3. SPF Record**
```bash
# Add TXT record
yourdomain.com
v=spf1 include:amazonses.com ~all
```

**4. DMARC Record**
```bash
# Add TXT record
_dmarc.yourdomain.com
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com
```

### Email Sending Implementation

**Create Email Service**
```typescript
// lib/email/ses-client.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text: string
}) {
  const command = new SendEmailCommand({
    Source: `Koinonia <noreply@yourdomain.com>`,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: html },
        Text: { Data: text },
      },
    },
  })
  
  try {
    const response = await sesClient.send(command)
    return { success: true, messageId: response.MessageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
```

**Email Templates with React Email**
```typescript
// emails/event-invitation.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface EventInvitationProps {
  volunteerName: string
  eventName: string
  eventDate: string
  eventTime: string
  churchName: string
  acceptUrl: string
  declineUrl: string
}

export default function EventInvitation({
  volunteerName,
  eventName,
  eventDate,
  eventTime,
  churchName,
  acceptUrl,
  declineUrl,
}: EventInvitationProps) {
  return (
    <Html>
      <Head />
      <Preview>{eventName} - You're invited to serve</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're invited!</Heading>
          <Text style={text}>Hi {volunteerName},</Text>
          <Text style={text}>
            {churchName} needs your help with {eventName}.
          </Text>
          <Section style={details}>
            <Text style={detailItem}>📅 {eventDate}</Text>
            <Text style={detailItem}>🕐 {eventTime}</Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={acceptButton} href={acceptUrl}>
              I'm Available
            </Button>
            <Button style={declineButton} href={declineUrl}>
              Can't Make It
            </Button>
          </Section>
          <Text style={footer}>
            You can update your availability anytime in your dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
}

const details = {
  margin: '24px 0',
}

const detailItem = {
  ...text,
  margin: '8px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const acceptButton = {
  backgroundColor: '#10b981',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '8px',
}

const declineButton = {
  ...acceptButton,
  backgroundColor: '#6b7280',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '32px',
}
```

**Send Email with Template**
```typescript
// lib/email/send-invitation.ts
import { render } from '@react-email/render'
import { sendEmail } from './ses-client'
import EventInvitation from '@/emails/event-invitation'

export async function sendEventInvitation({
  volunteer,
  event,
  church,
}: {
  volunteer: { email: string; first_name: string }
  event: { id: string; title: string; start_time: string }
  church: { name: string }
}) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/${event.id}/accept`
  const declineUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/${event.id}/decline`
  
  const html = render(
    EventInvitation({
      volunteerName: volunteer.first_name,
      eventName: event.title,
      eventDate: new Date(event.start_time).toLocaleDateString(),
      eventTime: new Date(event.start_time).toLocaleTimeString(),
      churchName: church.name,
      acceptUrl,
      declineUrl,
    })
  )
  
  const text = `Hi ${volunteer.first_name}, ${church.name} needs your help with ${event.title}...`
  
  return sendEmail({
    to: volunteer.email,
    subject: `${event.title} - You're invited to serve`,
    html,
    text,
  })
}
```

### Bounce and Complaint Handling

**Setup SNS Topic for SES Notifications**
```bash
# Create SNS topic
aws sns create-topic --name ses-notifications

# Subscribe webhook endpoint
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:ses-notifications \
  --protocol https \
  --notification-endpoint https://yourdomain.com/api/webhooks/ses
```

**Webhook Handler**
```typescript
// app/api/webhooks/ses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  
  // SNS subscription confirmation
  if (body.Type === 'SubscriptionConfirmation') {
    await fetch(body.SubscribeURL)
    return NextResponse.json({ success: true })
  }
  
  // Handle bounce or complaint
  if (body.Type === 'Notification') {
    const message = JSON.parse(body.Message)
    
    if (message.notificationType === 'Bounce') {
      const email = message.bounce.bouncedRecipients[0].emailAddress
      
      // Mark email as bounced in database
      await supabase
        .from('profiles')
        .update({ email_bounced: true, email_bounce_type: message.bounce.bounceType })
        .eq('email', email)
    }
    
    if (message.notificationType === 'Complaint') {
      const email = message.complaint.complainedRecipients[0].emailAddress
      
      // Mark as complained (spam report)
      await supabase
        .from('profiles')
        .update({ email_complained: true })
        .eq('email', email)
    }
  }
  
  return NextResponse.json({ success: true })
}
```

## Push Notifications

### Firebase Setup

**1. Create Firebase Project**
- Go to Firebase Console
- Create new project
- Enable Cloud Messaging

**2. Get Configuration**
```json
// firebase-config.json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```

**3. Generate VAPID Key**
```bash
# In Firebase Console: Project Settings > Cloud Messaging > Web Push certificates
# Generate key pair
```

### Client-side Implementation

**Service Worker**
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload)
  
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data,
  }
  
  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there's already a window open
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
```

**Request Permission and Get Token**
```typescript
// lib/push-notifications.ts
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { createClient } from '@/utils/supabase/client'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      
      // Save token to database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && token) {
        await supabase.from('push_tokens').upsert({
          user_id: user.id,
          token,
          device_type: 'web',
          last_used_at: new Date().toISOString(),
        })
      }
      
      return token
    }
    
    return null
  } catch (error) {
    console.error('Error getting notification permission:', error)
    return null
  }
}

export function setupForegroundMessageListener() {
  onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload)
    
    // Show in-app notification
    if (payload.notification) {
      new Notification(payload.notification.title!, {
        body: payload.notification.body,
        icon: '/icon-192x192.png',
      })
    }
  })
}
```

**Use in Component**
```typescript
'use client'

import { useEffect } from 'react'
import { requestNotificationPermission, setupForegroundMessageListener } from '@/lib/push-notifications'

export function NotificationSetup() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
    
    // Setup foreground message listener
    setupForegroundMessageListener()
  }, [])
  
  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission()
    if (token) {
      console.log('Notifications enabled, token:', token)
    }
  }
  
  return (
    <button onClick={handleEnableNotifications}>
      Enable Notifications
    </button>
  )
}
```

### Server-side Sending

**Send Push Notification**
```typescript
// lib/notifications/send-push.ts
import admin from 'firebase-admin'
import { createClient } from '@/utils/supabase/server'

// Initialize Firebase Admin (once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function sendPushNotification({
  userId,
  title,
  body,
  data,
}: {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
}) {
  const supabase = createClient()
  
  // Get user's push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
  
  if (!tokens || tokens.length === 0) {
    return { success: false, reason: 'No tokens found' }
  }
  
  const message = {
    notification: { title, body },
    data: data || {},
    tokens: tokens.map((t) => t.token),
  }
  
  try {
    const response = await admin.messaging().sendEachForMulticast(message)
    
    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx].token)
        }
      })
      
      // Remove invalid tokens from database
      if (failedTokens.length > 0) {
        await supabase
          .from('push_tokens')
          .delete()
          .in('token', failedTokens)
      }
    }
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return { success: false, error }
  }
}
```

**Usage in Server Actions**
```typescript
// app/events/[id]/actions.ts
'use server'

import { sendPushNotification } from '@/lib/notifications/send-push'
import { createClient } from '@/utils/supabase/server'

export async function notifyVolunteer(volunteerId: string, eventId: string) {
  const supabase = createClient()
  
  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('title, start_time')
    .eq('id', eventId)
    .single()
  
  if (!event) return
  
  // Send push notification
  await sendPushNotification({
    userId: volunteerId,
    title: 'Schedule Update',
    body: `Your ${event.title} event time has changed`,
    data: {
      eventId,
      type: 'schedule_change',
      url: `/events/${eventId}`,
    },
  })
}
```

## Performance Optimization

### Next.js Caching Strategies

**Static Generation with ISR**
```typescript
// app/[church]/events/page.tsx
export const revalidate = 300 // 5 minutes

export default async function EventsPage({ params }) {
  const events = await fetchEvents(params.church)
  
  return <EventList events={events} />
}
```

**Dynamic with Caching**
```typescript
// Fetch with cache control
const events = await fetch(`${API_URL}/events`, {
  next: { revalidate: 60 }, // Cache for 1 minute
})
```

**Cache Tag Invalidation**
```typescript
// Tag cached data
fetch(url, {
  next: { tags: ['events', `church-${churchId}`] }
})

// Invalidate on mutation
import { revalidateTag } from 'next/cache'

export async function updateEvent(id: string) {
  await supabase.from('events').update({...}).eq('id', id)
  revalidateTag('events')
}
```

### Database Query Optimization

**Use Proper Indexes**
```sql
-- Covering index for common query
CREATE INDEX idx_events_coverage ON events(church_id, start_time, status)
  INCLUDE (title, location);

-- Partial index for active events only
CREATE INDEX idx_active_events ON events(church_id, start_time)
  WHERE status != 'cancelled';
```

**Query Optimization Patterns**
```typescript
// Bad: N+1 query problem
const events = await supabase.from('events').select('*')
for (const event of events) {
  const volunteers = await supabase
    .from('volunteer_assignments')
    .select('*')
    .eq('event_id', event.id)
}

// Good: Single query with join
const events = await supabase
  .from('events')
  .select(`
    *,
    volunteer_assignments (
      *,
      volunteer:profiles (*)
    )
  `)
```

**Use Connection Pooling**
```typescript
// Always use pooled connection for serverless
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        // Use pooler (port 6543)
        'X-Connection-Mode': 'transaction',
      },
    },
  }
)
```

### Image Optimization

**Use Supabase Storage Transforms**
```typescript
// Get optimized image URL
const imageUrl = supabase.storage
  .from('event-images')
  .getPublicUrl('event-123.jpg', {
    transform: {
      width: 800,
      height: 600,
      resize: 'cover',
      format: 'webp',
      quality: 80,
    },
  })
```

**Use next/image**
```typescript
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="Event"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  loading="lazy"
/>
```

### Bundle Size Optimization

**Dynamic Imports for Heavy Components**
```typescript
import dynamic from 'next/dynamic'

const CalendarView = dynamic(() => import('@/components/calendar-view'), {
  loading: () => <LoadingSkeleton />,
  ssr: false, // Client-only if needed
})
```

**Tree Shaking**
```typescript
// Bad: Imports entire library
import _ from 'lodash'

// Good: Import only what you need
import debounce from 'lodash/debounce'
```

## Testing Strategy

### Unit Tests with Vitest

**Setup**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Test Example**
```typescript
// components/event-card.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventCard } from './event-card'

describe('EventCard', () => {
  it('renders event details correctly', () => {
    const event = {
      id: '1',
      title: 'Sunday Service',
      start_time: '2024-01-07T10:00:00Z',
      location: 'Main Sanctuary',
    }
    
    render(<EventCard event={event} />)
    
    expect(screen.getByText('Sunday Service')).toBeInTheDocument()
    expect(screen.getByText(/Main Sanctuary/)).toBeInTheDocument()
  })
})
```

### Integration Tests with Playwright

**Setup**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**E2E Test Example**
```typescript
// tests/e2e/event-creation.spec.ts
import { test, expect } from '@playwright/test'

test('create new event', async ({ page }) => {
  // Login
  await page.goto('/auth/signin')
  await page.fill('[name="email"]', 'leader@church.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Navigate to events
  await page.click('a[href="/events"]')
  await page.click('text=Create Event')
  
  // Fill form
  await page.fill('[name="title"]', 'Youth Group')
  await page.fill('[name="description"]', 'Weekly youth meeting')
  await page.fill('[name="start_time"]', '2024-01-07T19:00')
  
  // Submit
  await page.click('button[type="submit"]')
  
  // Verify creation
  await expect(page.locator('text=Youth Group')).toBeVisible()
})
```

### RLS Policy Testing

**Test Framework**
```sql
-- tests/database/rls-tests.sql
BEGIN;
SELECT plan(5);

-- Test church isolation
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-1-uuid';

-- User should only see their church's events
SELECT results_eq(
  'SELECT count(*)::int FROM events',
  ARRAY[3], -- Expected count for user-1's church
  'User can only see events from their church'
);

-- User should not be able to insert events for other churches
PREPARE insert_other_church AS
  INSERT INTO events (church_id, title, start_time, end_time, created_by)
  VALUES ('other-church-uuid', 'Hack Event', now(), now(), 'user-1-uuid');

SELECT throws_ok(
  'insert_other_church',
  'new row violates row-level security policy',
  'User cannot create events for other churches'
);

SELECT * FROM finish();
ROLLBACK;
```

## Deployment

### Environment Variables

**Required Variables**
```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Vercel Deployment

**Setup**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables
vercel env pull .env.local
```

**vercel.json Configuration**
```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Continuous Deployment**
- Push to `main` branch → Production deployment
- Push to any branch → Preview deployment
- Pull requests → Automatic preview URLs

### Database Migrations

**Pre-deployment Checklist**
```bash
# 1. Test migrations locally
supabase db reset
supabase db push

# 2. Run tests
npm run test

# 3. Create migration
supabase migration new your_migration_name

# 4. Apply to production
supabase db push --linked
```

## Monitoring & Alerting

### Error Tracking

**Sentry Integration**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

**Custom Error Tracking**
```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

export function trackMessage(message: string, level: 'info' | 'warning' | 'error') {
  Sentry.captureMessage(message, level)
}
```

### Performance Monitoring

**Web Vitals Tracking**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Health Checks

**API Health Endpoint**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createClient()
  
  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('churches')
      .select('count')
      .limit(1)
      .single()
    
    if (dbError) throw dbError
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        api: 'ok',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

## Security Best Practices

### Input Validation

**Zod Schemas**
```typescript
// lib/validations/event.ts
import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(5000).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().max(500).optional(),
  ministry_id: z.string().uuid().optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
```

**Usage in Server Actions**
```typescript
'use server'

import { createEventSchema } from '@/lib/validations/event'

export async function createEvent(formData: FormData) {
  // Validate input
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    location: formData.get('location'),
    ministry_id: formData.get('ministry_id'),
  }
  
  const validated = createEventSchema.safeParse(rawData)
  
  if (!validated.success) {
    return {
      error: 'Invalid input',
      details: validated.error.flatten(),
    }
  }
  
  // Proceed with database insert
  // ...
}
```

### Rate Limiting

**Middleware Rate Limiting**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }
  
  record.count++
  return { allowed: true, remaining: limit - record.count }
}

export function middleware(req: NextRequest) {
  // Rate limit API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const { allowed, remaining } = rateLimit(ip, 100, 60 * 1000) // 100 per minute
    
    if (!allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      })
    }
    
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return response
  }
  
  return NextResponse.next()
}
```

### Security Headers

**Next.js Config**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Cost Management

### Budget Alerts

**Supabase Usage Monitoring**
- Dashboard: Monitor database size, bandwidth, storage
- Set up alerts at 80% of quota
- Review weekly usage reports

**AWS Cost Alerts**
```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "SES-Monthly-Cost" \
  --alarm-description "Alert when SES costs exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

**Vercel Spend Management**
- Enable spending limits in Vercel dashboard
- Set budget notifications
- Monitor function execution time and invocations

### Optimization Checklist

**Weekly Reviews:**
- [ ] Check Supabase database size (optimize if >400MB on free tier)
- [ ] Review email sending volume (stay within SES free tier)
- [ ] Monitor Vercel bandwidth usage
- [ ] Check for unused Supabase Storage files

**Monthly Reviews:**
- [ ] Analyze most expensive queries (pg_stat_statements)
- [ ] Review and archive old events/data
- [ ] Optimize images (compress, convert to WebP)
- [ ] Review and remove unused indexes

**Before Scaling:**
- [ ] Set up Upstash Redis for caching
- [ ] Enable database read replicas if needed
- [ ] Consider CDN for static assets
- [ ] Review and optimize N+1 queries

## Appendix

### Useful Commands

**Development**
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm run test

# Database migrations
supabase migration new my_migration
supabase db reset
supabase db push
```

**Deployment**
```bash
# Deploy to Vercel
vercel --prod

# Run database migrations on production
supabase db push --linked

# Generate TypeScript types
supabase gen types typescript --linked > types/supabase.ts
```

**Monitoring**
```bash
# View Vercel logs
vercel logs

# View Supabase logs
supabase logs

# Check health endpoint
curl https://yourdomain.com/api/health
```

### Key Resources

**Documentation**
- Next.js App Router: https://nextjs.org/docs/app
- Supabase Documentation: https://supabase.com/docs
- Vercel Documentation: https://vercel.com/docs
- React Email: https://react.email/docs
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging

**Community**
- Next.js Discord: https://nextjs.org/discord
- Supabase Discord: https://discord.supabase.com
- GitHub Discussions: [Your repo]/discussions

### Migration from Original Stack

If you started with the Vercel + Neon stack:

**Database Migration**
1. Export Neon database: `pg_dump`
2. Create Supabase project
3. Import to Supabase: `psql < dump.sql`
4. Set up RLS policies
5. Update connection strings

**Auth Migration**
1. Export NextAuth users
2. Create Supabase Auth users via API
3. Update auth helpers throughout app
4. Test authentication flows

**Storage Migration**
1. Download files from Vercel Blob
2. Upload to Supabase Storage
3. Update file URLs in database
4. Test file access with RLS

**Timeline**: 2-3 days for full migration with testing
