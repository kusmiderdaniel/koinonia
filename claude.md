# Claude Code Guidelines for Koinonia

This file provides guidelines for AI-assisted development in the Koinonia project.

## Git Workflow Rules

### Branch Management
- **ALWAYS work on feature branches** - never commit directly to `main`
- Create a new branch for each feature, bug fix, or task
- Branch naming convention: `<type>/<issue-number>-<short-description>`
  - Examples: `feat/123-frozen-columns`, `fix/456-auth-error`, `refactor/789-church-service`
- Keep branches short-lived and merge frequently

### Committing
- **Commit frequently** as feature steps are completed (not just at the end)
- Each commit should represent a logical unit of work
- Commit early, commit often - small commits are easier to review and revert
- Push commits regularly to backup work and enable collaboration

### Commit Message Format
Follow conventional commits:
```
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no functionality change)
- `style`: Formatting, missing semicolons, etc.
- `docs`: Documentation only
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config, etc.)

**Examples:**
- `feat(people): add frozen column functionality with dynamic width measurement`
- `fix(auth): resolve session timeout issue`
- `refactor(church): simplify membership query logic`

### Before Merging to Main
- Ensure all tests pass
- Code has been reviewed (if working in a team)
- Branch is up to date with main
- No console errors in development

## Project Structure

### Tech Stack
- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **Backend:** Firebase (Firestore, Auth, Storage)
- **i18n:** next-intl (Polish and English)

### Key Directories
- `/src/app/[locale]/` - Localized pages (Next.js App Router)
- `/src/components/` - React components
  - `/ui/` - shadcn/ui base components
  - `/shared/` - Shared app components
- `/src/lib/` - Utilities and services
  - `/services/` - Firebase service layer
  - `/validations/` - Zod schemas
- `/src/types/` - TypeScript type definitions
- `/messages/` - i18n translation files (en.json, pl.json)

## Code Standards

### TypeScript
- Use TypeScript for all new files
- Define proper types/interfaces (avoid `any`)
- Use Zod for runtime validation of external data
- Export types from `/src/types/` directory

### React/Next.js
- Use functional components with hooks
- Prefer server components when possible
- Use `'use client'` directive only when necessary
- Follow Next.js App Router conventions
- Use proper loading and error states

### Styling
- Use Tailwind CSS utility classes
- Follow existing component patterns from shadcn/ui
- Keep responsive design in mind (mobile-first)
- Use CSS variables for theming (light/dark mode)

### Internationalization
- All user-facing text must be internationalized
- Add translations to both `messages/en.json` and `messages/pl.json`
- Use `useLocale()` and `useTranslations()` from next-intl
- Format dates according to locale

## Firebase Best Practices

### Firestore
- Always use the service layer in `/src/lib/services/`
- Never expose Firebase queries directly in components
- Use batch operations for multiple writes
- Implement proper error handling
- Consider security rules when querying

### Authentication
- Use the centralized auth context in `/src/contexts/AuthContext.tsx`
- Validate user permissions before sensitive operations
- Check `userRole` for authorization (admin, leader, volunteer, member)

### Security
- Never commit Firebase credentials or API keys
- Use environment variables for sensitive data
- Validate all user inputs with Zod schemas
- Implement proper Firestore security rules

## Testing

### Before Committing
- Test functionality in browser
- Check console for errors/warnings
- Test in both light and dark modes
- Test with both Polish and English locales
- Verify responsive design on different screen sizes

### Browser Testing
- Test in Chrome (primary)
- Check Safari compatibility (macOS)
- Ensure no TypeScript errors: `npm run build`

## Common Patterns

### Form Handling
- Use controlled components with React state
- Validate with Zod schemas before submission
- Show loading states during async operations
- Display user-friendly error messages (localized)

### Data Fetching
- Use React hooks (useState, useEffect) for client components
- Show loading skeletons during data fetch
- Handle errors gracefully with error boundaries or error states
- Cache data when appropriate

### UI Components
- Reuse shadcn/ui components from `/src/components/ui/`
- Follow existing design patterns for consistency
- Use proper accessibility attributes
- Implement keyboard navigation where needed

## Performance

### Optimization
- Use dynamic imports for large components
- Implement pagination for large lists
- Optimize images with Next.js Image component
- Avoid unnecessary re-renders (useMemo, useCallback)

### Bundle Size
- Import only what's needed from libraries
- Use tree-shaking friendly imports
- Check bundle size after adding new dependencies

## Documentation

### Code Comments
- Add JSDoc comments for complex functions
- Explain "why" not "what" in comments
- Document non-obvious business logic
- Keep comments up to date with code changes

### README Updates
- Update README.md when adding major features
- Document new environment variables
- Update setup instructions if needed

## Helpful Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

## Questions or Issues?

If unclear about any guideline, ask before proceeding. It's better to clarify than to make assumptions that might require rework later.
