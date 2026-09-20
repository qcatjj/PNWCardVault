-- Replay-safe Stripe checkout: one session can only become one vault order.
alter table orders add column if not exists stripe_session_id text unique;
