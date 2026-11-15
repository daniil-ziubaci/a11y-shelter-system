begin;

select plan(10);

insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Рекс', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    insert into public.pets (id, name, species, sex, birth_date, is_age_approximate, size, health, description,
      photo_url, photo_alt, status, needs_treatment_since)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Барсик', 'собака', 'мальчик', '2024-01-01', true, 'средняя',
      'здоров', 'тест', '/test.jpg', 'тест', 'на лечении', now())
  $$,
  'volunteer inserts a pet with the columns of the panel form'
);
select lives_ok(
  $$
    update public.pets set name = 'Мурка', sex = 'девочка', health = 'здорова', description = 'новое',
      photo_url = '/new.jpg', photo_alt = 'новое', needs_treatment_since = now()
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  'volunteer updates the columns of the panel form'
);
select lives_ok(
  $$ update public.pets set status = 'в процессе' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'volunteer updates the status'
);
select throws_ok(
  $$ update public.pets set id = gen_random_uuid() where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '42501', null, 'volunteer cannot change id'
);
select throws_ok(
  $$ update public.pets set created_at = now() - interval '1 year' $$,
  '42501', null, 'volunteer cannot change created_at'
);
select throws_ok(
  $$ update public.pets set status_changed_at = now() - interval '1 year' $$,
  '42501', null, 'volunteer cannot change status_changed_at'
);
select throws_ok(
  $$ update public.pets set translations = '{"name": {"en": {"text": "x", "hash": "x"}}}'::jsonb $$,
  '42501', null, 'volunteer cannot change translations'
);
select throws_ok(
  $$
    insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description,
      photo_url, photo_alt, translations)
    values ('Тест', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', '{}'::jsonb)
  $$,
  '42501', null, 'volunteer cannot insert translations'
);
select throws_ok(
  $$
    insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description,
      photo_url, photo_alt, created_at)
    values ('Тест', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', now())
  $$,
  '42501', null, 'volunteer cannot insert created_at'
);

reset role;
set local role service_role;

select lives_ok(
  $$ update public.pets set translations = '{"name": {"en": {"text": "Murka", "hash": "x"}}}'::jsonb where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'the service key writes translations'
);

select * from finish();

rollback;
