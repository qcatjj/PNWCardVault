import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  min = 1,
  max,
  onChange,
  className,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex h-11 items-center rounded-md border border-border bg-muted", className)}>
      <button
        type="button"
        className="flex size-11 items-center justify-center text-foreground disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-sm tabular-nums">{value}</span>
      <button
        type="button"
        className="flex size-11 items-center justify-center text-foreground disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
