begin;

select plan(1);

select hasnt_column('public', 'shelters', 'volunteer_info', 'volunteer_info column is gone');

select * from finish();

rollback;
