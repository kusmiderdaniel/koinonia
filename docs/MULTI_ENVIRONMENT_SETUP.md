# Multi-Environment Setup Guide

This guide describes how to set up development, staging, and production environments using GitHub branches and Vercel.

## Branch Strategy

```
main (production)     → koinonia.vercel.app
  ↑
staging               → staging-koinonia.vercel.app
  ↑
develop               → dev-koinonia.vercel.app
  ↑
feature/xyz           → Preview deployments (auto-generated URLs)
```

## Step 1: Create Branches in GitHub

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create staging branch from main
git checkout -b staging
git push -u origin staging

# Create develop branch from staging
git checkout -b develop
git push -u origin develop

# Go back to develop for daily work
git checkout develop
```

## Step 2: Configure Vercel Environments

### Set Production Branch
1. Go to Vercel Dashboard → **Project Settings** → **Git**
2. Set **Production Branch** to `main`

### Configure Branch Domains
1. Go to **Settings** → **Domains**
2. Add custom domains for each environment:
   - `koinonia.app` → assign to `main` branch (Production)
   - `staging.koinonia.app` → assign to `staging` branch
   - `dev.koinonia.app` → assign to `develop` branch

Alternatively, use Vercel's auto-generated URLs:
- Production: `koinonia.vercel.app`
- Staging: `koinonia-git-staging-username.vercel.app`
- Develop: `koinonia-git-develop-username.vercel.app`

## Step 3: Environment Variables per Environment

In Vercel Dashboard → **Settings** → **Environment Variables**:

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | prod URL | staging URL | dev URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod key | staging key | dev key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod key | staging key | dev key |
| `NEXT_PUBLIC_SITE_URL` | https://koinonia.app | https://staging.koinonia.app | https://dev.koinonia.app |

### Setting Variables for Specific Branches
1. Click **Add New** environment variable
2. Enter the key and value
3. Under **Environments**, select which environments apply
4. For branch-specific variables, use **Custom Branch** and enter `staging` or `develop`

## Step 4: Database Strategy

### Option A: Separate Supabase Projects (Recommended)

Create three Supabase projects:
- `koinonia-prod` → Production
- `koinonia-staging` → Staging
- `koinonia-dev` → Development

**Pros:**
- Complete isolation between environments
- Safe to test destructive migrations
- No risk of affecting production data

**Cons:**
- Need to manage three projects
- Migrations must be applied to each

### Option B: Single Database (Simpler)

All environments share one Supabase project.

**Pros:**
- Simpler setup
- One set of migrations

**Cons:**
- Risk of staging/dev affecting production
- Not recommended for serious applications

### Option C: Supabase Branching (Beta)

Use Supabase's database branching feature for isolated testing.

```bash
# Create a branch for staging
supabase branches create staging

# Create a branch for development
supabase branches create develop
```

## Step 5: Development Workflow

### Daily Development
```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Work on feature...
git add .
git commit -m "Add my feature"
git push -u origin feature/my-feature

# Create PR to develop branch
# After review, merge to develop
```

### Promoting to Staging
```bash
# Create PR from develop → staging
# Review and test on staging environment
# Merge when ready
```

### Releasing to Production
```bash
# Create PR from staging → main
# Final review
# Merge to deploy to production
```

## Step 6: Database Migrations Workflow

### Development
```bash
# Create migration locally
supabase migration new my_migration

# Test locally
supabase db reset

# Push to develop branch
git add supabase/migrations/
git commit -m "Add migration"
git push
```

### Staging
```bash
# After merging to staging, apply migration to staging database
supabase db push --linked --project-ref <staging-project-ref>
```

### Production
```bash
# After merging to main, apply migration to production database
supabase db push --linked --project-ref <production-project-ref>
```

## Step 7: Protecting Branches (GitHub)

1. Go to GitHub repo → **Settings** → **Branches**
2. Add branch protection rules:

### For `main` branch:
- [x] Require pull request reviews before merging
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

### For `staging` branch:
- [x] Require pull request reviews before merging
- [x] Require status checks to pass before merging

### For `develop` branch:
- [x] Require status checks to pass before merging

## Quick Reference

| Environment | Branch | URL | Database |
|-------------|--------|-----|----------|
| Production | `main` | koinonia.app | koinonia-prod |
| Staging | `staging` | staging.koinonia.app | koinonia-staging |
| Development | `develop` | dev.koinonia.app | koinonia-dev |
| Preview | feature/* | Auto-generated | koinonia-dev |

## Checklist

- [ ] Create `staging` branch from `main`
- [ ] Create `develop` branch from `staging`
- [ ] Set up Vercel production branch
- [ ] Configure domains in Vercel
- [ ] Create separate Supabase projects (optional)
- [ ] Set environment variables per environment in Vercel
- [ ] Set up branch protection rules in GitHub
- [ ] Update CI/CD workflow if needed
- [ ] Document environment URLs for team
