CREATE TABLE public.owner_directory (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, email text, phone text, city text, address text, is_demo boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_directory TO authenticated;
GRANT ALL ON public.owner_directory TO service_role;
ALTER TABLE public.owner_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "directory admin manage" ON public.owner_directory FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
COMMENT ON TABLE public.owner_directory IS 'Administrative directory contacts; demo records are not authentication accounts and confer no property access.';