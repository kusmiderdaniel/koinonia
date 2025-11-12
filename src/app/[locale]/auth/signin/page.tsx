import { SignInForm } from '@/components/auth';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign In - Koinonia',
    description: 'Sign in to your Koinonia account',
  };
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignInForm />
    </div>
  );
}
