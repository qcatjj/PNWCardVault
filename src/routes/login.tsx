import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { DeskAuth } from "@/components/desk-auth";
import { authEnabled } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md place-items-center px-4 py-16">
      <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-5 grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Lock className="size-5" />
        </div>
        <h1 className="font-display text-3xl">Owner sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The shop stays public. This desk only opens for the owner email. On iPhone, use email — Google and X often never come back.
        </p>
        {authEnabled ? (
          <div className="mt-6">
            <DeskAuth />
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Back to the shop
          </Link>
        </p>
      </div>
    </main>
  );
}
