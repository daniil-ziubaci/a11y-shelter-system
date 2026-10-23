create table public.shelter_members (
  shelter_id uuid not null references public.shelters (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (user_id, shelter_id)
);

alter table public.shelter_members enable row level security;