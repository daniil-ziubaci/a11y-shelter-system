--После отката всё, что было записано в short_description, пропадёт безвозвратно.
alter table pets
  drop column short_description;