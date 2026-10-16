create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  currency text not null,
  created_at timestamptz not null default now()
);

alter table public.shelters enable row level security;
