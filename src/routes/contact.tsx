import { createFileRoute } from "@tanstack/react-router";
import { Mail, Star } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listReviews, postQuestion, postReview, SHOP_EMAIL, type ShopReview } from "@/lib/contact";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  loader: () => listReviews(),
  component: ContactPage,
});

function ContactPage() {
  const initial = Route.useLoaderData();
  const [reviews, setReviews] = useState(initial);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
        <span className="live-dot size-2 rounded-full bg-primary" />
        Contact
      </p>
      <h1 className="mt-3 text-4xl md:text-6xl">Talk to the shop</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
        Questions go to {SHOP_EMAIL}. Leave a review if you bought a card — no account needed.
      </p>

      <a
        href={`mailto:${SHOP_EMAIL}`}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-foreground/5 px-4 text-sm font-semibold hover:bg-muted"
      >
        <Mail className="size-4 text-primary" />
        {SHOP_EMAIL}
      </a>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <QuestionForm />
        <ReviewForm
          onPosted={(review) => {
            setReviews((current) => [review, ...current.filter((item) => item.id !== review.id)]);
          }}
        />
      </div>

      <section className="mt-14">
        <h2 className="text-3xl md:text-4xl">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="mt-6 rounded-[20px] border border-border bg-card px-6 py-14 text-center">
            <p className="font-display text-3xl">No reviews yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Be the first. Name, stars, a few lines about the card.</p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-[20px] border border-border bg-card p-5">
                <Stars value={review.rating} />
                <p className="mt-3 text-sm leading-relaxed">{review.body}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {review.name}
                  {review.createdAt ? ` · ${formatDay(review.createdAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function QuestionForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await postQuestion({ data: { name, email, body, company: trap } });
      toast.success(`Sent. We’ll reply from ${SHOP_EMAIL}.`);
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative rounded-[24px] border border-border bg-card p-5 sm:p-6">
      <h2 className="text-2xl">Ask a question</h2>
      <p className="mt-1 text-sm text-muted-foreground">We read these at the desk and reply by email.</p>
      <Trap value={trap} onChange={setTrap} />
      <div className="mt-5 space-y-3">
        <Field label="Name" htmlFor="q-name">
          <Input id="q-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" maxLength={40} />
        </Field>
        <Field label="Your email" htmlFor="q-email">
          <Input
            id="q-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Where we reply"
            autoComplete="email"
          />
        </Field>
        <Field label="Question" htmlFor="q-body">
          <Textarea
            id="q-body"
            required
            minLength={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Sizing, shipping, a card in the case…"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Send question"}
        </Button>
      </div>
    </form>
  );
}

function ReviewForm({ onPosted }: { onPosted: (review: ShopReview) => void }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const review = await postReview({ data: { name, rating, body, company: trap } });
      toast.success("Review posted.");
      setBody("");
      onPosted(review);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post that review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative rounded-[24px] border border-border bg-card p-5 sm:p-6">
      <h2 className="text-2xl">Leave a review</h2>
      <p className="mt-1 text-sm text-muted-foreground">No login. Shows on this page after you post.</p>
      <Trap value={trap} onChange={setTrap} />
      <div className="mt-5 space-y-3">
        <Field label="Name" htmlFor="r-name">
          <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Collector" maxLength={40} />
        </Field>
        <div className="space-y-2">
          <Label>Stars</Label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <Field label="Review" htmlFor="r-body">
          <Textarea
            id="r-body"
            required
            minLength={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="How was the card, the pack, the ship?"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Posting…" : "Post review"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Trap({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          className="grid size-11 place-items-center rounded-xl border border-border bg-foreground/5"
        >
          <Star className={cn("size-5", star <= value ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5`}>
      {stars.map((star) => (
        <Star key={star} className={cn("size-4", star <= value ? "fill-primary text-primary" : "text-muted-foreground")} />
      ))}
    </div>
  );
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
