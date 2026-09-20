import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({
  path,
  title,
  label = "Copy buy link",
}: {
  path: string;
  title: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Buy link copied — anyone with it can purchase.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.message(url);
    }
    void title;
  }

  return (
    <Button type="button" variant="secondary" onClick={share} className="w-full sm:w-auto">
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copied ? "Link copied" : label}
    </Button>
  );
}
