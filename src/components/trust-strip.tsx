import { Lock, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export const TRUST_TEXT =
  "$6 tracked USPS shipping · Ships from Selah, WA · Secure Stripe checkout";

export function TrustStrip({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <ul
      aria-label="Shipping and checkout"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted-foreground",
        !compact && "justify-center rounded-xl border border-border bg-card/70 px-3 py-2",
        className,
      )}
    >
      <li className="inline-flex items-center gap-1.5">
        <Truck className="size-3.5 text-primary" /> $6 tracked USPS shipping
      </li>
      <li className="inline-flex items-center gap-1.5">
        <MapPin className="size-3.5 text-primary" /> Ships from Selah, WA
      </li>
      <li className="inline-flex items-center gap-1.5">
        <Lock className="size-3.5 text-primary" /> Secure Stripe checkout
      </li>
    </ul>
  );
}
