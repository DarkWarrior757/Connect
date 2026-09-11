import { useEffect, useRef } from 'react';
import { MicOff, VideoOff, MoreVertical, Pin, Volume2 } from 'lucide-react';
import type { ParticipantState } from '@/types';
import { Avatar } from './Avatar';

interface VideoTileProps {
  participant: ParticipantState;
  isPinned?: boolean;
  onPin?: () => void;
  className?: string;
}

export function VideoTile({ participant, isPinned, onPin, className = '' }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const showVideo = participant.videoEnabled && participant.stream;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-navy-800 border border-navy-700/50 group ${className}`}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <Avatar name={participant.displayName} size="lg" />
        </div>
      )}

      {/* Top bar — pin button */}
      {onPin && (
        <button
          onClick={onPin}
          className={`absolute top-2 right-2 p-1.5 rounded-lg bg-navy-950/60 backdrop-blur-sm text-navy-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-navy-950/80 ${isPinned ? 'opacity-100 text-accent-400' : ''}`}
          aria-label="Pin participant"
        >
          <Pin className="h-4 w-4" />
        </button>
      )}

      {/* Bottom bar — name + status */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-navy-950/90 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white drop-shadow">
              {participant.displayName}
              {participant.isLocal && ' (You)'}
            </span>
            {participant.isHost && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent-500/20 text-accent-300 border border-accent-500/30">
                Host
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!participant.audioEnabled && (
              <MicOff className="h-4 w-4 text-error-400" />
            )}
            {!participant.videoEnabled && (
              <VideoOff className="h-4 w-4 text-warning-400" />
            )}
            {participant.connectionStatus === 'connecting' && (
              <span className="h-2 w-2 rounded-full bg-warning-400 animate-pulse-soft" />
            )}
            {participant.connectionStatus === 'connected' && (
              <span className="h-2 w-2 rounded-full bg-success-400" />
            )}
            {participant.connectionStatus === 'disconnected' && (
              <span className="h-2 w-2 rounded-full bg-error-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenShareTile({
  stream,
  displayName,
  className = '',
}: {
  stream: MediaStream;
  displayName: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-navy-950 border border-accent-500/30 ${className}`}>
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-navy-950/90 to-transparent">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-accent-400" />
          <span className="text-sm font-medium text-white">
            {displayName} is sharing screen
          </span>
        </div>
      </div>
    </div>
  );
}
