-- Stripe payment snapshot on orders. No PII (no email, name, or address).
alter table orders add column if not exists payment_json text;
