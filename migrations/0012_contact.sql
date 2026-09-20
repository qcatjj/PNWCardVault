-- Public reviews and shop questions. No buyer accounts.
create table if not exists shop_reviews (
  id          serial primary key,
  name        text not null,
  rating      integer not null check (rating between 1 and 5),
  body        text not null,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists shop_messages (
  id          serial primary key,
  name        text not null,
  email       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists shop_reviews_created_idx on shop_reviews (created_at desc);
create index if not exists shop_messages_created_idx on shop_messages (created_at desc);
