import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { WebRTCService } from '@/services/webrtc';
import type { Meeting, MeetingParticipant, ParticipantState } from '@/types';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { VideoTile } from '@/components/ui/VideoTile';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantsPanel } from '@/components/meeting/ParticipantsPanel';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  MessageSquare,
  Users,
  MoreVertical,
  Info,
  Maximize2,
  Minimize2,
  X,
  Settings as SettingsIcon,
} from 'lucide-react';

type Panel = 'none' | 'chat' | 'participants' | 'info';

export function MeetingRoomPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('none');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected'>('connecting');

  const webrtcRef = useRef<WebRTCService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const displayName =
    searchParams.get('name') || profile?.display_name || (user?.email?.split('@')[0] ?? 'Guest');

  const togglePanel = (p: Panel) => setPanel(panel === p ? 'none' : p);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Load meeting + init WebRTC
  useEffect(() => {
    if (!code) return;

    let participantRecordId: string | null = null;

    async function init() {
      // Fetch meeting by code
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('meeting_code', code)
        .maybeSingle();

      if (meetingError || !meetingData) {
        setError('Meeting not found. Check your meeting code and try again.');
        setLoading(false);
        return;
      }

      const m = meetingData as Meeting;
      setMeeting(m);

      if (!user) {
        setError('You must be signed in to join a meeting.');
        setLoading(false);
        return;
      }

      // Join as participant
      const { data: pRecord } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: m.id,
          user_id: user.id,
          display_name: displayName,
          is_host: m.host_id === user.id,
          audio_enabled: true,
          video_enabled: true,
        })
        .select()
        .single();

      if (pRecord) {
        participantRecordId = (pRecord as MeetingParticipant).id;
      }

      // Insert history entry
      await supabase.from('meeting_history').insert({
        meeting_id: m.id,
        user_id: user.id,
        meeting_name: m.name,
        meeting_code: m.meeting_code,
        host_name: null,
        joined_at: new Date().toISOString(),
      });

      // Init WebRTC
      const webrtc = new WebRTCService();
      webrtcRef.current = webrtc;

      try {
        const stream = await webrtc.initLocalMedia({
          audioEnabled: true,
          videoEnabled: true,
          selectedAudioDevice: null,
          selectedVideoDevice: null,
          selectedAudioOutput: null,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        await webrtc.joinMeeting(m.id, {
          id: user.id,
          displayName,
          isHost: m.host_id === user.id,
          audioEnabled: true,
          videoEnabled: true,
          isLocal: true,
        });

        setConnectionStatus('connected');
        setParticipants(webrtc.getParticipants());

        webrtc.on('participant-joined', () => {
          setParticipants(webrtc.getParticipants());
        });
        webrtc.on('participant-left', () => {
          setParticipants(webrtc.getParticipants());
        });
        webrtc.on('participant-updated', () => {
          setParticipants(webrtc.getParticipants());
        });
      } catch {
        // Media access failed — still allow joining without video
        setConnectionStatus('connected');
      }

      setLoading(false);
    }

    init();

    return () => {
      // Cleanup on leave
      if (participantRecordId) {
        supabase
          .from('meeting_participants')
          .update({ left_at: new Date().toISOString() })
          .eq('id', participantRecordId);
      }
      webrtcRef.current?.leaveMeeting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    webrtcRef.current?.toggleAudio(next);
    if (user && meeting) {
      supabase
        .from('meeting_participants')
        .update({ audio_enabled: next })
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id)
        .is('left_at', null);
    }
  };

  const handleToggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    webrtcRef.current?.toggleVideo(next);
    if (user && meeting) {
      supabase
        .from('meeting_participants')
        .update({ video_enabled: next })
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id)
        .is('left_at', null);
    }
  };

  const handleScreenShare = async () => {
    const webrtc = webrtcRef.current;
    if (!webrtc) return;
    if (isScreenSharing) {
      webrtc.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await webrtc.startScreenShare();
        setIsScreenSharing(true);
      } catch {
        // User cancelled or permission denied
      }
    }
  };

  const handleLeave = () => {
    if (user && meeting) {
      supabase
        .from('meeting_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id)
        .is('left_at', null);
    }
    webrtcRef.current?.leaveMeeting();
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-4">
        <Logo size="md" />
        <div className="flex items-center gap-2 text-navy-300">
          <div className="h-2 w-2 rounded-full bg-accent-400 animate-pulse-soft" />
          Joining meeting...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-4 p-4">
        <Logo size="md" />
        <div className="glass-card p-8 max-w-md text-center">
          <p className="text-error-400 text-lg font-semibold mb-2">Unable to join</p>
          <p className="text-navy-300 text-sm mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Build tile grid
  const allParticipants: ParticipantState[] = [
    {
      id: user?.id ?? 'local',
      displayName,
      isHost: !!meeting && !!user && meeting.host_id === user.id,
      audioEnabled,
      videoEnabled,
      stream: localStream,
      isLocal: true,
      connectionStatus: 'connected',
    },
    ...participants.filter((p) => p.id !== user?.id),
  ];

  const gridCols =
    allParticipants.length <= 1
      ? 'grid-cols-1'
      : allParticipants.length <= 4
      ? 'grid-cols-2'
      : 'grid-cols-2 lg:grid-cols-3';

  return (
    <div
      ref={containerRef}
      className={`h-screen bg-navy-950 flex flex-col overflow-hidden ${isFullscreen ? '' : ''}`}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 glass-panel border-b border-navy-700/50 z-20">
        <div className="flex items-center gap-3">
          <Logo size="sm" showText={false} />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-navy-100">
              {meeting?.name || 'Untitled Meeting'}
            </p>
            <p className="text-xs text-navy-400">Code: {meeting?.meeting_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-800/60">
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-success-400' : 'bg-warning-400 animate-pulse-soft'
              }`}
            />
            <span className="text-xs text-navy-300 hidden sm:inline">
              {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-navy-700/50 text-navy-300 transition-colors"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-3 overflow-hidden">
          <div className={`grid ${gridCols} gap-3 h-full auto-rows-fr`}>
            {allParticipants.map((p) => (
              <VideoTile key={p.id} participant={p} className="min-h-0" />
            ))}
          </div>
        </div>

        {/* Side panel */}
        {panel !== 'none' && meeting && (
          <aside className="w-full sm:w-80 glass-panel border-l border-navy-700/50 flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-2 border-b border-navy-700/50">
              <span className="text-sm font-medium text-navy-200">
                {panel === 'chat' ? 'Chat' : panel === 'participants' ? 'Participants' : 'Meeting Info'}
              </span>
              <button
                onClick={() => setPanel('none')}
                className="p-1 rounded-lg hover:bg-navy-700/50 text-navy-300"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {panel === 'chat' && <ChatPanel meetingId={meeting.meeting_code} meetingDbId={meeting.id} />}
              {panel === 'participants' && (
                <ParticipantsPanel meetingDbId={meeting.id} hostId={meeting.host_id} />
              )}
              {panel === 'info' && (
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-navy-400 mb-1">Meeting Name</p>
                    <p className="text-sm font-medium text-navy-100">
                      {meeting.name || 'Untitled Meeting'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-400 mb-1">Meeting Code</p>
                    <p className="text-sm font-mono text-accent-400">{meeting.meeting_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-400 mb-1">Status</p>
                    <p className="text-sm text-navy-100 capitalize">{meeting.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-400 mb-1">Created</p>
                    <p className="text-sm text-navy-100">
                      {new Date(meeting.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-navy-700/50">
                    <p className="text-xs text-navy-400 mb-2">WebRTC Status</p>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-warning-400" />
                      <p className="text-xs text-navy-300">
                        Signaling server not connected. Using local preview only.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Control bar */}
      <footer className="flex items-center justify-center gap-2 px-4 py-3 glass-panel border-t border-navy-700/50 z-20">
        <button
          onClick={handleToggleAudio}
          className={`p-3 rounded-xl transition-colors ${
            audioEnabled ? 'bg-navy-700 hover:bg-navy-600 text-navy-100' : 'bg-error-500/20 text-error-400 border border-error-500/30'
          }`}
          aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={handleToggleVideo}
          className={`p-3 rounded-xl transition-colors ${
            videoEnabled ? 'bg-navy-700 hover:bg-navy-600 text-navy-100' : 'bg-error-500/20 text-error-400 border border-error-500/30'
          }`}
          aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={handleScreenShare}
          className={`p-3 rounded-xl transition-colors ${
            isScreenSharing ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-navy-700 hover:bg-navy-600 text-navy-100'
          }`}
          aria-label="Toggle screen share"
        >
          {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
        </button>

        <button
          onClick={() => togglePanel('participants')}
          className={`p-3 rounded-xl transition-colors ${panel === 'participants' ? 'bg-accent-500/20 text-accent-300' : 'bg-navy-700 hover:bg-navy-600 text-navy-100'}`}
          aria-label="Show participants"
        >
          <Users className="h-5 w-5" />
        </button>

        <button
          onClick={() => togglePanel('chat')}
          className={`p-3 rounded-xl transition-colors ${panel === 'chat' ? 'bg-accent-500/20 text-accent-300' : 'bg-navy-700 hover:bg-navy-600 text-navy-100'}`}
          aria-label="Show chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-3 rounded-xl transition-colors ${showMoreMenu ? 'bg-accent-500/20 text-accent-300' : 'bg-navy-700 hover:bg-navy-600 text-navy-100'}`}
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
              <div className="absolute bottom-14 right-0 z-40 glass-panel rounded-xl shadow-2xl py-1 min-w-48">
                <button
                  onClick={() => { togglePanel('info'); setShowMoreMenu(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-navy-200 hover:bg-navy-700/50 transition-colors"
                >
                  <Info className="h-4 w-4" />
                  Meeting Info
                </button>
                <button
                  onClick={() => { toggleFullscreen(); setShowMoreMenu(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-navy-200 hover:bg-navy-700/50 transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
                <button
                  onClick={() => { navigate('/settings'); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-navy-200 hover:bg-navy-700/50 transition-colors"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </button>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-8 bg-navy-700 mx-1" />

        <button
          onClick={handleLeave}
          className="px-5 py-3 rounded-xl bg-error-500 hover:bg-error-400 text-white font-semibold transition-colors flex items-center gap-2"
          aria-label="Leave meeting"
        >
          <PhoneOff className="h-5 w-5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </footer>
    </div>
  );
}
