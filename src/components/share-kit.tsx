import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listingPath, type Product } from "@/lib/catalog-types";

export function ShareKit({ product }: { product: Product }) {
  const [copied, setCopied] = useState(false);
  const path = listingPath(product);

  async function copy() {
    const text = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Buy link copied.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.message(text);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" onClick={() => void copy()} className="w-full">
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
        {copied ? "Link copied" : "Copy buy link"}
      </Button>
      {product.shortCode ? (
        <p className="text-xs text-muted-foreground">
          Short link <span className="tabular-nums text-foreground">/v/{product.shortCode}</span>
        </p>
      ) : null}
    </div>
  );
}
