import { SignUpForm } from '@/components/auth';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign Up - Koinonia',
    description: 'Create a new account to get started with Koinonia',
  };
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUpForm />
    </div>
  );
}
