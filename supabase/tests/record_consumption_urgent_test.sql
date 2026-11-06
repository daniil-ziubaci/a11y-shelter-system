begin;

select plan(6);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.purchase_items (id, shelter_id, name, category, unit, remaining, is_urgent) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Закрытая', 'корм', 'кг', 0, true),
  ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Запас', 'корм', 'кг', -5, true),
  ('d0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Нужда', 'корм', 'кг', 5, true);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000001', 3)),
  3::numeric,
  'a closed item becomes a need again'
);

select is(
  (select is_urgent from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  false,
  'a closed item returns without the urgent mark'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000002', 8)),
  3::numeric,
  'a used-up stock becomes a need'
);

select is(
  (select is_urgent from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000002'),
  false,
  'an item returning from stock is not urgent'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000003', 2)),
  7::numeric,
  'consumption adds to an existing need'
);

select is(
  (select is_urgent from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000003'),
  true,
  'an item that was already a need stays urgent'
);

select * from finish();

rollback;
