import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setMessage("This reset link is invalid or expired. Request a new one."); return; }
    if (password.length < 8) { setMessage("Use at least eight characters."); return; }
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      setMessage(result.error ? "This reset link is invalid or expired. Request a new one." : "Password updated. You can now sign in.");
    } catch {
      setMessage("Unable to reset password. Please request a new link.");
    } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-4 py-16"><h1 className="text-3xl font-bold">Choose a new password</h1>
    <form onSubmit={submit} className="mt-6 space-y-4"><label className="block">New password
      <input className="mt-2 w-full rounded border p-3 text-foreground bg-background" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button className="rounded bg-primary px-5 py-3 text-primary-foreground" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
    </form>
    {message && <p role="status" className="mt-4">{message}</p>}
    <p className="mt-6"><Link to="/forgot-password" className="underline">Request a new link</Link></p>
  </main>;
}
