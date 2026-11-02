DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.save_property_change(uuid,uuid,inet,jsonb,jsonb)'::regprocedure) INTO definition;
 definition := replace(definition,
 'WHERE id=_property_id AND owner_id=_actor AND public.has_role(_actor,''owner'') FOR UPDATE;',
 'WHERE id=_property_id AND ((owner_id=_actor AND public.has_role(_actor,''owner'')) OR (public.has_role(_actor,''admin'') AND _days IS NULL AND NOT (_patch ? ''photos''))) FOR UPDATE;');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.audit_property_update()'::regprocedure) INTO definition;
 definition := replace(definition,
 'IF actor IS DISTINCT FROM own THEN RETURN NEW; END IF;',
 'IF actor IS DISTINCT FROM own AND (actor IS NULL OR NOT public.has_role(actor,''admin'')) THEN RETURN NEW; END IF;');
 EXECUTE definition;
END $migration$;
REVOKE ALL ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) TO service_role;