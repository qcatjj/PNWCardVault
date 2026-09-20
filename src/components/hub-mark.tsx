import { cn } from "@/lib/utils";

const SPOKES = [0, 60, 120, 180, 240, 300];

export function HubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-primary", className)} aria-hidden>
      <circle cx="16" cy="16" r="14.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
      {SPOKES.map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={16 + Math.cos(a) * 5.6}
            y1={16 + Math.sin(a) * 5.6}
            x2={16 + Math.cos(a) * 13.4}
            y2={16 + Math.sin(a) * 13.4}
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinecap="square"
          />
        );
      })}
    </svg>
  );
}

export function HubHalo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("text-border", className)} aria-hidden>
      <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="100" cy="100" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {SPOKES.map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={100 + Math.cos(a) * 36}
            y1={100 + Math.sin(a) * 36}
            x2={100 + Math.cos(a) * 88}
            y2={100 + Math.sin(a) * 88}
            stroke="currentColor"
            strokeWidth="2"
          />
        );
      })}
      <circle cx="100" cy="100" r="10" fill="currentColor" />
    </svg>
  );
}
