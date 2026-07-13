-- Ensure BPM/block-scoped staff can see and manage leave requests for cadres
-- in their assigned block, even when older leave rows have NULL block_id.

CREATE OR REPLACE FUNCTION public.set_leave_request_block_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.block_id IS NULL THEN
    SELECT p.block_id INTO NEW.block_id
    FROM public.profiles p
    WHERE p.id = NEW.cadre_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_leave_request_block_id ON public.leave_requests;
CREATE TRIGGER trg_set_leave_request_block_id
  BEFORE INSERT OR UPDATE OF cadre_id, block_id
  ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_leave_request_block_id();

UPDATE public.leave_requests lr
SET block_id = p.block_id,
    updated_at = now()
FROM public.profiles p
WHERE lr.cadre_id = p.id
  AND lr.block_id IS NULL
  AND p.block_id IS NOT NULL;

DROP POLICY IF EXISTS "Staff manage scoped leave requests" ON public.leave_requests;
CREATE POLICY "Staff manage scoped leave requests" ON public.leave_requests
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  );

CREATE INDEX IF NOT EXISTS idx_leave_requests_cadre_block
  ON public.leave_requests(cadre_id, block_id);

NOTIFY pgrst, 'reload schema';
