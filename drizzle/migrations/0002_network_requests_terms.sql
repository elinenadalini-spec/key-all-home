create table public.app_terms (
  id text primary key,
  title text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.app_terms to authenticated;
grant insert, update, delete on public.app_terms to authenticated;
grant all on public.app_terms to service_role;
alter table public.app_terms enable row level security;
create policy "terms read" on public.app_terms for select to authenticated using (true);
create policy "terms admin insert" on public.app_terms for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "terms admin update" on public.app_terms for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "terms admin delete" on public.app_terms for delete to authenticated using (public.has_role(auth.uid(),'admin'));

alter table public.authorizations add column owner_accepted_terms_at timestamptz;

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null,
  status text not null default 'pending',
  agent_accepted_terms_at timestamptz,
  created_at timestamptz not null default now(),
  unique (property_id, agent_id)
);
grant select, insert, update, delete on public.access_requests to authenticated;
grant all on public.access_requests to service_role;
alter table public.access_requests enable row level security;

create or replace function public.agent_connected_to_owner(_owner uuid, _agent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved_agent(_agent) and exists (
    select 1 from public.authorizations a join public.properties p on p.id = a.property_id
    where a.agent_id = _agent and p.owner_id = _owner)
$$;

create or replace function public.property_owner(_pid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select owner_id from public.properties where id = _pid
$$;

create policy "req agent read" on public.access_requests for select to authenticated using (agent_id = auth.uid());
create policy "req agent insert" on public.access_requests for insert to authenticated
  with check (agent_id = auth.uid() and status = 'pending' and public.agent_connected_to_owner(public.property_owner(property_id), auth.uid()));
create policy "req agent delete" on public.access_requests for delete to authenticated using (agent_id = auth.uid() and status = 'pending');
create policy "req owner read" on public.access_requests for select to authenticated using (public.owns_property(property_id, auth.uid()));
create policy "req owner update" on public.access_requests for update to authenticated using (public.owns_property(property_id, auth.uid()));
create policy "req owner delete" on public.access_requests for delete to authenticated using (public.owns_property(property_id, auth.uid()));

create or replace function public.agent_owner_contacts()
returns table(id uuid, full_name text, email text, phone text, whatsapp text, city text)
language sql stable security definer set search_path = public as $$
  select pr.id, pr.full_name, pr.email, pr.phone, pr.whatsapp, pr.city
  from public.profiles pr
  where public.agent_connected_to_owner(pr.id, auth.uid())
$$;

create or replace function public.agent_network_properties()
returns table(id uuid, owner_id uuid, title text, city text, bedrooms int, guests int, cover text, has_access boolean, request_status text)
language sql stable security definer set search_path = public as $$
  select p.id, p.owner_id, p.title, p.city, p.bedrooms, p.guests, p.photos[1],
    exists (select 1 from public.authorizations a where a.property_id = p.id and a.agent_id = auth.uid()),
    (select r.status from public.access_requests r where r.property_id = p.id and r.agent_id = auth.uid())
  from public.properties p
  where public.agent_connected_to_owner(p.owner_id, auth.uid())
  order by p.created_at desc
$$;

create or replace function public.agent_can_see_cover(_name text, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.properties p where p.photos[1] = _name and public.agent_connected_to_owner(p.owner_id, _uid))
$$;

create policy "photos agent cover read" on storage.objects for select to authenticated using (
  bucket_id = 'property-photos' and public.agent_can_see_cover(name, auth.uid())
);