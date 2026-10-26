import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await authClient.requestPasswordReset({ email: email.trim().toLowerCase(), redirectTo: "/reset-password" });
    } finally {
      setBusy(false);
      setSent(true);
    }
  }
  return <main className="mx-auto max-w-md px-4 py-16"><h1 className="text-3xl font-bold">Reset your password</h1>
    {sent ? <p className="mt-4">If an account exists for that email, a password reset link will be sent. Check your inbox and spam folder.</p> :
      <form onSubmit={submit} className="mt-6 space-y-4"><label className="block">Account email
        <input className="mt-2 w-full rounded border p-3 text-foreground bg-background" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <button className="rounded bg-primary px-5 py-3 text-primary-foreground" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      </form>}
    <p className="mt-6"><Link to="/login" className="underline">Back to sign in</Link></p>
  </main>;
}
