ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sale_commission_pct numeric, ADD COLUMN IF NOT EXISTS seasonal_commission_pct numeric, ADD COLUMN IF NOT EXISTS annual_first_rent_pct numeric, ADD COLUMN IF NOT EXISTS annual_admin_fee_pct numeric, ADD COLUMN IF NOT EXISTS neighborhood text, ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
CREATE OR REPLACE FUNCTION public.list_approved_agents_details()
RETURNS TABLE(id uuid, account_type account_type, full_name text, company_name text, creci text, creci_uf text, city text, phone text, whatsapp text, email text, address text, website text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select p.id, p.account_type, p.full_name, p.company_name, p.creci, p.creci_uf, p.city, p.phone, p.whatsapp, p.email, p.address, p.website
  from public.profiles p
  where p.account_type in ('broker','agency') and p.creci_status = 'approved'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'admin'))
  order by p.full_name
$$;
REVOKE ALL ON FUNCTION public.list_approved_agents_details() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_approved_agents_details() TO authenticated;