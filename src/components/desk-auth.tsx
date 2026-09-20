import { Delete } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { checkDeskEmail, checkDeskPin } from "@/lib/desk-gate";
import { cn } from "@/lib/utils";

const PREVIEW_BEARER_KEY = "grok-auth.bearer-token";
const PIN_UNLOCK_KEY = "pnw-desk-pin-ok";

function keepPreviewSession(result: { data?: { token?: string | null } | null } | null | undefined) {
  const token = result?.data?.token;
  if (typeof token !== "string" || !token) return;
  try {
    window.sessionStorage.setItem(PREVIEW_BEARER_KEY, token);
  } catch {
    /* storage blocked */
  }
}

function pinUnlocked() {
  try {
    return window.sessionStorage.getItem(PIN_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberPinUnlock() {
  try {
    window.sessionStorage.setItem(PIN_UNLOCK_KEY, "1");
  } catch {
    /* storage blocked — PIN still works this visit */
  }
}

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function DeskAuth({ onDone }: { onDone?: () => void }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(pinUnlocked());
  }, []);

  if (!unlocked) {
    return (
      <DeskPin
        onUnlock={() => {
          rememberPinUnlock();
          setUnlocked(true);
        }}
      />
    );
  }

  return <DeskSignIn onDone={onDone} />;
}

function DeskPin({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(next: string) {
    if (busy || next.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      await checkDeskPin({ data: { pin: next } });
      onUnlock();
    } catch {
      setError("Wrong PIN.");
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  function tap(key: string) {
    if (busy || key === "") return;
    if (key === "del") {
      setPin((value) => value.slice(0, -1));
      setError(null);
      return;
    }
    const next = (pin + key).slice(0, 6);
    setPin(next);
    setError(null);
    if (next.length >= 4) void submit(next);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "size-3 rounded-full border",
              index < pin.length ? "border-primary bg-primary" : "border-border bg-foreground/5",
            )}
          />
        ))}
      </div>
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
      <div className="grid grid-cols-3 gap-2">
        {PAD.map((key, index) =>
          key === "" ? (
            <span key={index} />
          ) : (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => tap(key)}
              className="grid h-14 place-items-center rounded-xl border border-border bg-foreground/5 font-display text-xl hover:bg-muted disabled:opacity-50"
            >
              {key === "del" ? <Delete className="size-5" /> : key}
            </button>
          ),
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {busy ? "Checking…" : "Staff PIN. Shop stays public."}
      </p>
    </div>
  );
}

function DeskSignIn({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish() {
    try {
      await authClient.getSession();
    } catch {
      /* session store will recover */
    }
    toast.success("Desk is open.");
    if (onDone) onDone();
    else await navigate({ to: "/desk" });
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (password.length < 8) {
      toast.error("Password needs at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await checkDeskEmail({ data: { email: trimmed } });
      const signedIn = await authClient.signIn.email({
        email: trimmed,
        password,
        rememberMe: true,
      });
      if (!signedIn.error) {
        keepPreviewSession(signedIn);
        await finish();
        return;
      }
      const created = await authClient.signUp.email({
        email: trimmed,
        password,
        name: "Owner",
      });
      if (created.error) {
        toast.error(
          created.error.message?.toLowerCase().includes("exist")
            ? "Check the password."
            : signedIn.error.message || created.error.message || "Could not open the desk.",
        );
        return;
      }
      keepPreviewSession(created);
      await finish();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the desk.");
    } finally {
      setBusy(false);
    }
  }

  function onOauth(providerId: string) {
    void signIn(providerId, { callbackURL: "/desk" }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Sign-in was blocked. Use email on iPhone.");
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onEmail} className="space-y-3" autoComplete="off">
        <div className="space-y-2">
          <Label htmlFor="desk-email">Email</Label>
          <Input
            id="desk-email"
            name="desk-user"
            type="email"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desk-password">Password</Label>
          <Input
            id="desk-password"
            name="desk-pass"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Opening…" : "Open desk"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">Use email on iPhone — Google and X often get blocked there.</p>
      <div className="space-y-2">
        {GROK_PROVIDERS.map((provider) => (
          <Button
            key={provider.providerId}
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy}
            onClick={() => onOauth(provider.providerId)}
          >
            Continue with {provider.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
