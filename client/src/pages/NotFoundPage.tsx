import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <Logo />
      <div className="mt-10 font-display font-extrabold text-7xl sm:text-9xl bg-gradient-to-br from-brand to-violet-500 bg-clip-text text-transparent">
        404
      </div>
      <h1 className="mt-4 font-display font-bold text-2xl text-fg">Page not found</h1>
      <p className="text-fg-muted mt-2 max-w-sm">
        The page you were looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
