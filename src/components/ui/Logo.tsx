import { Video } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const iconSizes = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/20`}>
        <Video className="h-1/2 w-1/2 text-navy-950" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold text-navy-50 tracking-tight`}>
          Connect
        </span>
      )}
    </div>
  );
}
