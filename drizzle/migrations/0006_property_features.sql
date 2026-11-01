ALTER TABLE public.properties ADD COLUMN amenities text[] NOT NULL DEFAULT '{}'::text[], ADD COLUMN suites integer NOT NULL DEFAULT 0 CHECK (suites >= 0), ADD COLUMN garage_spaces integer NOT NULL DEFAULT 0 CHECK (garage_spaces >= 0);
CREATE OR REPLACE FUNCTION public.save_property_change(_property_id uuid, _actor uuid, _ip inet, _patch jsonb, _days jsonb DEFAULT NULL::jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE d jsonb;
BEGIN
 PERFORM 1 FROM public.properties WHERE id=_property_id AND owner_id=_actor AND public.has_role(_actor,'owner') FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Não autorizado'; END IF;
 PERFORM set_config('app.update_actor',_actor::text,true); PERFORM set_config('app.update_ip',COALESCE(_ip::text,''),true);
 IF _days IS NOT NULL THEN
  FOR d IN SELECT value FROM jsonb_array_elements(_days) LOOP
   INSERT INTO public.property_days(property_id,day,price,blocked,note) VALUES(_property_id,(d->>'day')::date,(d->>'price')::numeric,COALESCE((d->>'blocked')::boolean,false),d->>'note') ON CONFLICT(property_id,day) DO UPDATE SET price=EXCLUDED.price,blocked=EXCLUDED.blocked,note=EXCLUDED.note,updated_at=now();
  END LOOP;
 ELSE
  UPDATE public.properties SET title=COALESCE(_patch->>'title',title),description=COALESCE(_patch->>'description',description),address=COALESCE(_patch->>'address',address),city=COALESCE(_patch->>'city',city),bedrooms=COALESCE((_patch->>'bedrooms')::integer,bedrooms),bathrooms=COALESCE((_patch->>'bathrooms')::integer,bathrooms),guests=COALESCE((_patch->>'guests')::integer,guests),suites=COALESCE((_patch->>'suites')::integer,suites),garage_spaces=COALESCE((_patch->>'garage_spaces')::integer,garage_spaces),amenities=CASE WHEN _patch ? 'amenities' THEN ARRAY(SELECT jsonb_array_elements_text(_patch->'amenities')) ELSE amenities END,base_price=COALESCE((_patch->>'base_price')::numeric,base_price),segment=COALESCE(_patch->>'segment',segment),photos=CASE WHEN _patch ? 'photos' THEN ARRAY(SELECT jsonb_array_elements_text(_patch->'photos')) ELSE photos END,updated_at=now() WHERE id=_property_id;
 END IF;
END; $function$;
REVOKE ALL ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) TO service_role;