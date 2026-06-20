-- Migration: 20260619180000_leave_requests_schema.sql
-- Create leave requests table, indexes, storage policies, and auto-sync triggers for attendance and notifications.

DROP TABLE IF EXISTS public.leave_requests CASCADE;

CREATE TABLE public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cadre_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
  leave_type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT leave_dates_check CHECK (to_date >= from_date),
  CONSTRAINT total_days_positive CHECK (total_days > 0)
);

-- Enable RLS on leave_requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Indexes for performance & query scoping
CREATE INDEX IF NOT EXISTS idx_leave_requests_cadre_id ON public.leave_requests(cadre_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_block_id ON public.leave_requests(block_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- RLS Policies for leave_requests
DROP POLICY IF EXISTS "Cadres read own leave requests" ON public.leave_requests;
CREATE POLICY "Cadres read own leave requests" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (cadre_id = auth.uid());

DROP POLICY IF EXISTS "Cadres insert own leave requests" ON public.leave_requests;
CREATE POLICY "Cadres insert own leave requests" ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (cadre_id = auth.uid());

DROP POLICY IF EXISTS "Cadres update own leave requests" ON public.leave_requests;
CREATE POLICY "Cadres update own leave requests" ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (cadre_id = auth.uid() AND status = 'pending')
  WITH CHECK (cadre_id = auth.uid() AND status IN ('pending', 'cancelled'));

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

-- Create storage bucket for leave attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('leave-attachments', 'leave-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket leave-attachments
DROP POLICY IF EXISTS "Cadres upload own leave attachments" ON storage.objects;
CREATE POLICY "Cadres upload own leave attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'leave-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Cadres read own leave attachments" ON storage.objects;
CREATE POLICY "Cadres read own leave attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'leave-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
);

DROP POLICY IF EXISTS "Cadres delete own leave attachments" ON storage.objects;
CREATE POLICY "Cadres delete own leave attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'leave-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Trigger: Automatically upsert attendance status as 'on_leave' when a request is approved.
CREATE OR REPLACE FUNCTION public.sync_approved_leave_to_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_date DATE;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    v_current_date := NEW.from_date;
    
    WHILE v_current_date <= NEW.to_date LOOP
      INSERT INTO public.attendance (
        cadre_id,
        block_id,
        date,
        attendance_date,
        status,
        recorded_by,
        remarks,
        created_at,
        updated_at
      )
      VALUES (
        NEW.cadre_id,
        NEW.block_id,
        v_current_date,
        v_current_date,
        'on_leave',
        NEW.approved_by,
        'Approved Leave (' || NEW.leave_type || ') - Reason: ' || COALESCE(NEW.reason, ''),
        now(),
        now()
      )
      ON CONFLICT (cadre_id, date) DO UPDATE
      SET status = 'on_leave',
          remarks = 'Approved Leave (' || NEW.leave_type || ') - Reason: ' || COALESCE(NEW.reason, ''),
          recorded_by = EXCLUDED.recorded_by,
          updated_at = now();
          
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_approved_leave_to_attendance ON public.leave_requests;
CREATE TRIGGER trg_sync_approved_leave_to_attendance
  AFTER UPDATE OF status ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_approved_leave_to_attendance();

-- Trigger: Notify block officers in same block when leave request is inserted.
CREATE OR REPLACE FUNCTION public.notify_new_leave_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cadre_name TEXT;
BEGIN
  SELECT full_name INTO v_cadre_name
  FROM public.profiles
  WHERE id = NEW.cadre_id;

  INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
  SELECT 
    p.id,
    'नया अवकाश अनुरोध / New Leave Request Received',
    'कैडर ' || COALESCE(v_cadre_name, 'Unknown') || ' ने ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' से ' || to_char(NEW.to_date, 'YYYY-MM-DD') || ' तक अवकाश के लिए आवेदन किया है। / Cadre ' || COALESCE(v_cadre_name, 'Unknown') || ' has applied for leave from ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' to ' || to_char(NEW.to_date, 'YYYY-MM-DD') || '.',
    'info',
    false,
    now()
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.block_id = NEW.block_id
    AND ur.role = 'block_officer';
    
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_leave_request ON public.leave_requests;
CREATE TRIGGER trg_notify_new_leave_request
  AFTER INSERT ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_leave_request();

-- Trigger: Notify cadre when leave status is updated to 'approved' or 'rejected'.
CREATE OR REPLACE FUNCTION public.notify_leave_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_msg TEXT;
  v_type TEXT;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    v_title := 'अवकाश स्वीकृत / Leave Approved';
    v_msg := 'आपका ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' से ' || to_char(NEW.to_date, 'YYYY-MM-DD') || ' तक का अवकाश स्वीकृत कर दिया गया है। / Your leave from ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' to ' || to_char(NEW.to_date, 'YYYY-MM-DD') || ' has been approved.';
    v_type := 'success';
  ELSIF NEW.status = 'rejected' THEN
    v_title := 'अवकाश अस्वीकृत / Leave Rejected';
    v_msg := 'आपका ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' से ' || to_char(NEW.to_date, 'YYYY-MM-DD') || ' तक का अवकाश अस्वीकृत कर दिया गया है। कारण: ' || COALESCE(NEW.approval_remarks, '') || ' / Your leave from ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' to ' || to_char(NEW.to_date, 'YYYY-MM-DD') || ' has been rejected. Reason: ' || COALESCE(NEW.approval_remarks, '');
    v_type := 'error';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
  VALUES (NEW.cadre_id, v_title, v_msg, v_type, false, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_leave_status_change ON public.leave_requests;
CREATE TRIGGER trg_notify_leave_status_change
  AFTER UPDATE OF status ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_leave_status_change();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
