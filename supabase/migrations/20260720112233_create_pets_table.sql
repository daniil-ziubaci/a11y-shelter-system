create table pets (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null,

  name text not null,
  sex text not null check (sex in ('самец', 'самка')),
  age_in_months integer not null,
  weight numeric not null,
  diet text not null check (diet in ('сухой корм', 'консервы', 'натуральное питание')),

  photo_url text,
  photo_alt text,

  description text,
  health text,

  status text not null default 'ищет дом'
    check (status in ('ищет дом', 'в процессе', 'пристроен')),

  created_at timestamptz not null default now()
);