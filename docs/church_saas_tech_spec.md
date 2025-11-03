# Church SaaS - Technical Specification Document

## Overview

This document provides detailed technical specifications for building ChurchConnect, a multi-tenant SaaS platform for church volunteer management and event coordination.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Firebase Auth  │    │   Firestore     │
│   (Frontend)    │◄──►│  (Auth Service) │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Vercel Hosting  │    │Firebase Functions│   │Firebase Storage │
│   (Deployment)  │    │ (Server Logic)  │    │ (File Storage)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Tenant Data Model

#### Firestore Collection Structure
```
/churches/{churchId}/
  ├── profile/
  ├── members/{memberId}/
  ├── events/{eventId}/
  ├── roles/{roleId}/
  ├── schedules/{scheduleId}/
  ├── songs/{songId}/
  └── notifications/{notificationId}/

/users/{userId}/
  ├── profile/
  ├── churchMemberships/
  └── preferences/
```

## Data Models

### Core Entities

#### Church Model
```typescript
interface Church {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  settings: {
    timezone: string;
    defaultReminderHours: number;
    requireApprovalForJoin: boolean;
    allowPublicEvents: boolean;
  };
  branding?: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    bio?: string;
  };
  churchMemberships: {
    [churchId: string]: {
      role: 'admin' | 'leader' | 'volunteer';
      ministries: string[];
      joinedAt: Date;
      status: 'active' | 'inactive';
    };
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    timezone: string;
  };
  availability: {
    recurring: {
      [dayOfWeek: number]: TimeSlot[];
    };
    blackoutDates: DateRange[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Event Model
```typescript
interface Event {
  id: string;
  churchId: string;
  title: string;
  description: string;
  type: 'service' | 'meeting' | 'outreach' | 'social' | 'other';
  category: string;
  location: {
    name: string;
    address?: string;
    room?: string;
  };
  datetime: {
    start: Date;
    end: Date;
    timezone: string;
  };
  recurrence?: {
    pattern: 'weekly' | 'biweekly' | 'monthly';
    endDate?: Date;
    exceptions: Date[];
  };
  roles: EventRole[];
  status: 'draft' | 'published' | 'active' | 'completed' | 'canceled';
  settings: {
    requireApproval: boolean;
    allowSelfSignup: boolean;
    reminderHours: number[];
    maxVolunteers?: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EventRole {
  id: string;
  name: string;
  description: string;
  requiredCount: number;
  skills?: string[];
  assignments: VolunteerAssignment[];
  requirements?: {
    backgroundCheck?: boolean;
    training?: string[];
    minimumAge?: number;
  };
}

interface VolunteerAssignment {
  userId: string;
  status: 'invited' | 'accepted' | 'declined' | 'confirmed' | 'no_show';
  assignedAt: Date;
  responseAt?: Date;
  notes?: string;
}
```

#### Song Model
```typescript
interface Song {
  id: string;
  churchId: string;
  title: string;
  artist: string;
  album?: string;
  key: string;
  tempo: 'slow' | 'medium' | 'fast';
  themes: string[];
  lyrics: string;
  chords?: string;
  notes?: string;
  ccliNumber?: string;
  lastUsed?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Technical Implementation Details

### Authentication Flow

#### Firebase Auth Custom Claims
```typescript
// Custom claims structure for role-based access
interface CustomClaims {
  churches: {
    [churchId: string]: {
      role: 'admin' | 'leader' | 'volunteer';
      ministries: string[];
    };
  };
}

// Server-side function to set custom claims
export const setUserClaims = functions.https.onCall(async (data, context) => {
  const { uid, churchId, role, ministries } = data;

  const customClaims = {
    churches: {
      [churchId]: {
        role,
        ministries: ministries || []
      }
    }
  };

  await admin.auth().setCustomUserClaims(uid, customClaims);
});
```

#### Security Rules
```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Church-level access control
    match /churches/{churchId}/{document=**} {
      allow read, write: if isChurchMember(churchId) && 
        hasPermission(churchId, resource.data.requiresRole);
    }

    // User can access their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    function isChurchMember(churchId) {
      return request.auth.token.churches[churchId] != null;
    }

    function hasPermission(churchId, requiredRole) {
      let userRole = request.auth.token.churches[churchId].role;
      return userRole == 'admin' || 
             (userRole == 'leader' && requiredRole != 'admin') ||
             (userRole == 'volunteer' && requiredRole == 'volunteer');
    }
  }
}
```

### Real-time Features

#### Firestore Real-time Listeners
```typescript
// Real-time event updates
const useEventUpdates = (churchId: string, eventId: string) => {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'churches', churchId, 'events', eventId),
      (doc) => {
        if (doc.exists()) {
          setEvent({ id: doc.id, ...doc.data() } as Event);
        }
      }
    );

    return unsubscribe;
  }, [churchId, eventId]);

  return event;
};

// Real-time volunteer status updates
const useVolunteerResponses = (churchId: string, eventId: string) => {
  const [responses, setResponses] = useState<VolunteerResponse[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'churches', churchId, 'events', eventId, 'responses'),
      orderBy('responseAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const responseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VolunteerResponse[];

      setResponses(responseData);
    });

    return unsubscribe;
  }, [churchId, eventId]);

  return responses;
};
```

### Notification System

#### Push Notifications with FCM
```typescript
// Send push notification to volunteers
export const sendVolunteerNotification = functions.firestore
  .document('churches/{churchId}/events/{eventId}/responses/{responseId}')
  .onCreate(async (snap, context) => {
    const { churchId, eventId } = context.params;
    const response = snap.data() as VolunteerResponse;

    const tokens = await getUserTokens([response.userId]);

    const message: MulticastMessage = {
      tokens,
      notification: {
        title: 'Volunteer Update',
        body: `Your response for ${response.eventTitle} has been received.`
      },
      data: {
        type: 'volunteer_response',
        churchId,
        eventId,
        responseId: snap.id
      }
    };

    await admin.messaging().sendMulticast(message);
  });
```

#### Email Notifications
```typescript
// Email service integration
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVolunteerInvitation = async (
  volunteer: User,
  event: Event,
  role: EventRole
) => {
  const emailHtml = generateInvitationEmail(volunteer, event, role);

  await resend.emails.send({
    from: 'notifications@churchconnect.com',
    to: volunteer.email,
    subject: `Volunteer Opportunity: ${event.title}`,
    html: emailHtml
  });
};
```

### API Design

#### REST API Endpoints
```typescript
// Event management endpoints
POST   /api/churches/{churchId}/events
GET    /api/churches/{churchId}/events
GET    /api/churches/{churchId}/events/{eventId}
PUT    /api/churches/{churchId}/events/{eventId}
DELETE /api/churches/{churchId}/events/{eventId}

// Volunteer management
POST   /api/churches/{churchId}/events/{eventId}/invite
POST   /api/churches/{churchId}/events/{eventId}/respond
GET    /api/churches/{churchId}/volunteers
PUT    /api/churches/{churchId}/volunteers/{userId}/availability

// Schedule management
GET    /api/churches/{churchId}/schedule
POST   /api/churches/{churchId}/schedule/bulk-assign
PUT    /api/churches/{churchId}/schedule/{scheduleId}
```

#### API Response Formats
```typescript
// Standard API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Event response with populated volunteer data
interface EventResponse {
  event: Event;
  volunteerAssignments: {
    role: EventRole;
    volunteers: Array<{
      user: User;
      assignment: VolunteerAssignment;
    }>;
  }[];
  stats: {
    totalSlots: number;
    filledSlots: number;
    pendingResponses: number;
  };
}
```

### Performance Optimization

#### Database Optimization
```typescript
// Composite indexes for common queries
// Create these via Firebase Console or CLI
const indexes = [
  {
    collection: 'churches/{churchId}/events',
    fields: [
      { field: 'datetime.start', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' }
    ]
  },
  {
    collection: 'churches/{churchId}/events',
    fields: [
      { field: 'type', order: 'ASCENDING' },
      { field: 'datetime.start', order: 'DESCENDING' }
    ]
  }
];

// Pagination for large datasets
const getEvents = async (churchId: string, limit = 20, lastDoc?: DocumentSnapshot) => {
  let q = query(
    collection(db, 'churches', churchId, 'events'),
    orderBy('datetime.start', 'desc'),
    limit(limit)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  return {
    events: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
};
```

#### Caching Strategy
```typescript
// React Query for client-side caching
const useEvents = (churchId: string) => {
  return useQuery({
    queryKey: ['events', churchId],
    queryFn: () => fetchEvents(churchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });
};

// Server-side caching with Redis (if needed for scale)
const getCachedChurchData = async (churchId: string) => {
  const cached = await redis.get(`church:${churchId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const churchData = await fetchChurchData(churchId);
  await redis.setex(`church:${churchId}`, 300, JSON.stringify(churchData)); // 5 min cache

  return churchData;
};
```

## Testing Strategy

### Unit Testing
```typescript
// Jest + React Testing Library example
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventCard } from '../components/EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: 'event-1',
    title: 'Sunday Service',
    datetime: { start: new Date('2024-01-07T10:00:00Z') },
    roles: [
      { id: 'role-1', name: 'Greeter', requiredCount: 2, assignments: [] }
    ]
  };

