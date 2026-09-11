import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { User, Mic, Video, Bell, Palette, Check } from 'lucide-react';

type Tab = 'profile' | 'audio' | 'video' | 'appearance' | 'notifications';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    meetingReminders: true,
    participantJoined: true,
    chatMentions: true,
    soundAlerts: false,
  });

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setAvatarUrl(profile?.avatar_url ?? '');
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl || null,
    });
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent-500/15 text-accent-300'
                      : 'text-navy-300 hover:bg-navy-700/40'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'profile' && (
            <Card>
              <h3 className="text-base font-semibold text-navy-50 mb-6">Profile Settings</h3>
              <div className="flex items-center gap-4 mb-6">
                <Avatar name={displayName || 'User'} avatarUrl={avatarUrl} size="lg" />
                <div>
                  <p className="text-sm text-navy-300">Your avatar</p>
                  <p className="text-xs text-navy-400 mt-0.5">Enter an image URL to set your avatar</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input
                  label="Display Name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Avatar URL"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="primary" onClick={handleSaveProfile} loading={saving}>
                    Save Changes
                  </Button>
                  {saved && (
                    <span className="flex items-center gap-1.5 text-sm text-success-400">
                      <Check className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'audio' && (
            <Card>
              <h3 className="text-base font-semibold text-navy-50 mb-6">Audio Settings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-navy-300 mb-2">
                    Audio device selection and testing will be available when you join a meeting.
                    Connect uses your browser's default audio device.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700">
                  <p className="text-sm text-navy-200 font-medium mb-1">Echo Cancellation</p>
                  <p className="text-xs text-navy-400">Enabled by default to reduce audio feedback.</p>
                </div>
                <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700">
                  <p className="text-sm text-navy-200 font-medium mb-1">Noise Suppression</p>
                  <p className="text-xs text-navy-400">Filters background noise during calls.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'video' && (
            <Card>
              <h3 className="text-base font-semibold text-navy-50 mb-6">Video Settings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-navy-300 mb-2">
                    Video device selection and preview will be available when you join a meeting.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700">
                  <p className="text-sm text-navy-200 font-medium mb-1">Default Resolution</p>
                  <p className="text-xs text-navy-400">720p (1280x720) at 30fps for optimal quality.</p>
                </div>
                <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700">
                  <p className="text-sm text-navy-200 font-medium mb-1">Mirror Video</p>
                  <p className="text-xs text-navy-400">Your video preview is mirrored for a natural feel.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <h3 className="text-base font-semibold text-navy-50 mb-6">Appearance</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700">
                  <p className="text-sm text-navy-200 font-medium mb-1">Theme</p>
                  <p className="text-xs text-navy-400">Connect uses a dark navy theme optimized for video calls.</p>
                </div>
                <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700">
                  <p className="text-sm text-navy-200 font-medium mb-1">Layout</p>
                  <p className="text-xs text-navy-400">Participant tiles auto-arrange based on screen size.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-base font-semibold text-navy-50 mb-6">Notification Preferences</h3>
              <div className="space-y-3">
                {(
                  [
                    ['meetingReminders', 'Meeting Reminders', 'Get notified before meetings start'],
                    ['participantJoined', 'Participant Joined', 'Notify when someone joins your meeting'],
                    ['chatMentions', 'Chat Mentions', 'Get notified when someone mentions you in chat'],
                    ['soundAlerts', 'Sound Alerts', 'Play sounds for incoming messages and events'],
                  ] as const
                ).map(([key, label, desc]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl bg-navy-800/40 border border-navy-700 cursor-pointer hover:bg-navy-800/60 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy-100">{label}</p>
                      <p className="text-xs text-navy-400 mt-0.5">{desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="h-5 w-5 rounded border-navy-600 bg-navy-800 text-accent-500 focus:ring-accent-400"
                    />
                  </label>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
