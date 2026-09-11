import { useState, useEffect, useCallback } from 'react';
import type { MediaDevice } from '@/types';
import { mediaService } from '@/services/webrtc';

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const startPreview = useCallback(async () => {
    setError(null);
    try {
      const s = await mediaService.getLocalStream({
        audioEnabled,
        videoEnabled,
        selectedAudioDevice: selectedAudio,
        selectedVideoDevice: selectedVideo,
        selectedAudioOutput: null,
      });
      setStream(s);
      const d = await mediaService.enumerateDevices();
      setDevices(d);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access camera/microphone. Check browser permissions.'
      );
    } finally {
      setLoading(false);
    }
  }, [audioEnabled, videoEnabled, selectedAudio, selectedVideo]);

  useEffect(() => {
    startPreview();
    return () => {
      mediaService.stopLocalStream();
    };
  }, [startPreview]);

  const refreshDevices = useCallback(async () => {
    const d = await mediaService.enumerateDevices();
    setDevices(d);
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      mediaService.toggleAudio(next);
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoEnabled((prev) => {
      const next = !prev;
      mediaService.toggleVideo(next);
      return next;
    });
  }, []);

  return {
    devices,
    loading,
    error,
    stream,
    audioEnabled,
    videoEnabled,
    selectedAudio,
    selectedVideo,
    setSelectedAudio,
    setSelectedVideo,
    toggleAudio,
    toggleVideo,
    refreshDevices,
    startPreview,
  };
}
