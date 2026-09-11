import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout, PageHeader, QuickActions } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Meeting, MeetingHistory } from '@/types';
import { formatTimestamp, formatDuration } from '@/utils/meeting-code';
import { Video, LogIn, Plus, Clock, History, Calendar, Users } from 'lucide-react';

export function DashboardPage() {
  const { profile, user } = useAuth();
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [history, setHistory] = useState<MeetingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const [upcomingRes, historyRes] = await Promise.all([
        supabase
          .from('meetings')
          .select('*')
          .eq('host_id', user.id)
          .eq('status', 'scheduled')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('meeting_history')
          .select('*')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(10),
      ]);

      if (upcomingRes.data) setUpcoming(upcomingRes.data as Meeting[]);
      if (historyRes.data) setHistory(historyRes.data as MeetingHistory[]);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout>
      <QuickActions />
      <PageHeader
        title={`${greeting}, ${profile?.display_name ?? 'there'}`}
        subtitle="Here's what's happening with your meetings."
      />

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/create">
          <Card hover className="h-full">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                <Plus className="h-6 w-6 text-accent-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-navy-50 mb-1">Create a Meeting</h3>
                <p className="text-sm text-navy-300">Start an instant meeting or schedule one for later.</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/join">
          <Card hover className="h-full">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-navy-600/30 flex items-center justify-center flex-shrink-0">
                <LogIn className="h-6 w-6 text-navy-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-navy-50 mb-1">Join a Meeting</h3>
                <p className="text-sm text-navy-300">Enter a meeting code or link to join.</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming meetings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent-400" />
              <h3 className="text-base font-semibold text-navy-50">Upcoming Meetings</h3>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-navy-800/40 animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-10 w-10 text-navy-600 mb-3" />
              <p className="text-sm text-navy-300">No upcoming meetings scheduled.</p>
              <Link to="/create" className="mt-3">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                  Create one
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-navy-800/40 hover:bg-navy-800/60 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-100 truncate">
                      {m.name || 'Untitled Meeting'}
                    </p>
                    <p className="text-xs text-navy-400 mt-0.5">
                      Code: {m.meeting_code} · {formatTimestamp(m.created_at)}
                    </p>
                  </div>
                  <Link to={`/meeting/${m.meeting_code}`}>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                      Start
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Meeting history */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent-400" />
              <h3 className="text-base font-semibold text-navy-50">Meeting History</h3>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-navy-800/40 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-10 w-10 text-navy-600 mb-3" />
              <p className="text-sm text-navy-300">No meeting history yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-navy-800/40">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-100 truncate">
                      {h.meeting_name || 'Untitled Meeting'}
                    </p>
                    <p className="text-xs text-navy-400 mt-0.5">
                      {formatTimestamp(h.joined_at)}
                      {h.duration_seconds && ` · ${formatDuration(h.duration_seconds)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-navy-400">
                    {h.host_name && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {h.host_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
