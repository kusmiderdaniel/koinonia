# Koinonia - Church Management Platform

A comprehensive multi-tenant SaaS platform designed to streamline church operations, volunteer management, and event coordination.

## Features

- 🏛️ **Multi-Tenant Architecture** - Secure data isolation for each church organization
- 👥 **Volunteer Management** - Intelligent scheduling and coordination
- 📅 **Event Planning** - Complete event lifecycle management
- 🎵 **Song Bank** - Centralized worship planning and setlist management
- 🔐 **Role-Based Access** - Granular permissions for admins, leaders, and volunteers
- 📱 **Mobile-First Design** - Responsive interface for all devices
- 🔔 **Real-Time Notifications** - Email, SMS, and push notifications

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)

### Backend & Database
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Functions

### External Services
- **Email**: Resend
- **SMS**: Twilio
- **Push Notifications**: Firebase Cloud Messaging

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- (Optional) Resend and Twilio accounts for notifications

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd koinonia
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Firebase project:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google OAuth)
   - Create a Firestore database
   - Enable Storage
   - Copy your Firebase configuration to `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
koinonia/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── churches/          # Church management
│   │   ├── events/            # Event management
│   │   └── volunteers/        # Volunteer management
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── churches/         # Church components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── events/           # Event components
│   │   ├── volunteers/       # Volunteer components
│   │   ├── ui/               # Shadcn/ui components
│   │   └── shared/           # Shared/common components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── firebase/        # Firebase configuration & utilities
│   │   ├── utils/           # General utilities
│   │   └── validations/     # Validation schemas
│   ├── stores/               # Zustand stores
│   └── types/                # TypeScript type definitions
├── docs/                      # Project documentation
│   ├── church_saas_prd.md    # Product Requirements Document
│   └── church_saas_tech_spec.md  # Technical Specification
└── public/                    # Static assets
```

## Environment Variables

See `.env.example` for a complete list of required environment variables.

### Required Variables

- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_ENVIRONMENT` - Environment (development/staging/production)

### Optional Variables

- `RESEND_API_KEY` - For email notifications
- `TWILIO_*` - For SMS notifications
- `SENTRY_DSN` - For error tracking
- `NEXT_PUBLIC_POSTHOG_*` - For analytics

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style

This project uses:
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting

## Firebase Setup

### Firestore Security Rules

See `/docs/church_saas_tech_spec.md` for detailed security rules.

### Firestore Indexes

Required composite indexes:
- `churches/{churchId}/events`: `datetime.start` (ASC), `status` (ASC)
- `churches/{churchId}/events`: `type` (ASC), `datetime.start` (DESC)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## Contributing

Please read the PRD and Technical Specification in the `/docs` folder before contributing.

## License

This project is proprietary and confidential.

## Support

For issues and questions, please contact the development team.
