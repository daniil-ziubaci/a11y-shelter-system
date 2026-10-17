create table public.pets (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id),
  name text not null,
  species text not null check (species in ('собака', 'кошка')),
  sex text not null check (sex in ('мальчик', 'девочка')),
  birth_date date not null,
  is_age_approximate boolean not null,
  weight numeric not null check (weight > 0), -- кг, может быть дробным (0.8)
  diet text not null,
  health text not null,
  description text not null,
  status text not null default 'ищет дом' check (status in ('ищет дом', 'в процессе', 'пристроен')),
  photo_url text not null,
  photo_alt text not null
);

alter table public.pets enable row level security;
