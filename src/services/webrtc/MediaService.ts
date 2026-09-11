import type { MediaDevice, MediaSettings } from '@/types';

export class MediaService {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  async getLocalStream(settings: MediaSettings): Promise<MediaStream> {
    await this.stopLocalStream();

    const constraints: MediaStreamConstraints = {
      audio: settings.audioEnabled
        ? {
            deviceId: settings.selectedAudioDevice
              ? { exact: settings.selectedAudioDevice }
              : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false,
      video: settings.videoEnabled
        ? {
            deviceId: settings.selectedVideoDevice
              ? { exact: settings.selectedVideoDevice }
              : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.localStream;
  }

  async getScreenStream(): Promise<MediaStream> {
    this.stopScreenStream();
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30 } },
      audio: false,
    });
    return this.screenStream;
  }

  stopScreenStream(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
  }

  stopLocalStream(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    return Promise.resolve();
  }

  getLocalStreamValue(): MediaStream | null {
    return this.localStream;
  }

  toggleAudio(enabled: boolean): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  toggleVideo(enabled: boolean): void {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  async enumerateDevices(): Promise<MediaDevice[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.map((d) => ({
      deviceId: d.deviceId,
      label: d.label || `${d.kind}`,
      kind: d.kind,
    }));
  }

  switchAudioInput(deviceId: string, settings: MediaSettings): Promise<MediaStream> {
    return this.getLocalStream({ ...settings, selectedAudioDevice: deviceId });
  }

  switchVideoInput(deviceId: string, settings: MediaSettings): Promise<MediaStream> {
    return this.getLocalStream({ ...settings, selectedVideoDevice: deviceId });
  }
}

export const mediaService = new MediaService();
