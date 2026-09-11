import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-navy-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-navy-600/10 blur-3xl" />
      </div>

      <Link to="/" className="relative mb-8">
        <Logo size="lg" />
      </Link>

      <div className="relative w-full max-w-md">
        <div className="glass-card p-8 animate-slide-up">
          <h1 className="text-2xl font-bold text-navy-50 mb-1">{title}</h1>
          {subtitle && <p className="text-navy-300 text-sm mb-6">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-sm text-navy-300">{footer}</div>}
      </div>
    </div>
  );
}
