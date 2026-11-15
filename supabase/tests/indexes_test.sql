begin;

select plan(4);

select has_index('public', 'purchase_log', 'purchase_log_item_id_idx', array['item_id'], 'purchase_log has an index on item_id');
select has_index('public', 'pets', 'pets_status_idx', array['status'], 'pets has an index on status');

insert into public.shelter (name, is_published) values ('Shelter A', true);

insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, status)
select 'Кот ' || n, 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
  case when n % 100 = 0 then 'в процессе' else 'пристроен' end
from generate_series(1, 5000) as n;

insert into public.purchase_items (id, name, category, unit, remaining)
select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, 'Корм ' || n, 'корм', 'кг', 0
from generate_series(1, 50) as n;

insert into public.purchase_log (item_id, amount)
select ('00000000-0000-0000-0000-' || lpad((n % 50 + 1)::text, 12, '0'))::uuid, 1
from generate_series(1, 5000) as n;

analyze public.pets;
analyze public.purchase_log;

create function pg_temp.plan_of(query text) returns text
  language plpgsql
  as $$
  declare
    line text;
    result text := '';
  begin
    for line in execute 'explain ' || query loop
      result := result || line || E'\n';
    end loop;
    return result;
  end;
  $$;

select matches(
  pg_temp.plan_of($$ select id from public.pets where status = 'в процессе' $$),
  'pets_status_idx',
  'a search by status uses pets_status_idx on 5000 animals'
);
select matches(
  pg_temp.plan_of($$ select id from public.purchase_log where item_id = '00000000-0000-0000-0000-000000000007' $$),
  'purchase_log_item_id_idx',
  'a search by item uses purchase_log_item_id_idx on 5000 records'
);

select * from finish();

rollback;
