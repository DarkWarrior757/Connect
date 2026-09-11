export type SignalEvent =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'join'
  | 'leave'
  | 'participant-joined'
  | 'participant-left'
  | 'participant-updated'
  | 'chat-message';

export interface SignalMessage {
  event: SignalEvent;
  payload: unknown;
  from?: string;
  to?: string;
  meetingId?: string;
}

export type SignalHandler = (message: SignalMessage) => void;

export abstract class SignalingService {
  protected handlers = new Map<SignalEvent, Set<SignalHandler>>();
  protected connected = false;

  abstract connect(meetingId: string, userId: string): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: SignalMessage): void;

  on(event: SignalEvent, handler: SignalHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: SignalEvent, handler: SignalHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  protected dispatch(message: SignalMessage): void {
    this.handlers.get(message.event)?.forEach((h) => h(message));
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * StubSignalingService — placeholder signaling implementation.
 *
 * This does NOT connect to a real signaling server. It exists so the UI can
 * be built and tested without a backend. When a real signaling server is
 * available (WebSocket, Supabase Realtime, etc.), replace this with a
 * concrete implementation that extends SignalingService.
 *
 * TODO: Implement a concrete SignalingService using:
 *   - Supabase Realtime channels (broadcast presence + relay SDP/ICE)
 *   - OR a dedicated WebSocket signaling server
 */
export class StubSignalingService extends SignalingService {
  async connect(_meetingId: string, _userId: string): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.handlers.clear();
  }

  send(_message: SignalMessage): void {
    // No-op in stub mode
  }
}
