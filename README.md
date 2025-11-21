# Koinonia

Multi-tenant SaaS platform for church operations, volunteer management, and event coordination.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **Hosting**: Vercel
- **Email**: AWS SES
- **Push Notifications**: Firebase Cloud Messaging

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
/app                # Next.js App Router pages
/components         # Reusable React components
/lib                # Utilities and helpers
  /supabase        # Supabase client configuration
  /validations     # Zod schemas
/types              # TypeScript types
/docs               # Project documentation
/supabase          # Supabase migrations and config
```

## Development Workflow

1. **Feature Branches**: Create a separate branch for each feature
   - `git checkout -b feature/feature-name`
2. **Commit Regularly**: Push changes frequently to backup work
3. **Pull Requests**: Create PR for review before merging to main

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guidelines for AI assistants
- [Product Requirements](./docs/koinonia_prd.md) - Complete PRD
- [Technical Specification](./docs/koinonia_tech_spec.md) - Architecture details

## License

Private - All rights reserved
