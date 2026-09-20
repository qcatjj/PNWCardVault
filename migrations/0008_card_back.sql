-- Back-of-card photo for listings.
alter table products add column if not exists image_url_back text;
