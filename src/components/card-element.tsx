import { CreditCard } from "lucide-react";
import type { ChangeEvent } from "react";
import { CardBrandMark } from "@/components/stripe-mark";
import {
  type CardValue,
  detectBrand,
  formatCardNumber,
  formatExpiry,
  parseExpiry,
} from "@/lib/stripe-test";
import { cn } from "@/lib/utils";

export function CardElement({
  value,
  onChange,
  error,
}: {
  value: CardValue;
  onChange: (value: CardValue) => void;
  error?: string | null;
}) {
  const digits = value.number.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const expiryDisplay = [value.expMonth, value.expYear].filter(Boolean).join(" / ");

  function onNumber(event: ChangeEvent<HTMLInputElement>) {
    const max = detectBrand(event.target.value.replace(/\D/g, "")) === "amex" ? 15 : 16;
    const raw = event.target.value.replace(/\D/g, "").slice(0, max);
    onChange({ ...value, number: raw });
  }

  function onExpiry(event: ChangeEvent<HTMLInputElement>) {
    const parsed = parseExpiry(event.target.value);
    onChange({ ...value, expMonth: parsed.month, expYear: parsed.year });
  }

  function onCvc(event: ChangeEvent<HTMLInputElement>) {
    const max = brand === "amex" ? 4 : 3;
    onChange({ ...value, cvc: event.target.value.replace(/\D/g, "").slice(0, max) });
  }

  return (
    <div>
      <div
        className={cn(
          "overflow-hidden rounded-md border bg-muted transition-[box-shadow,border-color] duration-150 focus-within:ring-2 focus-within:ring-ring/70",
          error ? "border-destructive" : "border-input",
        )}
      >
        <label className="flex items-center gap-2 px-3">
          <span className="text-muted-foreground">
            {brand === "unknown" ? <CreditCard className="size-4" /> : <CardBrandMark brand={brand} />}
          </span>
          <input
            id="card-number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="Card number"
            aria-label="Card number"
            value={formatCardNumber(value.number)}
            onChange={onNumber}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="grid grid-cols-2 border-t border-input">
          <input
            id="card-exp"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM / YY"
            aria-label="Expiration"
            value={formatExpiry(expiryDisplay)}
            onChange={onExpiry}
            className="h-11 min-w-0 bg-transparent px-3 text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
          <input
            id="card-cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === "amex" ? "CVV" : "CVC"}
            aria-label="Security code"
            value={value.cvc}
            onChange={onCvc}
            className="h-11 min-w-0 border-l border-input bg-transparent px-3 text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
