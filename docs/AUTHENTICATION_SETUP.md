# Authentication System - Implementation Guide

## Overview

Complete authentication system with email/password and Google OAuth sign-in, including sign up, sign in, and password reset functionality.

## Files Created

### Validation Schemas
- **`src/lib/validations/auth.ts`** - Zod validation schemas
  - `signUpSchema` - Validates sign up form (firstName, lastName, email, password, confirmPassword)
  - `signInSchema` - Validates sign in form (email, password)
  - `forgotPasswordSchema` - Validates password reset form (email)
  - `resetPasswordSchema` - For future password reset functionality

### Components
- **`src/components/auth/SignUpForm.tsx`** - Sign up form component
  - Email/password registration
  - Google OAuth sign up
  - Form validation with React Hook Form + Zod
  - Error handling for Firebase auth errors
  - Redirects to dashboard after successful sign up

- **`src/components/auth/SignInForm.tsx`** - Sign in form component
  - Email/password authentication
  - Google OAuth sign in
  - "Forgot password?" link
  - Form validation
  - Error handling
  - Redirects to dashboard after successful sign in

- **`src/components/auth/ForgotPasswordForm.tsx`** - Password reset form
  - Email input for password reset
  - Sends Firebase password reset email
  - Success/error messaging
  - Link back to sign in

### Pages
- **`src/app/auth/signup/page.tsx`** - Sign up page at `/auth/signup`
- **`src/app/auth/signin/page.tsx`** - Sign in page at `/auth/signin`
- **`src/app/auth/forgot-password/page.tsx`** - Forgot password page at `/auth/forgot-password`

### UI Components Used
- Button
- Input
- Label
- Form
- Card
- Alert

## Features Implemented

### 1. Sign Up
- ✅ Email/password registration
- ✅ Google OAuth sign up
- ✅ Name collection (first and last name)
- ✅ Password strength validation (min 8 chars, uppercase, lowercase, number)
- ✅ Password confirmation matching
- ✅ Email verification sent automatically
- ✅ Display name set on user profile
- ✅ Firebase error handling
- ✅ Loading states
- ✅ Redirect to dashboard after success

### 2. Sign In
- ✅ Email/password authentication
- ✅ Google OAuth sign in
- ✅ "Forgot password?" link
- ✅ Form validation
- ✅ Firebase error handling (invalid credentials, disabled account, too many requests)
- ✅ Loading states
- ✅ Redirect to dashboard after success
- ✅ Link to sign up page

### 3. Forgot Password
- ✅ Email input
- ✅ Send Firebase password reset email
- ✅ Success confirmation message
- ✅ Error handling
- ✅ Link back to sign in

## User Flow

### Sign Up Flow
1. User visits `/auth/signup`
2. User enters first name, last name, email, and password
3. User confirms password
4. User clicks "Create account" OR "Sign up with Google"
5. If email/password:
   - Account created
   - Email verification sent
   - Display name set
6. If Google OAuth:
   - Google popup appears
   - User selects account
   - Account created/linked
7. User redirected to `/dashboard`

### Sign In Flow
1. User visits `/auth/signin`
2. User enters email and password
3. User clicks "Sign in" OR "Sign in with Google"
4. If email/password:
   - Credentials validated
   - User authenticated
5. If Google OAuth:
   - Google popup appears
   - User selects account
   - User authenticated
6. User redirected to `/dashboard`

### Forgot Password Flow
1. User visits `/auth/forgot-password`
2. User enters email address
3. User clicks "Send reset link"
4. Firebase sends password reset email
5. Success message displayed
6. User receives email with reset link
7. User clicks link and sets new password

## Error Handling

### Sign Up Errors
- `auth/email-already-in-use` - Email already registered
- `auth/weak-password` - Password too weak
- `auth/invalid-email` - Invalid email format
- `auth/popup-closed-by-user` - Google popup closed

### Sign In Errors
- `auth/user-not-found` - User doesn't exist
- `auth/wrong-password` - Incorrect password
- `auth/invalid-credential` - Invalid credentials
- `auth/user-disabled` - Account disabled
- `auth/too-many-requests` - Rate limited
- `auth/popup-closed-by-user` - Google popup closed
- `auth/account-exists-with-different-credential` - Email already used with different provider

