import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyEmail, resendOtp } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill('').map((_, idx) => text[idx] ?? '');
    setDigits(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(email, otp);
      toast.success('Email verified!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendOtp(email);
      toast.success('New code sent to your email');
      setResendCooldown(30);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not resend'));
    }
  }

  return (
    <AuthLayout
      title="Check your inbox"
      subtitle={email ? `We sent a 6-digit code to ${email}.` : 'Enter the 6-digit code from your email.'}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-between gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono font-semibold rounded-xl border border-border bg-surface text-fg focus:border-brand focus:shadow-glow outline-none"
            />
          ))}
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Verify email <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="mt-6 text-sm text-fg-muted text-center">
        Didn't get it?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || !email}
          className="text-brand hover:text-brand-600 font-semibold disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
      <p className="mt-2 text-sm text-fg-muted text-center">
        <Link to="/login" className="hover:text-fg">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
