create type public.app_role as enum ('admin','owner','broker','agency');
create type public.account_type as enum ('owner','broker','agency');
create type public.creci_status as enum ('not_required','pending','approved','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type public.account_type not null default 'owner',
  full_name text not null default '',
  email text,
  phone text,
  whatsapp text,
  document text,
  address text,
  city text,
  company_name text,
  creci text,
  creci_uf text,
  creci_status public.creci_status not null default 'not_required',
  bank_name text,
  bank_agency text,
  bank_account text,
  pix_key text,
  subscription_until date,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_approved_agent(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and account_type in ('broker','agency') and creci_status = 'approved')
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- protect admin-only fields
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') and auth.uid() is not null then
    if new.creci is distinct from old.creci or new.creci_uf is distinct from old.creci_uf then
      new.creci_status := 'pending';
    else
      new.creci_status := old.creci_status;
    end if;
    new.subscription_until := old.subscription_until;
    new.account_type := old.account_type;
  end if;
  return new;
end $$;
create trigger trg_protect_profile before update on public.profiles for each row execute function public.protect_profile_fields();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t public.account_type := coalesce(nullif(new.raw_user_meta_data->>'account_type',''),'owner')::public.account_type;
begin
  insert into public.profiles (id, account_type, full_name, email, phone, creci, creci_uf, company_name, creci_status)
  values (new.id, t, coalesce(new.raw_user_meta_data->>'full_name',''), new.email,
    new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'creci', new.raw_user_meta_data->>'creci_uf',
    new.raw_user_meta_data->>'company_name',
    case when t = 'owner' then 'not_required'::public.creci_status else 'pending'::public.creci_status end);
  insert into public.user_roles (user_id, role) values (new.id, t::text::public.app_role);
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- safe agent directory for owners
create or replace function public.list_approved_agents()
returns table (id uuid, account_type public.account_type, full_name text, company_name text, creci text, creci_uf text, city text, phone text, email text)
language sql stable security definer set search_path = public as $$
  select p.id, p.account_type, p.full_name, p.company_name, p.creci, p.creci_uf, p.city, p.phone, p.email
  from public.profiles p
  where p.account_type in ('broker','agency') and p.creci_status = 'approved'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'admin'))
  order by p.full_name
$$;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  description text,
  address text,
  city text,
  bedrooms int not null default 1,
  bathrooms int not null default 1,
  guests int not null default 2,
  base_price numeric(10,2) not null default 0,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
alter table public.properties enable row level security;

create table public.authorizations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null,
  created_at timestamptz not null default now(),
  unique (property_id, agent_id)
);
grant select, insert, delete on public.authorizations to authenticated;
grant all on public.authorizations to service_role;
alter table public.authorizations enable row level security;

create or replace function public.owns_property(_pid uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.properties where id = _pid and owner_id = _uid)
$$;
create or replace function public.agent_has_access(_pid uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_approved_agent(_uid) and exists (select 1 from public.authorizations where property_id = _pid and agent_id = _uid)
$$;

create policy "props owner all" on public.properties for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.has_role(auth.uid(),'owner'));
create policy "props agent read" on public.properties for select to authenticated using (public.agent_has_access(id, auth.uid()));
create policy "props admin read" on public.properties for select to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "auth owner manage" on public.authorizations for all to authenticated using (public.owns_property(property_id, auth.uid())) with check (public.owns_property(property_id, auth.uid()) and public.is_approved_agent(agent_id));
create policy "auth agent read" on public.authorizations for select to authenticated using (agent_id = auth.uid());

create table public.property_days (
  property_id uuid not null references public.properties(id) on delete cascade,
  day date not null,
  price numeric(10,2),
  blocked boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  primary key (property_id, day)
);
grant select, insert, update, delete on public.property_days to authenticated;
grant all on public.property_days to service_role;
alter table public.property_days enable row level security;
create policy "days owner all" on public.property_days for all to authenticated using (public.owns_property(property_id, auth.uid())) with check (public.owns_property(property_id, auth.uid()));
create policy "days agent read" on public.property_days for select to authenticated using (public.agent_has_access(property_id, auth.uid()));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(10,2) not null default 199.99,
  reference_month date not null,
  status text not null default 'paid',
  method text,
  paid_at timestamptz default now(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "pay own read" on public.payments for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "pay admin write" on public.payments for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "pay admin update" on public.payments for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "pay admin delete" on public.payments for delete to authenticated using (public.has_role(auth.uid(),'admin'));

alter publication supabase_realtime add table public.property_days;
alter publication supabase_realtime add table public.properties;

-- storage policies for photos bucket
create policy "photos public read" on storage.objects for select using (bucket_id = 'property-photos');
create policy "photos owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'property-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos owner delete" on storage.objects for delete to authenticated using (bucket_id = 'property-photos' and (storage.foldername(name))[1] = auth.uid()::text);