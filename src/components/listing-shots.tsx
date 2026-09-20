import { Camera, ImagePlus, LoaderCircle, Sparkles } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { fileToListingImage } from "@/lib/resize-image";
import { cn } from "@/lib/utils";

export type PhotoMode = "raw" | "enhanced";

type Props = {
  front: string | null;
  back: string | null;
  onFront: (url: string | null) => void;
  onBack: (url: string | null) => void;
  stockNote?: string | null;
  reading?: boolean;
  mode: PhotoMode;
  onModeChange: (mode: PhotoMode) => void;
  enhancingFront?: boolean;
  enhancingBack?: boolean;
};

export function ListingShots({
  front,
  back,
  onFront,
  onBack,
  stockNote,
  reading,
  mode,
  onModeChange,
  enhancingFront,
  enhancingBack,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <ShotSlot label="Front" value={front} onChange={onFront} reading={reading} enhancing={enhancingFront} />
        <ShotSlot label="Back" value={back} onChange={onBack} enhancing={enhancingBack} />
      </div>
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => onModeChange("raw")}
          className={cn(
            "h-11 flex-1 rounded-md text-sm",
            mode === "raw" ? "bg-card text-foreground" : "text-muted-foreground",
          )}
        >
          Raw photo
        </button>
        <button
          type="button"
          onClick={() => onModeChange("enhanced")}
          className={cn(
            "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md text-sm",
            mode === "enhanced" ? "bg-card text-foreground" : "text-muted-foreground",
          )}
        >
          <Sparkles className="size-3.5" />
          AI enhance
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {mode === "enhanced"
          ? "Studio listing shot, like a shop scan. The listing will say this is a depiction of the card."
          : "Buyers see the photo you took, unedited."}
      </p>
      {stockNote ? <p className="text-xs text-muted-foreground">{stockNote}</p> : null}
    </div>
  );
}

function ShotSlot({
  label,
  value,
  onChange,
  reading,
  enhancing,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  reading?: boolean;
  enhancing?: boolean;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = Boolean(reading || enhancing);

  async function onFile(file: File | undefined, input: HTMLInputElement) {
    input.value = "";
    if (!file) return;
    try {
      const data = await fileToListingImage(file);
      onChange(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not use that photo.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => camRef.current?.click()}
        className="relative block w-full overflow-hidden rounded-lg border border-border bg-card"
      >
        {value ? (
          <img src={value} alt={`${label} of card`} className="aspect-[2.5/3.5] w-full object-cover" />
        ) : (
          <div className="flex aspect-[2.5/3.5] flex-col items-center justify-center gap-2 px-3 text-muted-foreground">
            <Camera className="size-8" />
            <span className="text-sm font-medium text-foreground">Take {label.toLowerCase()}</span>
            <span className="text-xs">{label === "Front" ? "Required" : "Helps the buyer"}</span>
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              {enhancing ? "Enhancing…" : "Reading card…"}
            </div>
          </div>
        ) : null}
      </button>
      <div className="flex items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ImagePlus className="size-3.5" />
          Library
        </button>
        {value ? (
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground">
            Clear
          </button>
        ) : (
          <span className="text-muted-foreground">{label}</span>
        )}
      </div>
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0], event.currentTarget)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0], event.currentTarget)}
      />
    </div>
  );
}