### Forgot Password Errors
- `auth/user-not-found` - No account with that email
- `auth/invalid-email` - Invalid email format
- `auth/too-many-requests` - Rate limited

## Firebase Configuration Required

### Authentication Methods
Enable in Firebase Console → Authentication → Sign-in method:
1. **Email/Password** - ✅ Enabled
2. **Google** - ✅ Enabled

### Email Templates
Customize in Firebase Console → Authentication → Templates:
- Email verification
- Password reset

## Next Steps

### 1. Add User Profile Creation
After successful sign up, create user document in Firestore:
```typescript
const createUserProfile = async (userId: string, data: {
  firstName: string;
  lastName: string;
  email: string;
}) => {
  await setDocument('users', userId, {
    profile: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    },
    churchMemberships: {},
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
};
```

### 2. Implement Protected Routes
Create middleware to protect authenticated routes:
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  // Check auth token
  // Redirect to /auth/signin if not authenticated
}

export const config = {
  matcher: ['/dashboard/:path*', '/churches/:path*', '/events/:path*'],
};
```

### 3. Add Email Verification Check
Prompt users to verify email before accessing features:
```typescript
if (user && !user.emailVerified) {
  // Show banner to verify email
  // Offer to resend verification email
}
```

### 4. Implement Custom Claims
After user signs up and creates/joins a church, set custom claims:
```typescript
// Firebase Cloud Function
export const setUserRole = functions.https.onCall(async (data, context) => {
  const { uid, churchId, role } = data;
  await admin.auth().setCustomUserClaims(uid, {
    churches: {
      [churchId]: {
        role: role,
        ministries: []
      }
    }
  });
});
```

### 5. Add Social Login Providers (Optional)
- Facebook
- Apple
- Microsoft
- Twitter

### 6. Implement MFA (Multi-Factor Authentication)
For admin accounts, consider adding MFA:
- SMS verification
- Authenticator app (TOTP)

## Testing the Authentication

### Manual Testing Checklist

#### Sign Up
- [ ] Can create account with email/password
- [ ] Can sign up with Google
- [ ] Password validation works (strength requirements)
- [ ] Password confirmation matching works
- [ ] Email verification is sent
- [ ] Duplicate email is rejected
- [ ] Redirects to dashboard after success

#### Sign In
- [ ] Can sign in with email/password
- [ ] Can sign in with Google
- [ ] Invalid credentials show error
- [ ] Redirects to dashboard after success
- [ ] "Forgot password?" link works

#### Forgot Password
- [ ] Password reset email is sent
- [ ] Invalid email shows error
- [ ] Success message is displayed
- [ ] Reset link in email works

#### UI/UX
- [ ] Loading states show during async operations
- [ ] Error messages are clear and helpful
- [ ] Forms are responsive on mobile
- [ ] Google button has correct branding
- [ ] Links between pages work correctly

## URLs

- Sign Up: `http://localhost:3000/auth/signup`
- Sign In: `http://localhost:3000/auth/signin`
- Forgot Password: `http://localhost:3000/auth/forgot-password`
- Dashboard: `http://localhost:3000/dashboard`

## Dependencies Used

- `firebase` - Authentication, Firestore, Storage
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod resolver for RHF
- `zod` - Schema validation
- `next` - Routing and navigation
- Shadcn UI components

## Security Notes

1. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

2. **Firebase Security**
   - All authentication handled by Firebase
   - Passwords never stored in your database
   - Secure token-based authentication
   - HTTPS enforced

3. **Client-Side Validation**
   - Zod schemas validate input before submission
   - Prevents invalid data from reaching Firebase

4. **Error Messages**
   - Generic messages for security (e.g., "Invalid email or password")
   - Detailed errors only in development console

## Troubleshooting

### "Email already in use" error
- User already registered with that email
- Direct them to sign in page

### Google OAuth popup closes immediately
- Check Firebase Console → Authentication → Sign-in method
- Ensure Google provider is enabled
- Check authorized domains

### Emails not sending
- Check Firebase Console → Authentication → Settings
- Verify sender email is authorized
- Check spam folder

### Redirect not working
- Check `useRouter` from `next/navigation`
- Ensure routes exist in `src/app`
- Check browser console for errors
