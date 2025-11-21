# Koinonia Setup Guide

This guide will walk you through setting up the complete development and deployment workflow for Koinonia.

## Prerequisites

- [x] Node.js 20+ installed
- [x] Git installed
- [x] Supabase CLI installed
- [ ] GitHub account
- [ ] Supabase account (https://supabase.com)
- [ ] Vercel account (https://vercel.com)

## Step 1: Push to GitHub ✅ (Next Step)

1. **Create a GitHub repository:**
   - Go to https://github.com/new
   - Repository name: `koinonia`
   - Visibility: Private (recommended)
   - Don't initialize with README

2. **Connect and push your code:**
   ```bash
   # Replace YOUR_USERNAME with your GitHub username
   git remote add origin https://github.com/YOUR_USERNAME/koinonia.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set up Supabase Project

1. **Create Supabase project:**
   - Go to https://supabase.com/dashboard
   - Click "New project"
   - Choose organization (or create one)
   - Project name: `koinonia`
   - Database password: Generate a strong password (save it!)
   - Region: Choose closest to your users
   - Pricing plan: Start with Free tier

2. **Link local project to Supabase:**
   ```bash
   # Login to Supabase CLI
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref
   ```

   Find your project ref in the Supabase dashboard URL:
   `https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]`

3. **Get your API keys:**
   - In Supabase dashboard, go to Settings > API
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` secret key (keep this secure!)

4. **Update .env.local:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## Step 3: Set up Vercel Deployment

1. **Install Vercel CLI (optional but recommended):**
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard (Easiest):**
   - Go to https://vercel.com/new
   - Import your GitHub repository `koinonia`
   - Configure project:
     - Framework Preset: Next.js (auto-detected)
     - Root Directory: ./
     - Build Command: `npm run build` (auto-detected)
     - Install Command: `npm install` (auto-detected)

3. **Add environment variables in Vercel:**
   - In project settings, go to "Environment Variables"
   - Add the following variables for all environments (Production, Preview, Development):
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
     ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is now live! 🎉

## Step 4: Verify Setup

1. **Local development:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

2. **Production:**
   Visit your Vercel deployment URL

3. **Type checking:**
   ```bash
   npm run type-check
   ```

4. **Linting:**
   ```bash
   npm run lint
   ```

## Step 5: Development Workflow

### Working on a new feature:

```bash
# Create a new branch
git checkout -b feature/user-authentication

# Make your changes...

# Stage and commit
git add .
git commit -m "Add user authentication with Supabase Auth"

# Push to GitHub
git push origin feature/user-authentication

# Create Pull Request on GitHub
# After review, merge to main
# Vercel will automatically deploy the changes
```

### Database migrations:

```bash
# Create a new migration
supabase migration new create_churches_table

# Edit the migration file in supabase/migrations/

# Apply migrations locally
supabase db reset

# Push to production
supabase db push --linked
```

## Troubleshooting

### Build fails on Vercel
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Try building locally: `npm run build`

### Supabase connection issues
- Verify API keys in .env.local
- Check if project is linked: `supabase status`
- Ensure Supabase project is not paused (free tier)

### Type errors
- Run `npm run type-check` to see all errors
- Regenerate Supabase types: `supabase gen types typescript --linked > types/supabase.ts`

## Next Steps

Now that your infrastructure is set up, you can start building:

1. **Phase 1 MVP** (refer to docs/koinonia_prd.md):
   - Database schema design
   - Authentication flows
   - Church creation
   - Basic event management
   - Volunteer scheduling
   - Email notifications

2. **Follow development guidelines** in CLAUDE.md

3. **Always work on feature branches** and create PRs

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # TypeScript type checking
npm run lint             # Run ESLint

# Supabase
supabase status          # Check local Supabase status
supabase start           # Start local Supabase
supabase stop            # Stop local Supabase
supabase db reset        # Reset local database
supabase migration new   # Create new migration
supabase gen types typescript --linked > types/supabase.ts

# Vercel
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel logs              # View deployment logs

# Git
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
git pull                 # Pull latest changes
```

## Support

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

## Security Reminders

- ✅ .env.local is in .gitignore (never commit secrets!)
- ✅ Use NEXT_PUBLIC_ prefix only for public variables
- ✅ Keep SUPABASE_SERVICE_ROLE_KEY secret (server-side only)
- ✅ Enable Row-Level Security (RLS) on all Supabase tables
- ✅ Review Vercel deployment logs for any exposed secrets
