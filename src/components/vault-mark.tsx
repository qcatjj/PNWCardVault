import { cn } from "@/lib/utils";

const TICKS = [0, 45, 90, 135, 180, 225, 270, 315];

export function VaultMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-primary", className)} aria-hidden>
      <circle cx="16" cy="16" r="14.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="9.4" fill="none" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="16" cy="16" r="3.1" fill="currentColor" />
      {TICKS.map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={16 + Math.cos(a) * 11.1}
            y1={16 + Math.sin(a) * 11.1}
            x2={16 + Math.cos(a) * 13.5}
            y2={16 + Math.sin(a) * 13.5}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="square"
          />
        );
      })}
    </svg>
  );
}

export function VaultHalo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("text-border", className)} aria-hidden>
      <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="100" cy="100" r="64" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
      {TICKS.map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={100 + Math.cos(a) * 70}
            y1={100 + Math.sin(a) * 70}
            x2={100 + Math.cos(a) * 88}
            y2={100 + Math.sin(a) * 88}
            stroke="currentColor"
            strokeWidth="2"
          />
        );
      })}
      <circle cx="100" cy="100" r="8" fill="currentColor" />
    </svg>
  );
}
