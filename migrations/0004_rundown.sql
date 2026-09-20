-- Tonight's show rundown: ordered queue of listings on the block.
alter table products add column if not exists queue_pos integer;

create index if not exists products_queue_pos_idx on products (queue_pos);

update products set queue_pos = 10 where slug = 'cooper-flagg-chrome-rc';
update products set queue_pos = 20 where slug = 'wemby-prizm-rc-silver';
update products set queue_pos = 30 where slug = 'sga-prizm-silver-psa10';
update products set queue_pos = 40 where slug = 'jalen-williams-prizm';
update products set queue_pos = 50 where slug = '2026-prizm-hobby-spot';
update products set queue_pos = 60 where slug = 'caitlin-clark-prizm-silver';
update products set queue_pos = 70 where slug = 'paige-bueckers-green-laser';
update products set queue_pos = 80 where slug = 'napheesa-collier-auto-99';
update products set queue_pos = 90 where slug = 'aja-wilson-optic-holo';
update products set queue_pos = 100 where slug = 'bo-nix-prizm-rc';
update products set queue_pos = 110 where slug = 'antihero-chrome-001';
