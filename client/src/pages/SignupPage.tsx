import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/AuthLayout';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      toast.success('Account created! Check your email for a code.');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start planning, shipping, and reflecting — with AI on your side.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          leading={<UserIcon className="w-4 h-4" />}
          placeholder="Ada Lovelace"
        />
        <Input
          label="Work email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          leading={<Mail className="w-4 h-4" />}
          placeholder="ada@company.com"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          leading={<Lock className="w-4 h-4" />}
          placeholder="At least 8 characters"
          hint="Use 8+ characters with a mix of letters and numbers."
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
      <p className="mt-6 text-sm text-fg-muted text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-brand hover:text-brand-600 font-semibold">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