  test('displays event information correctly', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText('Sunday Service')).toBeInTheDocument();
    expect(screen.getByText('Greeter (0/2)')).toBeInTheDocument();
  });

  test('handles volunteer signup', async () => {
    const mockSignup = jest.fn();
    render(<EventCard event={mockEvent} onSignup={mockSignup} />);

    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(mockEvent.id, 'role-1');
    });
  });
});
```

### Integration Testing
```typescript
// Cypress end-to-end test example
describe('Volunteer Scheduling Flow', () => {
  beforeEach(() => {
    cy.login('volunteer@example.com');
    cy.visit('/dashboard');
  });

  it('allows volunteer to sign up for an event', () => {
    cy.contains('Sunday Service').click();
    cy.contains('Sign Up for Greeter').click();

    cy.get('[data-cy=signup-modal]').should('be.visible');
    cy.get('[data-cy=confirm-signup]').click();

    cy.contains('You have successfully signed up').should('be.visible');
    cy.contains('Greeter (1/2)').should('be.visible');
  });

  it('allows leader to assign volunteers', () => {
    cy.loginAsLeader();
    cy.visit('/events/event-1/manage');

    cy.contains('Auto-assign Volunteers').click();
    cy.contains('John Doe').should('be.visible');
    cy.get('[data-cy=assign-volunteer]').first().click();

    cy.contains('Volunteer assigned successfully').should('be.visible');
  });
});
```

## Deployment & DevOps

### Environment Configuration
```typescript
// Environment variables
interface EnvConfig {
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;

