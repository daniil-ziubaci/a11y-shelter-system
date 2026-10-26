-- Files already uploaded to the bucket are not deleted by this rollback: remove them through the Storage API first, or the bucket cannot be deleted.
begin;
set local storage.allow_delete_query = 'true';
drop policy "Photo uploads require second factor" on storage.objects;
drop policy "Members upload photos to their shelter folder" on storage.objects;
delete from storage.buckets where id = 'pet-photos';
commit;