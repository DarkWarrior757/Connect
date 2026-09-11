import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  Video,
  Users,
  MessageSquare,
  Monitor,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';

const features = [
  { icon: Video, title: 'HD Video Calls', desc: 'Crystal-clear video meetings with up to 100 participants.' },
  { icon: MessageSquare, title: 'Built-in Chat', desc: 'Send messages, share links, and collaborate during calls.' },
  { icon: Monitor, title: 'Screen Sharing', desc: 'Share your screen, presentations, and documents in real time.' },
  { icon: Users, title: 'Participant Management', desc: 'See who is in the call, mute, and manage participants.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your meetings are protected with password-protected rooms.' },
  { icon: Zap, title: 'No Install Needed', desc: 'Join from any browser, on any device, instantly.' },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-accent-500/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-navy-600/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm text-navy-200 mb-6 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-success-400 animate-pulse-soft" />
            Now in open beta
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-50 leading-tight tracking-tight mb-6 animate-slide-up">
            Meet face-to-face,
            <br />
            <span className="text-accent-400">anywhere</span>
          </h1>
          <p className="text-lg text-navy-300 max-w-2xl mx-auto mb-10 animate-slide-up">
            Connect is a modern video-conferencing platform built for teams,
            friends, and everyone in between. Create a meeting in seconds — no
            downloads, no friction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link to="/create" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <Video className="h-5 w-5" />
                Create a Meeting
              </Button>
            </Link>
            <Link to="/join" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join a Meeting
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-50 text-center mb-12">
            Everything you need to connect
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-card p-6 hover:border-accent-400/30 transition-colors">
                  <div className="h-11 w-11 rounded-xl bg-accent-500/15 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-accent-400" />
                  </div>
                  <h3 className="text-base font-semibold text-navy-50 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-navy-300 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-navy-700/50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-navy-400">
            Built for seamless video communication.
          </p>
        </div>
      </footer>
    </div>
  );
}
