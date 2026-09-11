import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { generateMeetingCode, buildMeetingLink } from '@/utils/meeting-code';
import { Copy, Check, ArrowRight, Lock, Video } from 'lucide-react';

export function CreateMeetingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;

    if (requirePassword && password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    const code = generateMeetingCode();
    const { error: insertError } = await supabase.from('meetings').insert({
      meeting_code: code,
      name: name.trim() || null,
      host_id: user.id,
      password: requirePassword ? password : null,
      status: 'scheduled',
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setCreatedCode(code);
    }
  };

  const handleCopyLink = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(buildMeetingLink(createdCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdCode) {
    return (
      <AppLayout>
        <PageHeader title="Meeting Created" subtitle="Your meeting is ready to share." />
        <Card className="max-w-lg mx-auto">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-success-500/15 flex items-center justify-center">
              <Check className="h-8 w-8 text-success-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy-50 mb-1">
                {name || 'Untitled Meeting'}
              </h3>
              <p className="text-sm text-navy-300">Meeting code:</p>
              <p className="text-2xl font-bold text-accent-400 tracking-wider mt-1">
                {createdCode}
              </p>
            </div>
            <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-navy-800/60 border border-navy-700">
              <input
                readOnly
                value={buildMeetingLink(createdCode)}
                className="flex-1 bg-transparent text-sm text-navy-300 outline-none"
              />
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-success-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreatedCode(null);
                  setName('');
                  setPassword('');
                  setRequirePassword(false);
                }}
              >
                Create Another
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => navigate(`/meeting/${createdCode}`)}
              >
                <Video className="h-4 w-4" />
                Start Now
              </Button>
            </div>
          </div>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Create a Meeting" subtitle="Set up a new meeting and share the link." />
      <div className="max-w-lg">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/30 text-sm text-error-400">
                {error}
              </div>
            )}
            <Input
              label="Meeting Name (optional)"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly Team Sync"
            />
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-navy-600 bg-navy-800 text-accent-500 focus:ring-accent-400"
                />
                <span className="text-sm font-medium text-navy-200 flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  Require a password
                </span>
              </label>
            </div>
            {requirePassword && (
              <Input
                label="Meeting Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 4 characters"
              />
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" loading={loading} className="flex-1">
                Create Meeting
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
