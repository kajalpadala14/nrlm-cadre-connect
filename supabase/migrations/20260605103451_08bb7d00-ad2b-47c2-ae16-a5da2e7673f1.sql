
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;

-- Storage policies for activity-photos bucket
CREATE POLICY "Cadres upload own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'activity-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Cadres read own photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'activity-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
);

CREATE POLICY "Cadres delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'activity-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
