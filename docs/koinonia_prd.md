# Koinonia - Product Requirements Document (PRD) v2.0

## Executive Summary

### Product Overview
**Koinonia** is a comprehensive multi-tenant SaaS platform designed to streamline church operations, volunteer management, and event coordination. The platform enables churches to efficiently manage their congregations, coordinate volunteers, and organize events while maintaining secure data isolation between different church organizations.

### Problem Statement
Churches currently struggle with fragmented systems for member management, volunteer coordination, and event planning. Most solutions are either too complex, too expensive, or lack the specific features churches need for effective ministry management. Key pain points include:
- Manual volunteer scheduling and coordination
- Lack of real-time communication with volunteers
- Difficulty tracking volunteer availability and commitments
- Poor integration between different church management functions
- High costs of existing enterprise solutions

### Vision Statement
To empower churches of all sizes with an intuitive, affordable, and comprehensive platform that simplifies administration, enhances volunteer engagement, and strengthens community connections through technology.

### Success Metrics
- **Primary**: 10+ churches onboarded within first 6 months
- **Engagement**: 75% monthly active user rate among registered volunteers
- **Retention**: 90% church retention rate after 6 months
- **Efficiency**: 40% reduction in administrative time for volunteer coordination
- **Cost**: <$50/month infrastructure costs during MVP phase

## Target Audience & User Personas

### Primary Personas

#### Church Administrator (Admin)
- **Role**: Senior pastor, executive pastor, or church administrator
- **Goals**: Streamline church operations, reduce administrative burden, improve member engagement
- **Pain Points**: Too much time on manual tasks, difficulty coordinating multiple ministries
- **Tech Comfort**: Moderate to advanced
- **Key Features**: Church setup, user management, analytics dashboard, ministry oversight

#### Ministry Leader (Leader)
- **Role**: Volunteer coordinators, ministry leaders, department heads
- **Goals**: Efficiently coordinate volunteers, ensure adequate staffing, improve communication
- **Pain Points**: Last-minute volunteer cancellations, difficulty tracking availability
- **Tech Comfort**: Basic to moderate
- **Key Features**: Event creation, volunteer scheduling, roster management, notifications

#### Church Volunteer (Volunteer)
- **Role**: Regular church attendees who serve in various capacities
- **Goals**: Easy sign-up for serving opportunities, clear communication, flexible scheduling
- **Pain Points**: Unclear expectations, poor communication, scheduling conflicts
- **Tech Comfort**: Basic to moderate
- **Key Features**: Event browsing, one-click RSVP, availability management, notifications

## Market Analysis

### Market Opportunity
- **Market Size**: $2.5B church management software market
- **Growth Rate**: 8.5% CAGR expected through 2028
- **Target Segment**: Small to medium churches (50-1000 members)
- **Addressable Market**: 250,000+ Protestant churches in US alone

### Competitive Analysis
- **Planning Center**: Comprehensive but expensive ($25+ per module/month)
- **ChurchTrac**: Traditional interface, limited modern features
- **Breeze**: Good UI but limited customization options
- **Our Differentiation**: Modern, affordable, volunteer-focused solution with real-time updates and intuitive mobile experience

## Core Features & Functional Requirements

### 1. Authentication & User Management
**Priority: P0 (Must Have)**

#### User Registration & Authentication
- Email/password registration with email verification
- Google OAuth integration for easier sign-up
- Magic link authentication for passwordless login
- Multi-factor authentication (TOTP) for admin accounts
- Password reset functionality with secure token validation
- Session management with automatic timeout

#### User Roles & Permissions
- **Super Admin**: Platform-wide access (internal use)
- **Church Admin**: Full church management capabilities
- **Leader**: Ministry-specific management permissions
- **Volunteer**: Personal profile and event participation access

#### Profile Management
- Personal information (name, email, phone, profile photo)
- Skills and ministry preferences
- Availability calendar and recurring patterns
- Contact preferences (email, push notifications)
- Emergency contact information

### 2. Multi-Tenant Church Management
**Priority: P0 (Must Have)**

#### Church Creation & Setup
- Church onboarding flow with guided setup wizard
- Church profile management (name, address, contact info, logo)
- Custom subdomain assignment (e.g., yourchurch.koinonia.app)
- Timezone configuration
- Branding customization (colors, logo)
- Data isolation and security between different church tenants

