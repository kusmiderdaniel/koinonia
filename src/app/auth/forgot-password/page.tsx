import { ForgotPasswordForm } from '@/components/auth';

export const metadata = {
  title: 'Forgot Password - Koinonia',
  description: 'Reset your Koinonia account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  );
}
