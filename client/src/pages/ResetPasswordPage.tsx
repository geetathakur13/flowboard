import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/AuthLayout';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Missing reset token');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Reset failed'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing or incomplete.">
        <p className="text-sm text-fg-muted">
          Request a new reset link from the{' '}
          <Link to="/forgot-password" className="text-brand font-semibold">forgot password page</Link>.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you don't use anywhere else.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          leading={<Lock className="w-4 h-4" />}
          placeholder="At least 8 characters"
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          leading={<Lock className="w-4 h-4" />}
          placeholder="Type it again"
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Update password <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
