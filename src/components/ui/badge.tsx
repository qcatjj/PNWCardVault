import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "live" | "sold" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "live" && "bg-accent/20 text-live",
        tone === "sold" && "bg-destructive/15 text-destructive",
        tone === "accent" && "bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