#### Invitation System
- Invite-based onboarding for church members
- Email invitation with magic link for instant signup
- Join request functionality with admin approval
- Bulk invitation capabilities via CSV import
- Custom invitation messages with church branding
- Invitation tracking and resend capabilities

#### Ministry Structure
- Create and manage ministry departments (Worship, Children's, Hospitality, etc.)
- Assign leaders to ministries
- Ministry-specific settings and permissions
- Ministry hierarchy and reporting structure

### 3. Role-Based Access Control
**Priority: P0 (Must Have)**

#### Permission Management
- Granular permissions for different user roles
- Ministry-specific role assignments
- Temporary role elevation for special events
- Permission inheritance through ministry hierarchy
- Audit logs for permission changes and sensitive actions

#### Access Levels
- **View Only**: See schedules and events
- **Contribute**: Sign up for events, update personal info
- **Manage**: Create events, manage volunteers in ministry
- **Administrate**: Full church configuration, user management

### 4. Event & Service Management
**Priority: P0 (Must Have)**

#### Event Creation & Templates
- Pre-built event templates (Sunday Service, Bible Study, Outreach, Special Events)
- Custom event creation with rich text descriptions
- Recurring event scheduling (daily, weekly, monthly patterns)
- Event categories and tags for organization
- Event visibility settings (public, ministry-specific, private)
- Event cover images and attachments

#### Event Details Configuration
- Date, time, and duration
- Location (physical address or virtual link)
- Required volunteer roles and quantities
- Volunteer skill requirements
- Setup and teardown time requirements
- Special instructions and notes
- Attendance capacity limits

#### Event Planning Dashboard
- Timeline view for event preparation
- Task checklists with assignments
- Resource allocation tracking
- Room booking and scheduling
- Volunteer coverage status with visual indicators
- Pre-event checklist completion tracking

### 5. Advanced Volunteer Scheduling System
**Priority: P0 (Must Have)**

#### Availability Management
- Personal availability calendar with grid view
- Recurring availability patterns (e.g., "every Sunday morning")
- Blackout dates for vacations and conflicts
- Availability override for specific dates
- Time preferences (morning, afternoon, evening)
- Maximum commitment limits per week/month

#### Volunteer Role Management
- Define volunteer roles with descriptions
- Skill requirements and certifications
- Role-specific training requirements
- Minimum and maximum volunteers per role
- Role templates for common positions

#### Intelligent Scheduling
- Suggest volunteers based on skills and availability
- Conflict detection across multiple events
- Fair distribution algorithms to prevent volunteer burnout
- Substitute finder for last-minute changes
- Waitlist management for oversubscribed events
- Auto-fill functionality for recurring events

#### Volunteer Response System
- One-click accept/decline functionality from email
- Detailed response tracking and status updates
- Response deadline reminders
- Automatic notifications for schedule changes
- Waitlist automatic promotion when spots open
- Decline reasons tracking for insights

### 6. Song Bank & Worship Planning
**Priority: P1 (Should Have)**

#### Song Database
- Centralized library of songs with metadata
- Store lyrics, chords, tempo, key, and themes
- Song authorship and copyright information
- CCLI song number integration
- Custom tagging and categorization
- Full-text search across lyrics and metadata
- Import songs from CCLI SongSelect

#### Setlist Management
- Drag-and-drop setlist creation
- Song arrangement with transitions
- Key transposition tools
- Tempo and time signature display
- Integration with event planning
- Export setlists to PDF for musicians
- Setlist templates and previous setlists library

### 7. Event Dashboard & Real-time Updates
**Priority: P0 (Must Have)**

#### Unified Event View
- Single-screen overview of all event details
- Real-time volunteer status updates with color coding
- Quick contact access for all participants
- Notes and special instructions section
- Attendance check-in functionality
- Last-minute change notifications
- Event completion checklist

#### Mobile-Responsive Design
- Native mobile app feel on all devices
- Touch-optimized controls and navigation
- Offline capability for essential functions (view schedules, check-in)
- Push notifications for urgent updates
- QR code check-in functionality
- Mobile camera access for event photos

### 8. Calendar Integration & Views
**Priority: P1 (Should Have)**

#### Multi-View Calendar
- Month, week, and day views with smooth transitions
- Color-coded events by ministry/category
- Personal and church-wide calendar toggle
- Filter by ministry, event type, or involvement status
- Export to external calendar applications (iCal format)
- Subscribe to personal schedule via calendar URL
- Sync with Google Calendar (read/write)

#### Calendar Features
- Drag-and-drop event rescheduling
- Conflict visualization
- Ministry calendar overlays
- Holiday and season markers
- Timezone conversion for multi-location churches

### 9. Communication & Notifications
**Priority: P0 (Must Have)**

#### Email Notifications
- Welcome emails for new users
- Event invitation and RSVP confirmations
- Schedule change notifications
- Reminder emails (24-48 hours before event)
- Weekly digest of upcoming commitments
- Ministry announcements and updates
- Customizable email templates with church branding

#### Push Notifications
- Real-time updates for schedule changes
- Last-minute volunteer needs
- Event check-in reminders
- Response to volunteer signup confirmations
- Important church-wide announcements
- Notification preferences and quiet hours
- In-app notification center with history

#### Communication Hub
- In-app messaging between leaders and volunteers
- Broadcast messages to ministry groups
- Event-specific comment threads
- Announcement board for church-wide updates
- Read receipts and delivery tracking

### 10. Analytics & Reporting
**Priority: P2 (Nice to Have)**

#### Volunteer Insights
- Volunteer participation rates and trends
- Service frequency and distribution
- No-show rates and reliability scores
- Popular time slots and roles
- Volunteer burnout risk indicators
- Skills gap analysis

#### Event Analytics
- Event attendance tracking
- Volunteer coverage success rates
- Response time metrics
- Event completion rates
- Popular event types and times
- Ministry engagement comparison

#### Church Health Dashboard
- Active user count and growth trends
- Ministry participation distribution
- Month-over-month comparison metrics
- Volunteer retention rates
- Key performance indicators overview

## Technical Architecture Overview

### Tech Stack (Option A: Supabase-Centered)

#### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with mobile-first approach
- **Components**: Shadcn/ui for consistent design system
- **State Management**: React Context + Zustand for complex state
- **Forms**: React Hook Form with Zod validation

#### Backend & Infrastructure
- **Hosting**: Vercel (free Hobby tier for development, Pro for production)
- **Database**: Supabase Postgres with Row-Level Security
- **Authentication**: Supabase Auth with Google OAuth and magic links
- **File Storage**: Supabase Storage with automatic CDN
- **Real-time**: Supabase Realtime for live updates
- **Caching**: Next.js built-in caching with ISR

#### Communication Services
- **Email**: AWS SES (free tier 3,000 emails/month, then $0.10/1k)
- **Push Notifications**: Firebase Cloud Messaging (free, unlimited)
- **Email Templates**: React Email for type-safe templates

#### Observability & Monitoring
- **Error Tracking**: Sentry (free tier for development)
- **Analytics**: PostHog (free tier) or Plausible
- **Logging**: Supabase Logs + Custom log drains
- **Uptime Monitoring**: BetterStack or UptimeRobot (free tier)

### Multi-Tenant Architecture

#### Data Isolation Strategy
- **Approach**: Single database with Row-Level Security (RLS)
- **Security**: PostgreSQL RLS policies on all tables
- **Tenant Identification**: church_id column on all tenant-specific tables
- **Access Control**: JWT claims include church_id, enforced at database level
- **File Organization**: Supabase Storage buckets organized by church_id

#### Scalability Considerations
- Horizontal scaling through Vercel Edge Network
- Database connection pooling via Supabase Supavisor
- CDN for static assets via Supabase Storage
- Database indexing on church_id and timestamp columns
- Lazy loading and pagination for large data sets
- ISR for mostly-static pages (church profiles, public pages)

### Security & Privacy

#### Data Protection
- End-to-end encryption for sensitive data at rest
- HTTPS/TLS for all data in transit
- Row-Level Security for tenant isolation
- Regular automated backups with point-in-time recovery
- GDPR and CCPA compliance measures
- Data retention and deletion policies

#### Access Control
- JWT tokens with signed payloads
- API endpoint protection via middleware
- Church-specific data isolation via RLS
- Audit logging for sensitive operations
- Rate limiting on public endpoints
- MFA requirement for admin accounts

## User Experience & Design Guidelines

### Design Principles
- **Simplicity**: Intuitive interfaces that don't require training
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Mobile-First**: Responsive design optimized for mobile devices
- **Consistency**: Unified design system across all features
- **Performance**: Sub-2 second page loads, optimistic UI updates

### Key User Flows

#### New User Onboarding
1. Receive email invitation with magic link
2. Click link → auto-create account and log in
3. Complete profile (name, photo, skills, availability)
4. Browse upcoming events for their ministries
5. Sign up for first event with one click

#### Event Creation Flow (Leader)
1. Click "Create Event" from dashboard
2. Select template or start from scratch
3. Fill in basic details (date, time, location)
4. Add required volunteer roles and quantities
5. Set notification preferences
6. Preview and publish
7. System automatically notifies eligible volunteers

#### Volunteer Sign-up Flow
1. Receive email notification about event
2. Click "I'm Available" button in email
3. View event details and requirements
4. Confirm availability (one click)
5. Receive confirmation and calendar invite
6. Add to personal calendar automatically

## Project Roadmap & Timeline

### Phase 1: MVP Foundation (Months 1-3)
**Goal**: Core functionality for 10 pilot churches

- Week 1-2: Database schema design, Supabase project setup, RLS policies
- Week 3-4: Authentication system with Supabase Auth (email, Google, magic links)
- Week 5-6: Church creation and invitation system
- Week 7-8: Basic event creation and volunteer role management
- Week 9-10: Volunteer scheduling and availability system
- Week 11-12: Email notifications via AWS SES, testing with pilot churches

**Deliverables**: Working MVP with core scheduling features

### Phase 2: Enhanced Features (Months 4-6)
**Goal**: Production-ready with improved UX

- Month 4: Push notifications via FCM, mobile-responsive improvements
- Month 5: Real-time dashboard updates, calendar views and integrations
- Month 6: Song bank and worship planning module, analytics dashboard

**Deliverables**: Feature-complete platform ready for broader launch

### Phase 3: Growth & Optimization (Months 7-9)
**Goal**: Scale to 50+ churches

- Month 7: Advanced scheduling algorithms, volunteer insights
- Month 8: Custom branding per church, advanced permissions
- Month 9: API for third-party integrations, performance optimization

**Deliverables**: Scalable platform with enterprise features

### Phase 4: Scale & Polish (Months 10-12)
**Goal**: Production-hardened system

- Month 10: Advanced reporting and analytics
- Month 11: Mobile app wrapper (optional), offline capabilities
- Month 12: Enterprise security features, compliance certifications

**Deliverables**: Production-scale platform supporting 100+ churches

## Testing & Quality Assurance

### Testing Strategy
- **Unit Tests**: Vitest for component and function testing (80%+ coverage)
- **Integration Tests**: Playwright for end-to-end workflows
- **Database Tests**: Supabase RLS policy testing
- **Load Testing**: Artillery for performance under load
- **Security Testing**: Regular security audits, dependency scanning

### Quality Gates
- All RLS policies tested with multiple tenant scenarios
- 80%+ code coverage on critical paths
- Zero critical security vulnerabilities
- Performance metrics within targets (LCP < 2.5s)
- Accessibility scan passing (WCAG AA)
- User acceptance testing with pilot churches

### Performance Targets
- **Page Load**: < 2 seconds (LCP)
- **Real-time Updates**: < 500ms latency
- **Database Queries**: < 100ms for common operations
- **Availability**: 99.9% uptime target
- **Error Rate**: < 0.1% of requests

## Risk Assessment & Mitigation

### Technical Risks

**Risk**: Supabase free tier limitations during development
- **Impact**: Medium
- **Mitigation**: Monitor database size, use compression, implement data archival strategy
- **Fallback**: Upgrade to Pro tier ($25/month) when approaching limits

**Risk**: Real-time sync performance at scale
- **Impact**: Medium
- **Mitigation**: Implement efficient RLS policies, use connection pooling, optimize queries
- **Fallback**: Implement polling fallback for unreliable connections

**Risk**: Email deliverability issues with AWS SES
- **Impact**: High
- **Mitigation**: Proper SPF/DKIM/DMARC setup, warm up sending gradually, monitor bounce rates
- **Fallback**: Switch to Resend or Postmark if deliverability < 90%

**Risk**: Mobile browser compatibility issues
- **Impact**: Medium
- **Mitigation**: Progressive enhancement, extensive mobile testing, polyfills for older browsers
- **Fallback**: Graceful degradation for unsupported features

### Business Risks

**Risk**: Slow church adoption rate
- **Impact**: High
- **Mitigation**: Focus on pilot churches, gather feedback, iterate rapidly
- **Strategy**: Partner with 5-10 pilot churches for extensive beta testing

**Risk**: Competition from established players
- **Impact**: Medium
- **Mitigation**: Focus on underserved segment (small churches), superior UX, lower pricing
- **Differentiation**: Modern tech stack, mobile-first, real-time updates

**Risk**: Church budget constraints
- **Impact**: High
- **Mitigation**: Keep infrastructure costs low, offer generous free tier, flexible pricing
- **Pricing Strategy**: Free for churches < 50 members, $30-50/month for mid-size

**Risk**: Data privacy and compliance concerns
- **Impact**: High
- **Mitigation**: Implement GDPR/CCPA compliance from day one, transparent privacy policy
- **Compliance**: Regular security audits, data processing agreements, right to deletion

### Operational Risks

**Risk**: Support burden as user base grows
- **Impact**: Medium
- **Mitigation**: Comprehensive documentation, in-app help, video tutorials
- **Strategy**: Build self-service support center, community forum

**Risk**: Infrastructure cost overruns
- **Impact**: Medium
- **Mitigation**: Set up cost alerts, monitor usage weekly, optimize aggressively
- **Monitoring**: Supabase dashboard alerts, AWS billing alerts, PostHog usage tracking

## Success Criteria & KPIs

### Technical KPIs
- **Uptime**: 99.9% availability
- **Performance**: 95% of pages load in < 2 seconds
- **Real-time Sync**: < 500ms update latency
- **Security**: Zero critical vulnerabilities
- **Database**: < 100ms query response time (p95)

### Business KPIs
- **Adoption**: 10 churches in first 6 months, 50 churches in 12 months
- **Revenue**: $500 MRR by month 6, $3,000 MRR by month 12
- **Retention**: 90%+ church retention after 6 months
- **Satisfaction**: 4.5+ average rating from church admins

### User Engagement KPIs
- **Active Users**: 70%+ monthly active users among registered volunteers
- **Response Rate**: 60%+ volunteer response rate to event invitations
- **Staffing Success**: 80%+ events fully staffed before deadline
- **Time Savings**: 40% reduction in scheduling administrative time

### Feature Adoption KPIs
- **Profile Completion**: 80%+ users complete full profile
- **Availability Setup**: 60%+ volunteers set recurring availability
- **Calendar Integration**: 40%+ users export calendar
- **Mobile Usage**: 50%+ sessions from mobile devices

## Pricing Strategy

### Free Tier (Limited)
- Up to 50 active users
- Unlimited events
- Email notifications (100/month limit)
- Basic analytics
- Community support

**Target**: Very small churches, trial period for larger churches

### Starter Plan ($29/month)
- Up to 200 active users
- Unlimited events
- Unlimited email notifications
- Push notifications
- Standard analytics
- Email support

**Target**: Small to medium churches (50-200 members)

### Growth Plan ($79/month)
- Up to 1,000 active users
- Advanced scheduling features
- Custom branding
- Advanced analytics
- Calendar integrations
- Priority email support

**Target**: Growing churches (200-1000 members)

### Enterprise Plan (Custom)
- Unlimited users
- White-label options
- API access
- SSO integration
- Dedicated support
- SLA guarantees

**Target**: Large churches, church networks, denominations

## Launch Strategy

### Pre-Launch (Months 1-3)
- Build MVP with core features
- Recruit 5 pilot churches for testing
- Gather feedback and iterate
- Create onboarding documentation

### Soft Launch (Months 4-6)
- Onboard 10-15 beta churches
- Refine features based on feedback
- Build case studies and testimonials
- Develop marketing materials

### Public Launch (Month 7+)
- Open registration to public
- Content marketing and SEO
- Social media presence
- Partnerships with church networks
- Referral program for churches

## Appendix

### Glossary
- **Church**: A tenant organization using the platform
- **Ministry**: A department within a church (e.g., Worship, Children's)
- **Event**: Any church gathering requiring volunteer coordination
- **Role**: A specific volunteer position within an event (e.g., Greeter, Sound Tech)
- **MAU**: Monthly Active User
- **RLS**: Row-Level Security (database security feature)
- **MFA**: Multi-Factor Authentication

### Technical References
- Supabase Row-Level Security Documentation
- Next.js App Router Best Practices
- AWS SES Deliverability Best Practices
- Firebase Cloud Messaging Integration Guide
- WCAG 2.1 Accessibility Guidelines

### Competitive Analysis Resources
- Planning Center Services Review
- ChurchTrac Feature Comparison
- Breeze ChMS User Feedback
- Church Management Software Market Research 2024
