import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { MeetingParticipant } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Mic, MicOff, Video, VideoOff, Crown, Users } from 'lucide-react';

interface ParticipantsPanelProps {
  meetingDbId: string;
  hostId: string;
}

export function ParticipantsPanel({ meetingDbId, hostId }: ParticipantsPanelProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchParticipants() {
      const { data } = await supabase
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', meetingDbId)
        .is('left_at', null)
        .order('joined_at', { ascending: true });
      if (data) setParticipants(data as MeetingParticipant[]);
      setLoading(false);
    }
    fetchParticipants();

    const channel = supabase
      .channel(`participants:${meetingDbId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${meetingDbId}`,
        },
        () => fetchParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingDbId]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-navy-700/50">
        <h3 className="text-sm font-semibold text-navy-100 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participants
          <span className="text-xs text-navy-400 font-normal">
            ({participants.length})
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-navy-400">Loading...</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-8 w-8 text-navy-600 mb-3" />
            <p className="text-sm text-navy-400">No participants yet.</p>
          </div>
        ) : (
          participants.map((p) => {
            const isMe = p.user_id === user?.id;
            const isHost = p.user_id === hostId;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-navy-800/40 transition-colors"
              >
                <Avatar name={p.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-navy-100 truncate">
                      {p.display_name}
                      {isMe && ' (You)'}
                    </span>
                    {isHost && (
                      <Crown className="h-3.5 w-3.5 text-accent-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.audio_enabled ? (
                    <Mic className="h-4 w-4 text-navy-400" />
                  ) : (
                    <MicOff className="h-4 w-4 text-error-400" />
                  )}
                  {p.video_enabled ? (
                    <Video className="h-4 w-4 text-navy-400" />
                  ) : (
                    <VideoOff className="h-4 w-4 text-warning-400" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
