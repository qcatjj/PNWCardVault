-- AI-enhanced listing photos are a depiction of the card, not a raw shot.
alter table products add column if not exists image_depiction boolean not null default false;
