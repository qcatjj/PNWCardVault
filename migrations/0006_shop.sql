-- Shop photos: remote URL or inlined data URL. Existing image_key art stays.
alter table products add column if not exists image_url text;
