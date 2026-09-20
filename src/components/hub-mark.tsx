import { cn } from "@/lib/utils";

export function HubMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-[11px] bg-primary font-display text-lg leading-none text-primary-foreground shadow-[0_0_25px_color-mix(in_oklab,var(--color-primary)_24%,transparent)]",
        className,
      )}
      aria-hidden
    >
      H
    </span>
  );
}
