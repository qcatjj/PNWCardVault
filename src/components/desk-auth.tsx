import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { OWNER_EMAIL, isOwnerEmail } from "@/lib/owner-email";

const PREVIEW_BEARER_KEY = "grok-auth.bearer-token";

/** Preview iframe cookies are partitioned — keep the session token the same way Google/X popup does. */
function keepPreviewSession(result: { data?: { token?: string | null } | null } | null | undefined) {
  const token = result?.data?.token;
  if (typeof token !== "string" || !token) return;
  try {
    window.sessionStorage.setItem(PREVIEW_BEARER_KEY, token);
  } catch {
    /* storage blocked — cookie path may still work */
  }
}

export function DeskAuth({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(OWNER_EMAIL);
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
    if (!isOwnerEmail(trimmed)) {
      toast.error("This desk only opens for the owner email.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password needs at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
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
            ? "That email is already in use. Check the password."
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
      toast.error(err instanceof Error ? err.message : "Sign-in was blocked. Use the owner email on iPhone.");
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onEmail} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="desk-email">Owner email</Label>
          <Input
            id="desk-email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desk-password">Password</Label>
          <Input
            id="desk-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Opening…" : "Open desk"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Locked to the owner inbox. First time, pick a password. Use email on iPhone — Google and X often get blocked here.
      </p>
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
