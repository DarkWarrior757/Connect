import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { parseMeetingCode } from '@/utils/meeting-code';
import { Mic, MicOff, Video, VideoOff, ArrowRight, AlertCircle } from 'lucide-react';

export function JoinMeetingPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'enter' | 'preview'>('enter');

  const media = useMediaDevices();

  useEffect(() => {
    if (profile && !displayName) {
      setDisplayName(profile.display_name);
    }
  }, [profile, displayName]);

  const handleContinue = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseMeetingCode(code);
    if (!parsed) {
      setError('Invalid meeting code or link. Expected format: abc-1234');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    setCode(parsed);
    setStep('preview');
  };

  const handleJoin = () => {
    navigate(`/meeting/${code}?name=${encodeURIComponent(displayName)}`);
  };

  if (step === 'preview') {
    return (
      <AppLayout>
        <PageHeader title="Join Meeting" subtitle="Check your camera and microphone before joining." />
        <div className="max-w-3xl mx-auto">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video preview */}
              <div>
                <div className="aspect-video rounded-xl overflow-hidden bg-navy-800 border border-navy-700 relative">
                  {media.stream && media.videoEnabled ? (
                    <video
                      ref={(el) => {
                        if (el && media.stream) el.srcObject = media.stream;
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-sm text-navy-400">
                        {media.error ? media.error : 'Camera is off'}
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-navy-950/60 backdrop-blur-sm text-xs text-navy-200">
                    {displayName}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={media.toggleAudio}
                    className={`p-3 rounded-xl transition-colors ${media.audioEnabled ? 'bg-navy-700 hover:bg-navy-600 text-navy-100' : 'bg-error-500/20 text-error-400 border border-error-500/30'}`}
                    aria-label={media.audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {media.audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={media.toggleVideo}
                    className={`p-3 rounded-xl transition-colors ${media.videoEnabled ? 'bg-navy-700 hover:bg-navy-600 text-navy-100' : 'bg-error-500/20 text-error-400 border border-error-500/30'}`}
                    aria-label={media.videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {media.videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Join details */}
              <div className="flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-sm text-navy-400 mb-1">Meeting Code</p>
                    <p className="text-lg font-semibold text-accent-400 tracking-wider">{code}</p>
                  </div>
                  <Input
                    label="Display Name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                  {media.error && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-warning-500/10 border border-warning-500/30 text-sm text-warning-400">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{media.error}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('enter')}>
                    Back
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={handleJoin} disabled={!displayName.trim()}>
                    Join Meeting
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Join a Meeting" subtitle="Enter a meeting code or paste a meeting link." />
      <div className="max-w-lg">
        <Card>
          <form onSubmit={handleContinue} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/30 text-sm text-error-400">
                {error}
              </div>
            )}
            <Input
              label="Meeting Code or Link"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="abc-1234 or https://..."
              required
              autoFocus
            />
            {!user && (
              <Input
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            )}
            <Button type="submit" variant="primary" className="w-full">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
