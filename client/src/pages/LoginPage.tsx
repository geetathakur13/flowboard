import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/AuthLayout';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your FlowBoard account to continue.">
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
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          leading={<Lock className="w-4 h-4" />}
          placeholder="••••••••"
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand hover:text-brand-600 font-medium">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
      <p className="mt-6 text-sm text-fg-muted text-center">
        New to FlowBoard?{' '}
        <Link to="/signup" className="text-brand hover:text-brand-600 font-semibold">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
