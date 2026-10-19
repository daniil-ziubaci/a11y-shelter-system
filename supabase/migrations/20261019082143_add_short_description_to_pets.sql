alter table pets
  add column short_description text not null default ''
  check (char_length(short_description) <= 160);