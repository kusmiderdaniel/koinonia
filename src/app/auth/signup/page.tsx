import { SignUpForm } from '@/components/auth';

export const metadata = {
  title: 'Sign Up - Koinonia',
  description: 'Create a new account to get started with Koinonia',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUpForm />
    </div>
  );
}
