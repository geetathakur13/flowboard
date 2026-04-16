import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/AuthLayout';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="If that address is registered, we've sent a reset link.">
        <div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-fg">Reset link sent</p>
            <p className="text-fg-muted mt-1">
              Check your inbox for a message from FlowBoard. The link is valid for one hour.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-fg-muted text-center">
          <Link to="/login" className="text-brand hover:text-brand-600 font-semibold">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a secure link to set a new password.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          leading={<Mail className="w-4 h-4" />}
          placeholder="you@company.com"
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send reset link <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
      <p className="mt-6 text-sm text-fg-muted text-center">
        Remembered it?{' '}
        <Link to="/login" className="text-brand hover:text-brand-600 font-semibold">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
