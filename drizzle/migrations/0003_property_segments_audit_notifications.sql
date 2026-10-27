ALTER TABLE public.properties ADD COLUMN segment text NOT NULL DEFAULT 'temporada';
ALTER TABLE public.properties ADD CONSTRAINT properties_segment_valid CHECK (segment IN ('venda','anual','temporada'));
ALTER TABLE public.authorizations ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT true;
CREATE TABLE public.property_updates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, owner_id uuid NOT NULL, actor_id uuid NOT NULL, kind text NOT NULL, old_values jsonb NOT NULL, new_values jsonb NOT NULL, observed_ip inet, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.property_updates TO authenticated;
GRANT ALL ON public.property_updates TO service_role;
ALTER TABLE public.property_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY updates_owner_read ON public.property_updates FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE TABLE public.property_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), update_id uuid NOT NULL REFERENCES public.property_updates(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, owner_id uuid NOT NULL, recipient_id uuid NOT NULL, status text NOT NULL DEFAULT 'delivered', created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz, UNIQUE(update_id,recipient_id), CONSTRAINT notification_status_valid CHECK (status IN ('delivered','disabled')));
GRANT SELECT ON public.property_notifications TO authenticated;
GRANT ALL ON public.property_notifications TO service_role;
ALTER TABLE public.property_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_owner_read ON public.property_notifications FOR SELECT TO authenticated USING (owner_id=auth.uid());
CREATE POLICY notification_recipient_read ON public.property_notifications FOR SELECT TO authenticated USING (recipient_id=auth.uid() AND status='delivered' AND public.agent_has_access(property_id,auth.uid()));
CREATE INDEX property_updates_property_date ON public.property_updates(property_id,created_at DESC);
CREATE INDEX property_notifications_recipient_date ON public.property_notifications(recipient_id,created_at DESC);
CREATE OR REPLACE FUNCTION public.audit_property_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pid uuid; own uuid; actor uuid; event_id uuid; before_data jsonb; after_data jsonb; ip inet;
BEGIN
  before_data := to_jsonb(OLD) - 'updated_at'; after_data := to_jsonb(NEW) - 'updated_at';
  IF before_data=after_data THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='properties' THEN pid:=NEW.id; own:=OLD.owner_id;
  ELSE pid:=NEW.property_id; SELECT owner_id INTO own FROM public.properties WHERE id=pid; END IF;
  actor:=COALESCE(NULLIF(current_setting('app.update_actor',true),'')::uuid, auth.uid());
  IF actor IS DISTINCT FROM own THEN RETURN NEW; END IF;
  ip:=NULLIF(current_setting('app.update_ip',true),'')::inet;
  INSERT INTO public.property_updates(property_id,owner_id,actor_id,kind,old_values,new_values,observed_ip) VALUES(pid,own,actor,CASE WHEN TG_TABLE_NAME='properties' THEN 'property' ELSE 'calendar' END,before_data,after_data,ip) RETURNING id INTO event_id;
  INSERT INTO public.property_notifications(update_id,property_id,owner_id,recipient_id,status)
    SELECT event_id,pid,own,a.agent_id,CASE WHEN a.notifications_enabled THEN 'delivered' ELSE 'disabled' END FROM public.authorizations a WHERE a.property_id=pid AND public.is_approved_agent(a.agent_id);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.audit_property_update() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_property_changes AFTER UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.audit_property_update();
CREATE OR REPLACE FUNCTION public.audit_calendar_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE own uuid; actor uuid; event_id uuid; before_data jsonb; after_data jsonb;
BEGIN
 SELECT owner_id INTO own FROM public.properties WHERE id=NEW.property_id;
 actor:=COALESCE(NULLIF(current_setting('app.update_actor',true),'')::uuid,auth.uid());
 IF actor IS DISTINCT FROM own THEN RETURN NEW; END IF;
 after_data:=to_jsonb(NEW)-'updated_at';
 before_data:=CASE WHEN TG_OP='INSERT' THEN jsonb_build_object('day',NEW.day,'price',NULL,'blocked',false,'note',NULL,'property_id',NEW.property_id) ELSE to_jsonb(OLD)-'updated_at' END;
 IF before_data=after_data THEN RETURN NEW; END IF;
 INSERT INTO public.property_updates(property_id,owner_id,actor_id,kind,old_values,new_values,observed_ip) VALUES(NEW.property_id,own,actor,'calendar',before_data,after_data,NULLIF(current_setting('app.update_ip',true),'')::inet) RETURNING id INTO event_id;
 INSERT INTO public.property_notifications(update_id,property_id,owner_id,recipient_id,status) SELECT event_id,NEW.property_id,own,a.agent_id,CASE WHEN a.notifications_enabled THEN 'delivered' ELSE 'disabled' END FROM public.authorizations a WHERE a.property_id=NEW.property_id AND public.is_approved_agent(a.agent_id);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.audit_calendar_update() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_calendar_changes AFTER INSERT OR UPDATE ON public.property_days FOR EACH ROW EXECUTE FUNCTION public.audit_calendar_update();
CREATE OR REPLACE FUNCTION public.save_property_change(_property_id uuid,_actor uuid,_ip inet,_patch jsonb,_days jsonb DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
  UPDATE public.properties SET title=COALESCE(_patch->>'title',title),description=COALESCE(_patch->>'description',description),address=COALESCE(_patch->>'address',address),city=COALESCE(_patch->>'city',city),bedrooms=COALESCE((_patch->>'bedrooms')::integer,bedrooms),bathrooms=COALESCE((_patch->>'bathrooms')::integer,bathrooms),guests=COALESCE((_patch->>'guests')::integer,guests),base_price=COALESCE((_patch->>'base_price')::numeric,base_price),segment=COALESCE(_patch->>'segment',segment),photos=CASE WHEN _patch ? 'photos' THEN ARRAY(SELECT jsonb_array_elements_text(_patch->'photos')) ELSE photos END,updated_at=now() WHERE id=_property_id;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_property_change(uuid,uuid,inet,jsonb,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.mark_property_notification_read(_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ UPDATE public.property_notifications SET read_at=COALESCE(read_at,now()) WHERE id=_id AND recipient_id=auth.uid() AND status='delivered' AND public.agent_has_access(property_id,auth.uid()); $$;
REVOKE ALL ON FUNCTION public.mark_property_notification_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_property_notification_read(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.agent_network_properties_segmented() RETURNS TABLE(id uuid,owner_id uuid,title text,city text,bedrooms integer,guests integer,cover text,has_access boolean,request_status text,segment text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p.id,p.owner_id,p.title,p.city,p.bedrooms,p.guests,p.photos[1],public.agent_has_access(p.id,auth.uid()),(SELECT r.status FROM public.access_requests r WHERE r.property_id=p.id AND r.agent_id=auth.uid() LIMIT 1),p.segment FROM public.properties p WHERE public.agent_connected_to_owner(p.owner_id,auth.uid()) ORDER BY p.created_at DESC; $$;
REVOKE ALL ON FUNCTION public.agent_network_properties_segmented() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.agent_network_properties_segmented() TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_notifications;
