REVOKE ALL ON public.property_updates FROM anon,authenticated;
GRANT SELECT ON public.property_updates TO authenticated;
REVOKE ALL ON public.property_notifications FROM anon,authenticated;
GRANT SELECT ON public.property_notifications TO authenticated;