  // External Services
  RESEND_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;

  // App Settings
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_ENVIRONMENT: 'development' | 'staging' | 'production';
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Security Considerations

### Data Protection
- All data encrypted in transit (HTTPS/WSS)
- Sensitive data encrypted at rest
- Regular security audits and penetration testing
- GDPR and CCPA compliance measures

### Input Validation
```typescript
// Zod schemas for input validation
const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000),
  datetime: z.object({
    start: z.date(),
    end: z.date()
  }),
  roles: z.array(z.object({
    name: z.string().min(1).max(50),
    requiredCount: z.number().min(1).max(100)
  }))
});

// API endpoint with validation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    // Process the validated data
    const event = await createEvent(validatedData);

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
```

## Monitoring & Analytics

### Error Tracking
```typescript
// Sentry configuration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 1.0,
});

// Custom error boundaries
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    Sentry.captureException(error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### Performance Monitoring
```typescript
// Custom performance tracking
const trackPageLoad = (pageName: string, loadTime: number) => {
  // Send to analytics service
  analytics.track('Page Load', {
    page: pageName,
    loadTime,
    userAgent: navigator.userAgent
  });
};

// Web Vitals tracking
export function reportWebVitals(metric: NextWebVitalsMetric) {
  analytics.track('Web Vitals', {
    name: metric.name,
    value: metric.value,
    id: metric.id
  });
}
```

This technical specification provides a comprehensive foundation for building the Church SaaS application with modern best practices and scalable architecture.
