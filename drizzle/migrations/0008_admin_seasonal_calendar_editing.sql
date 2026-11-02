DO $migration$
DECLARE definition text; previous text;
BEGIN
 SELECT pg_get_functiondef('public.save_property_change(uuid,uuid,inet,jsonb,jsonb)'::regprocedure) INTO definition;
 previous := definition;
 definition := replace(definition,
 'public.has_role(_actor,''admin'') AND _days IS NULL AND NOT (_patch ? ''photos'')',
 'public.has_role(_actor,''admin'') AND (_days IS NULL OR segment=''temporada'') AND NOT (_patch ? ''photos'')');
 IF definition=previous THEN RAISE EXCEPTION 'Expected calendar authorization guard not found'; END IF;
 EXECUTE definition;
 SELECT pg_get_functiondef('public.audit_calendar_update()'::regprocedure) INTO definition;
 previous := definition;
 definition := replace(definition,
 'IF actor IS DISTINCT FROM own THEN RETURN NEW; END IF;',
 'IF actor IS DISTINCT FROM own AND (actor IS NULL OR NOT public.has_role(actor,''admin'')) THEN RETURN NEW; END IF;');
 IF definition=previous THEN RAISE EXCEPTION 'Expected calendar audit guard not found'; END IF;
 EXECUTE definition;
END $migration$;
REVOKE ALL ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) TO service_role;