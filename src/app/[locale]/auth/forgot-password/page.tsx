import { ForgotPasswordForm } from '@/components/auth';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Forgot Password - Koinonia',
    description: 'Reset your Koinonia account password',
  };
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  );
}
