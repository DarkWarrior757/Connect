export function generateMeetingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''),
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join(''),
  ];
  return segments.join('-');
}

export function buildMeetingLink(code: string): string {
  const base = window.location.origin;
  return `${base}/join?code=${code}`;
}

export function parseMeetingCode(input: string): string | null {
  const trimmed = input.trim();

  // Full URL: https://...?code=abc-1234
  const urlMatch = trimmed.match(/[?&]code=([^&]+)/);
  if (urlMatch) return urlMatch[1];

  // Direct code: abc-1234
  if (/^[a-z]{3}-\d{4}$/i.test(trimmed)) return trimmed.toLowerCase();

  return null;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-accent-500',
    'bg-navy-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-error-500',
    'bg-accent-600',
    'bg-navy-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
