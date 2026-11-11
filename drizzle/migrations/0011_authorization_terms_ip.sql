ALTER TABLE public.authorizations ADD COLUMN IF NOT EXISTS owner_accepted_ip inet;
ALTER TABLE public.authorizations ADD COLUMN IF NOT EXISTS granted_by uuid;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorizations TO authenticated;
GRANT ALL ON public.authorizations TO service_role;
CREATE POLICY "auth admin read" ON public.authorizations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.agent_authorization_terms()
RETURNS TABLE(property_id uuid, title text, address text, city text, owner_name text, owner_document text, owner_email text, accepted_at timestamptz, accepted_ip text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.title, p.address, p.city, pr.full_name, pr.document, pr.email, COALESCE(a.owner_accepted_terms_at,a.created_at), host(a.owner_accepted_ip)
  FROM public.authorizations a JOIN public.properties p ON p.id=a.property_id JOIN public.profiles pr ON pr.id=p.owner_id
  WHERE a.agent_id=auth.uid() AND public.is_approved_agent(auth.uid())
$$;
GRANT EXECUTE ON FUNCTION public.agent_authorization_terms() TO authenticated;