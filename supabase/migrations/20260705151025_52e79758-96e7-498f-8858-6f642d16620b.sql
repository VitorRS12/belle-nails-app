
-- Restrict access to the private 'database_export_04_07_26' bucket to super admins only.
CREATE POLICY "super_admin_select_db_export"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'database_export_04_07_26'
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "super_admin_insert_db_export"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'database_export_04_07_26'
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "super_admin_update_db_export"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'database_export_04_07_26'
  AND public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  bucket_id = 'database_export_04_07_26'
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "super_admin_delete_db_export"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'database_export_04_07_26'
  AND public.has_role(auth.uid(), 'super_admin')
);
