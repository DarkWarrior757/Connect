import type { ParticipantState, MediaSettings } from '@/types';
import { MediaService, mediaService } from './MediaService';
import { SignalingService, StubSignalingService } from './SignalingService';
import { PeerConnection } from './PeerConnection';

export type WebRTCEvent =
  | 'local-stream-ready'
  | 'local-stream-error'
  | 'participant-joined'
  | 'participant-left'
  | 'participant-updated'
  | 'remote-stream-ready'
  | 'connection-state-changed'
  | 'screen-share-started'
  | 'screen-share-stopped';

export type WebRTCEventHandler = (data: unknown) => void;

export class WebRTCService {
  private media: MediaService;
  private signaling: SignalingService;
  private peers = new Map<string, PeerConnection>();
  private participants = new Map<string, ParticipantState>();
  private localParticipantId: string | null = null;
  private meetingId: string | null = null;
  private isScreenSharing = false;
  private handlers = new Map<WebRTCEvent, Set<WebRTCEventHandler>>();

  constructor(signaling?: SignalingService) {
    this.media = mediaService;
    this.signaling = signaling ?? new StubSignalingService();
  }

  on(event: WebRTCEvent, handler: WebRTCEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: WebRTCEvent, handler: WebRTCEventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  private emit(event: WebRTCEvent, data: unknown): void {
    this.handlers.get(event)?.forEach((h) => h(data));
  }

  async initLocalMedia(settings: MediaSettings): Promise<MediaStream> {
    try {
      const stream = await this.media.getLocalStream(settings);
      this.emit('local-stream-ready', stream);
      return stream;
    } catch (err) {
      this.emit('local-stream-error', err);
      throw err;
    }
  }

  async joinMeeting(
    meetingId: string,
    participant: Omit<ParticipantState, 'stream' | 'connectionStatus'>
  ): Promise<void> {
    this.meetingId = meetingId;
    this.localParticipantId = participant.id;

    const localParticipant: ParticipantState = {
      ...participant,
      stream: this.media.getLocalStreamValue(),
      connectionStatus: 'connected',
    };
    this.participants.set(participant.id, localParticipant);
    this.emit('participant-joined', localParticipant);

    await this.signaling.connect(meetingId, participant.id);
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    this.signaling.on('participant-joined', (msg) => {
      const data = msg.payload as ParticipantState;
      if (!this.participants.has(data.id)) {
        const p: ParticipantState = { ...data, stream: null, connectionStatus: 'connecting' };
        this.participants.set(data.id, p);
        this.emit('participant-joined', p);
      }
    });

    this.signaling.on('participant-left', (msg) => {
      const data = msg.payload as { id: string };
      this.peers.get(data.id)?.close();
      this.peers.delete(data.id);
      this.participants.delete(data.id);
      this.emit('participant-left', data);
    });

    this.signaling.on('offer', (msg) => {
      const { from, payload } = msg;
      if (!from) return;
      this.handleOffer(from, payload as RTCSessionDescriptionInit);
    });

    this.signaling.on('answer', (msg) => {
      const { from, payload } = msg;
      if (!from) return;
      this.peers.get(from)?.setRemoteAnswer(payload as RTCSessionDescriptionInit);
    });

    this.signaling.on('ice-candidate', (msg) => {
      const { from, payload } = msg;
      if (!from) return;
      this.peers.get(from)?.addIceCandidate(payload as RTCIceCandidateInit);
    });
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let pc = this.peers.get(peerId);
    if (!pc) {
      pc = new PeerConnection(peerId, {
        onTrack: (stream) => {
          const p = this.participants.get(peerId);
          if (p) {
            p.stream = stream;
            p.connectionStatus = 'connected';
            this.emit('remote-stream-ready', { peerId, stream });
            this.emit('participant-updated', p);
          }
        },
        onConnectionStateChange: (state) => {
          const p = this.participants.get(peerId);
          if (p) {
            p.connectionStatus = state === 'connected' ? 'connected' : 'disconnected';
            this.emit('connection-state-changed', { peerId, state });
            this.emit('participant-updated', p);
          }
        },
      });
      this.peers.set(peerId, pc);
    }

    const localStream = this.media.getLocalStreamValue();
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    const answer = await pc.createAnswer(offer);
    this.signaling.send({
      event: 'answer',
      payload: answer,
      to: peerId,
      meetingId: this.meetingId ?? undefined,
    });
  }

  async createOfferToPeer(peerId: string): Promise<void> {
    let pc = this.peers.get(peerId);
    if (!pc) {
      pc = new PeerConnection(peerId, {
        onTrack: (stream) => {
          const p = this.participants.get(peerId);
          if (p) {
            p.stream = stream;
            p.connectionStatus = 'connected';
            this.emit('remote-stream-ready', { peerId, stream });
            this.emit('participant-updated', p);
          }
        },
        onIceCandidate: (candidate) => {
          this.signaling.send({
            event: 'ice-candidate',
            payload: candidate,
            to: peerId,
            meetingId: this.meetingId ?? undefined,
          });
        },
        onConnectionStateChange: (state) => {
          const p = this.participants.get(peerId);
          if (p) {
            p.connectionStatus = state === 'connected' ? 'connected' : 'disconnected';
            this.emit('connection-state-changed', { peerId, state });
            this.emit('participant-updated', p);
          }
        },
      });
      this.peers.set(peerId, pc);
    }

    const localStream = this.media.getLocalStreamValue();
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    const offer = await pc.createOffer();
    this.signaling.send({
      event: 'offer',
      payload: offer,
      to: peerId,
      meetingId: this.meetingId ?? undefined,
    });
  }

  toggleAudio(enabled: boolean): void {
    this.media.toggleAudio(enabled);
    const p = this.participants.get(this.localParticipantId ?? '');
    if (p) {
      p.audioEnabled = enabled;
      this.emit('participant-updated', p);
    }
  }

  toggleVideo(enabled: boolean): void {
    this.media.toggleVideo(enabled);
    const p = this.participants.get(this.localParticipantId ?? '');
    if (p) {
      p.videoEnabled = enabled;
      this.emit('participant-updated', p);
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    const stream = await this.media.getScreenStream();
    this.isScreenSharing = true;
    this.emit('screen-share-started', stream);

    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      this.stopScreenShare();
    });

    return stream;
  }

  stopScreenShare(): void {
    this.media.stopScreenStream();
    this.isScreenSharing = false;
    this.emit('screen-share-stopped', null);
  }

  getIsScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  getParticipants(): ParticipantState[] {
    return Array.from(this.participants.values());
  }

  getLocalParticipant(): ParticipantState | null {
    return this.localParticipantId
      ? this.participants.get(this.localParticipantId) ?? null
      : null;
  }

  async leaveMeeting(): Promise<void> {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.participants.clear();
    this.media.stopScreenStream();
    await this.media.stopLocalStream();
    await this.signaling.disconnect();
    this.meetingId = null;
    this.localParticipantId = null;
  }

  getMediaService(): MediaService {
    return this.media;
  }
}
