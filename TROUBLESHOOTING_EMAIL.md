# Email Troubleshooting Guide

## Issue: Not Receiving Firebase Auth Emails

### Quick Checklist

- [ ] Check spam/junk folder
- [ ] Check Firebase Console → Authentication → Settings → Email templates are configured
- [ ] Verify localhost is in authorized domains
- [ ] Check browser console for errors (F12)
- [ ] Try the test page: http://localhost:3000/test-email

### Common Causes

#### 1. Email Templates Not Configured
**Symptom**: No emails sent, no errors in console
**Solution**: Configure email templates in Firebase Console
- Go to: https://console.firebase.google.com/project/koinonia-dev-348cd/authentication/emails
- Configure "Email address verification" template
- Configure "Password reset" template

#### 2. Emails in Spam Folder
**Symptom**: Emails sent but not visible in inbox
**Solution**: Check spam/junk folder
- Sender: noreply@koinonia-dev-348cd.firebaseapp.com
- Mark as "Not Spam" to train your email provider

#### 3. Firebase Quota Exceeded
**Symptom**: Worked before, stopped working
**Solution**: Check Firebase usage quotas
- Go to: https://console.firebase.google.com/project/koinonia-dev-348cd/usage
- Check "Authentication" quota
- Free plan has limits on email sending

#### 4. Action Code Settings URL Not Configured
**Symptom**: Emails sent but links don't work
**Solution**: Configure action code settings
1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Add your domain (localhost should be there by default)

#### 5. Browser Blocking Popups (Google OAuth)
**Symptom**: Google sign-in popup blocked
**Solution**: Allow popups for localhost
- Look for popup blocker icon in browser address bar
- Allow popups for localhost:3000

### Testing Steps

#### Test 1: Check Firebase Configuration
```bash
# In browser console (F12), paste this:
console.log('Firebase Config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});
```

#### Test 2: Test Email Verification Manually
1. Sign up for a new account
2. Open browser console (F12)
3. Look for any error messages
4. Go to: http://localhost:3000/test-email
5. Click "Send Email Verification"
6. Check console for errors
7. Check email (including spam)

#### Test 3: Test Password Reset Manually
1. Go to: http://localhost:3000/auth/forgot-password
2. Enter your email
3. Open browser console (F12)
4. Click "Send reset link"
5. Look for success message or errors
6. Check email (including spam)

### Firebase Console URLs

- **Project Overview**: https://console.firebase.google.com/project/koinonia-dev-348cd
- **Authentication Settings**: https://console.firebase.google.com/project/koinonia-dev-348cd/authentication/settings
- **Email Templates**: https://console.firebase.google.com/project/koinonia-dev-348cd/authentication/emails
- **Usage & Quotas**: https://console.firebase.google.com/project/koinonia-dev-348cd/usage

### Expected Behavior

#### Email Verification
1. User signs up with email/password
2. Account is created immediately
3. User can sign in even without verification
4. Email verification is sent automatically
5. User clicks link in email
6. `emailVerified` becomes `true`

#### Password Reset
1. User clicks "Forgot password?"
2. Enters email address
3. Clicks "Send reset link"
4. Success message appears
5. Email arrives within 1-2 minutes
6. User clicks link in email
7. Redirected to Firebase-hosted reset page
8. User enters new password
9. Redirected back to app

### Debug Output

When testing, check these in browser console:

```javascript
// Check current user
console.log('Current User:', firebase.auth().currentUser);

// Check email verified status
console.log('Email Verified:', firebase.auth().currentUser?.emailVerified);

// Check for auth errors
firebase.auth().onAuthStateChanged((user) => {
  console.log('Auth State Changed:', user);
}, (error) => {
  console.error('Auth Error:', error);
});
```

### If Still Not Working

1. **Clear browser cache and cookies**
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cookies" and "Cached images"

2. **Try a different email provider**
   - Gmail sometimes blocks Firebase emails
   - Try with Outlook, Yahoo, or custom domain email

3. **Check Firebase Service Status**
   - https://status.firebase.google.com/
   - Look for any ongoing issues with Authentication

4. **Enable Debug Logging**
   Add this to your Firebase config:
   ```typescript
   import { getAuth } from 'firebase/auth';

   const auth = getAuth(app);
   auth.useDeviceLanguage();

   // Enable debug logging
   if (typeof window !== 'undefined') {
     (window as any).firebase_debug = true;
   }
   ```

### Getting Help

If emails still aren't working:

1. Check browser console for errors
2. Check Network tab (F12 → Network) for failed requests
3. Look for "auth" or "email" related requests
4. Check response codes (should be 200)
5. If you see 4xx or 5xx errors, note the error message

### Contact Support

Firebase Support: https://firebase.google.com/support

Include this info:
- Project ID: koinonia-dev-348cd
- Error messages from console
- Network requests/responses
- Steps to reproduce
