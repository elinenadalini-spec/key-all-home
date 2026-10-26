drop policy "photos public read" on storage.objects;
create policy "photos restricted read" on storage.objects for select to authenticated using (
  bucket_id = 'property-photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.agent_has_access(((storage.foldername(name))[2])::uuid, auth.uid())
    or public.has_role(auth.uid(),'admin')
  )
);