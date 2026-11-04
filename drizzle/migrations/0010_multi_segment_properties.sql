ALTER TABLE public.properties ADD COLUMN segments text[], ADD COLUMN sale_price numeric, ADD COLUMN annual_price numeric, ADD COLUMN seasonal_price numeric;
UPDATE public.properties SET segments=ARRAY[segment], sale_price=CASE WHEN segment='venda' THEN base_price END, annual_price=CASE WHEN segment='anual' THEN base_price END, seasonal_price=CASE WHEN segment='temporada' THEN base_price END;
ALTER TABLE public.properties ADD CONSTRAINT property_segments_valid CHECK (segments IS NOT NULL AND cardinality(segments) BETWEEN 1 AND 3 AND segments <@ ARRAY['venda','anual','temporada']::text[] AND array_position(segments,NULL) IS NULL), ADD CONSTRAINT property_segment_prices_valid CHECK ((sale_price IS NULL OR sale_price>=0) AND (annual_price IS NULL OR annual_price>=0) AND (seasonal_price IS NULL OR seasonal_price>=0));
CREATE OR REPLACE FUNCTION public.sync_property_segments() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE s text; value numeric;
BEGIN
 IF NEW.segments IS NULL THEN
  NEW.segments:=ARRAY[NEW.segment];
  IF NEW.segment='venda' THEN NEW.sale_price:=NEW.base_price; ELSIF NEW.segment='anual' THEN NEW.annual_price:=NEW.base_price; ELSE NEW.seasonal_price:=NEW.base_price; END IF;
 ELSIF TG_OP='UPDATE' AND NEW.segments=OLD.segments AND (NEW.segment IS DISTINCT FROM OLD.segment OR NEW.base_price IS DISTINCT FROM OLD.base_price) THEN
  IF NEW.segment IS DISTINCT FROM OLD.segment THEN NEW.segments:=ARRAY[NEW.segment]; END IF;
  IF NEW.segment='venda' THEN NEW.sale_price:=NEW.base_price; ELSIF NEW.segment='anual' THEN NEW.annual_price:=NEW.base_price; ELSE NEW.seasonal_price:=NEW.base_price; END IF;
 END IF;
 IF cardinality(NEW.segments) NOT BETWEEN 1 AND 3 OR NOT (NEW.segments <@ ARRAY['venda','anual','temporada']::text[]) OR array_position(NEW.segments,NULL) IS NOT NULL OR cardinality(NEW.segments)<>(SELECT count(DISTINCT v) FROM unnest(NEW.segments) v) THEN RAISE EXCEPTION 'Escolha de um a três segmentos distintos'; END IF;
 FOREACH s IN ARRAY NEW.segments LOOP
  value:=CASE s WHEN 'venda' THEN NEW.sale_price WHEN 'anual' THEN NEW.annual_price ELSE NEW.seasonal_price END;
  IF value IS NULL OR value<0 THEN RAISE EXCEPTION 'Informe o valor de cada segmento selecionado'; END IF;
 END LOOP;
 NEW.segment:=NEW.segments[1];
 NEW.base_price:=CASE NEW.segment WHEN 'venda' THEN NEW.sale_price WHEN 'anual' THEN NEW.annual_price ELSE NEW.seasonal_price END;
 RETURN NEW;
END $$;
CREATE TRIGGER sync_property_segments BEFORE INSERT OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.sync_property_segments();
COMMENT ON COLUMN public.properties.segment IS 'DEPRECATED: compatibility mirror of segments[1]; use segments for membership';
COMMENT ON COLUMN public.properties.base_price IS 'DEPRECATED: compatibility mirror of primary segment price; use sale_price, annual_price and seasonal_price';
DO $migration$
DECLARE definition text; previous text;
BEGIN
 SELECT pg_get_functiondef('public.save_property_change(uuid,uuid,inet,jsonb,jsonb)'::regprocedure) INTO definition;
 previous:=definition;
 definition:=replace(definition,'OR segment=''temporada''','OR ''temporada''=ANY(segments)');
 definition:=replace(definition,'UPDATE public.properties SET title=', 'UPDATE public.properties SET segments=CASE WHEN _patch ? ''segments'' THEN ARRAY(SELECT jsonb_array_elements_text(_patch->''segments'')) ELSE segments END,sale_price=COALESCE((_patch->>''sale_price'')::numeric,sale_price),annual_price=COALESCE((_patch->>''annual_price'')::numeric,annual_price),seasonal_price=COALESCE((_patch->>''seasonal_price'')::numeric,seasonal_price),title=');
 IF definition=previous THEN RAISE EXCEPTION 'Expected property update not found'; END IF;
 EXECUTE definition;
END $migration$;
REVOKE ALL ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.agent_network_properties_multi_segment() RETURNS TABLE(id uuid,owner_id uuid,title text,city text,bedrooms integer,guests integer,cover text,has_access boolean,request_status text,segments text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p.id,p.owner_id,p.title,p.city,p.bedrooms,p.guests,p.photos[1],public.agent_has_access(p.id,auth.uid()),(SELECT r.status FROM public.access_requests r WHERE r.property_id=p.id AND r.agent_id=auth.uid() LIMIT 1),p.segments FROM public.properties p WHERE public.agent_connected_to_owner(p.owner_id,auth.uid()) ORDER BY p.created_at DESC $$;
REVOKE ALL ON FUNCTION public.agent_network_properties_multi_segment() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.agent_network_properties_multi_segment() TO authenticated,service_role;