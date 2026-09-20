alter table products add column if not exists short_code text;
alter table products add column if not exists on_block boolean not null default false;

update products set short_code = 'FLAG' where slug = 'cooper-flagg-chrome-rc' and short_code is null;
update products set short_code = 'CLARK' where slug = 'caitlin-clark-prizm-silver' and short_code is null;
update products set short_code = 'SGA10' where slug = 'sga-prizm-silver-psa10' and short_code is null;
update products set short_code = 'PAIGE' where slug = 'paige-bueckers-green-laser' and short_code is null;
update products set short_code = 'WEMBY' where slug = 'wemby-prizm-rc-silver' and short_code is null;
update products set short_code = 'AJA' where slug = 'aja-wilson-optic-holo' and short_code is null;
update products set short_code = 'REESE' where slug = 'angel-reese-select' and short_code is null;
update products set short_code = 'JALEN' where slug = 'jalen-williams-prizm' and short_code is null;
update products set short_code = 'PHEESA' where slug = 'napheesa-collier-auto-99' and short_code is null;
update products set short_code = 'COPPER' where slug = 'kahleah-copper-patch' and short_code is null;
update products set short_code = 'NIX' where slug = 'bo-nix-prizm-rc' and short_code is null;
update products set short_code = 'JULIO' where slug = 'julio-rodriguez-chrome' and short_code is null;
update products set short_code = 'HERO' where slug = 'antihero-chrome-001' and short_code is null;
update products set short_code = 'BOG' where slug = 'rain-city-sticker-12' and short_code is null;
update products set short_code = 'PRIZM' where slug = '2026-prizm-hobby-spot' and short_code is null;
update products set short_code = 'FOTL' where slug = '2026-wnba-fotl-spot' and short_code is null;
update products set short_code = 'CHET' where slug = 'chet-holmgren-optic' and short_code is null;
update products set short_code = 'SGABASE' where slug = 'sga-donruss-base' and short_code is null;

update products set on_block = false;
update products set on_block = true where slug = 'cooper-flagg-chrome-rc' and qty > 0;

create unique index if not exists products_short_code_idx on products (short_code);

insert into orders (code, items_json, total_cents, status)
select 'PNW-SOLD1',
  '[{"productId":17,"slug":"chet-holmgren-optic","title":"Chet Holmgren Donruss Optic","qty":1,"priceCents":1100,"imageKey":"bball-chrome"}]',
  1100,
  'placed'
where not exists (select 1 from orders where code = 'PNW-SOLD1');
