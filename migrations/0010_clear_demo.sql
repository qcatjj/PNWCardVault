-- Preview sample cards are not dad's inventory. Live vault starts empty.
delete from products where slug in (
  'cooper-flagg-chrome-rc',
  'caitlin-clark-prizm-silver',
  'sga-prizm-silver-psa10',
  'paige-bueckers-green-laser',
  'wemby-prizm-rc-silver',
  'aja-wilson-optic-holo',
  'angel-reese-select',
  'jalen-williams-prizm',
  'napheesa-collier-auto-99',
  'kahleah-copper-patch',
  'bo-nix-prizm-rc',
  'julio-rodriguez-chrome',
  'antihero-chrome-001',
  'rain-city-sticker-12',
  '2026-prizm-hobby-spot',
  '2026-wnba-fotl-spot',
  'chet-holmgren-optic',
  'sga-donruss-base'
);
