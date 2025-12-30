# Koinonia - Church Management SaaS

## Project Overview
Koinonia is a church management SaaS application built with Next.js, Supabase, and shadcn/ui.

## Tech Stack
- **Framework**: Next.js 16+ (App Router)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Auth
- **UI Components**: shadcn/ui (ALWAYS use for all UI components)
- **Styling**: Tailwind CSS v3
- **Forms**: React Hook Form + Zod validation
- **Language**: TypeScript (strict mode)

---

## Brand / Accent Color

The app uses a configurable brand accent color for primary action buttons and highlights.

**Current color**: `#f49f1e` (Orange)

### How to change the brand color:

1. Open `app/globals.css`
2. Find the `--brand` CSS variable in `:root` (line ~8)
3. Convert your new hex color to oklch format at https://oklch.com
4. Update the value: `--brand: oklch(L C H);`
5. Also update the `.dark` section if needed

### Usage in components:

```tsx
// Use the brand color for primary action buttons
<Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
  Create Event
</Button>

// Tailwind classes available:
// bg-brand, text-brand, border-brand
// bg-brand-foreground, text-brand-foreground
```

### Future enhancement:
Allow users to customize their church's accent color in settings, stored in the database.

---

## UI Component Guidelines

### ALWAYS Use shadcn/ui Components
For ALL UI components, use shadcn/ui. Never create custom components when a shadcn equivalent exists.

**Available components**: Alert, AlertDialog, Avatar, Badge, Button, Card, Checkbox, Combobox, Command, Dialog, DropdownMenu, Form, Input, Label, Popover, Select, Separator, Sheet, Skeleton, Switch, Table, Tabs, Textarea, Toast, Tooltip

### Install missing components:
```bash
npx shadcn@latest add [component-name]
```

---

## Database Table UI Design - Notion-Style

When building data tables and lists, follow **Notion's database design patterns**:

### Core Principles
1. **Inline editing** - Edit values directly in the table cell, not in a modal
2. **Contextual dropdowns** - Use dropdowns/selects that appear on click within the cell
3. **Visual field types** - Different field types have distinct visual treatments

### Field Type Styling

#### Dropdown/Select Fields (e.g., Role, Status)
- Display as a **Badge** or **pill** in the cell
- On click, show a **DropdownMenu** or **Select** with options
- Use color-coded badges for different values:
  ```
  admin    → default (solid background)
  leader   → secondary (muted background)
  volunteer → outline (border only)
  ```

#### Multi-Select Fields (e.g., Skills, Tags, Ministries)
- Display as multiple **Badges** inline
- On click, show a **Combobox** or **Command** palette for selection
- Allow adding/removing items without closing the dropdown

#### Text Fields
- Display plain text
- On click, convert to an **Input** field
- Save on blur or Enter key

#### Date Fields
- Display formatted date (e.g., "Dec 23, 2025")
- On click, show a **Calendar** popover (use date-picker)
- Support relative dates ("2 days ago")

#### Person/User Fields
- Display with **Avatar** + name
- On click, show a user selector dropdown

### Table Interactions
- **Hover states**: Subtle background change on row hover
- **Click to edit**: Single click activates edit mode for that cell
- **Escape to cancel**: Pressing Escape reverts changes
- **Tab navigation**: Tab moves to next editable cell

### Example Implementation Pattern
```tsx
// Role cell with inline dropdown
<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="focus:outline-none">
        <Badge variant={getRoleBadgeVariant(role)}>
          {role}
        </Badge>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => updateRole('admin')}>
        <Badge variant="default">admin</Badge>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => updateRole('leader')}>
        <Badge variant="secondary">leader</Badge>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => updateRole('volunteer')}>
        <Badge variant="outline">volunteer</Badge>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

---

## Role Hierarchy & Permissions

### Roles (highest to lowest)
1. **admin** - Full access, can manage church settings, invite members, change roles
2. **leader** - Can manage ministries they lead, view all members
3. **volunteer** - Basic access, can view events and sign up

### Role Change Rules
- Users can only change roles of users with **lower** access level
- Admins can change anyone's role (except their own to prevent lockout)
- Leaders cannot change other leaders or admins
- Volunteers cannot change anyone's role

---

## Database Schema

### Current Tables
- `churches` - Church organizations (tenants)
- `profiles` - User profiles linked to churches
- `ministries` - Ministry teams within churches

### Multi-tenant Architecture
- All tables have `church_id` for tenant isolation
- Row Level Security (RLS) ensures users only see their church's data
- Use `createServiceRoleClient()` for admin operations that bypass RLS

---

## Code Patterns

### Server Actions
- Located in `actions.ts` files within route folders
- Use `'use server'` directive
- Always validate with Zod schemas
- Use `createServiceRoleClient()` for privileged operations

### Form Handling
```tsx
const { register, handleSubmit, formState: { errors } } = useForm<T>({
  resolver: zodResolver(schema),
})
```

### Data Fetching
- Server Components: Use Supabase client directly
- Client Components: Use server actions or API routes
