-- Single shop owner. Desk mutations require this user_id.
create table if not exists shop_owner (
  id         integer primary key check (id = 1),
  user_id    text not null,
  claimed_at timestamptz not null default now()
);
