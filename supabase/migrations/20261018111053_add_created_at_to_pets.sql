alter table pets
  add column created_at timestamptz not null default now();