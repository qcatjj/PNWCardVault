import type { CardBrand } from "@/lib/stripe-test";
import { cn } from "@/lib/utils";

export function StripeWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 text-muted-foreground", className)}>
      <span className="text-xs">Pay with</span>
      <span className="font-sans text-sm font-semibold tracking-tight text-foreground">stripe</span>
    </span>
  );
}

export function CardBrandMark({ brand }: { brand: CardBrand }) {
  if (brand === "visa") {
    return (
      <svg viewBox="0 0 32 20" className="h-4 w-6" aria-hidden>
        <text
          x="16"
          y="14"
          textAnchor="middle"
          fill="currentColor"
          fontSize="9"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          VISA
        </text>
      </svg>
    );
  }
  if (brand === "amex") {
    return (
      <svg viewBox="0 0 32 20" className="h-4 w-6" aria-hidden>
        <text
          x="16"
          y="14"
          textAnchor="middle"
          fill="currentColor"
          fontSize="7"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          AMEX
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 20" className="h-4 w-6" aria-hidden>
      <circle cx="12" cy="10" r="6" fill="currentColor" opacity="0.55" />
      <circle cx="20" cy="10" r="6" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
