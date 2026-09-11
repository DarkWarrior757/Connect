export type MeetingStatus = 'scheduled' | 'active' | 'ended';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  meeting_code: string;
  name: string | null;
  host_id: string;
  password: string | null;
  status: MeetingStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  display_name: string;
  is_host: boolean;
  joined_at: string;
  left_at: string | null;
  audio_enabled: boolean;
  video_enabled: boolean;
}

export interface MeetingHistory {
  id: string;
  meeting_id: string;
  user_id: string;
  meeting_name: string | null;
  meeting_code: string;
  host_name: string | null;
  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  meeting_id: string;
  user_id: string | null;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface ParticipantState {
  id: string;
  displayName: string;
  isHost: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  stream: MediaStream | null;
  isLocal: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export type MediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

export interface MediaSettings {
  audioEnabled: boolean;
  videoEnabled: boolean;
  selectedAudioDevice: string | null;
  selectedVideoDevice: string | null;
  selectedAudioOutput: string | null;
}
