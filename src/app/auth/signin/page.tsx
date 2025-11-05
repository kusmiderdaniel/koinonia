import { SignInForm } from '@/components/auth';

export const metadata = {
  title: 'Sign In - Koinonia',
  description: 'Sign in to your Koinonia account',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignInForm />
    </div>
  );
}
