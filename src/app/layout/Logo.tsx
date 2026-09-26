import { cn } from '@/lib/utils';

/** Brand mark: a rounded tile in the Tanzanian flag colours with a risk triangle. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9 shrink-0', className)} aria-hidden="true">
      <defs>
        <clipPath id="logo-clip">
          <rect width="64" height="64" rx="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#logo-clip)">
        <rect width="64" height="64" fill="#00a3dd" />
        <path d="M0 0 L64 0 L0 64 Z" fill="#1eb53a" />
        <path d="M-6 58 L58 -6 L70 6 L6 70 Z" fill="#fcd116" />
        <path d="M-2 62 L62 -2 L66 2 L2 66 Z" fill="#0b0f19" />
      </g>
      <circle cx="32" cy="32" r="13" fill="#fff" />
      <path d="M32 22.5 L40.5 37.5 L23.5 37.5 Z" fill="#d73027" />
      <rect x="31" y="27.5" width="2" height="5.5" rx="1" fill="#fff" />
      <circle cx="32" cy="35" r="1.1" fill="#fff" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.05rem] leading-none font-semibold tracking-tight whitespace-nowrap sm:text-[1.2rem]">
          INFORM <span className="font-normal text-muted-foreground">Tanzania</span>
        </span>
      )}
    </span>
  );
}
