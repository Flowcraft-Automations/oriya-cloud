create extension if not exists btree_gist;

alter table public.units add column if not exists beds24_property_id bigint;
alter table public.units add column if not exists beds24_room_id bigint;
create unique index if not exists units_beds24_room_id_key
  on public.units (beds24_room_id) where beds24_room_id is not null;

alter table public.reservations add column if not exists beds24_booking_id bigint;
create unique index if not exists reservations_beds24_booking_id_key
  on public.reservations (beds24_booking_id) where beds24_booking_id is not null;
alter table public.reservations add column if not exists beds24_status text;
alter table public.reservations add column if not exists sync_source text
  check (sync_source is null or sync_source in ('app','beds24','manual'));
alter table public.reservations add column if not exists last_synced_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'reservations_no_overlap') then
    alter table public.reservations add constraint reservations_no_overlap
      exclude using gist (
        unit_id with =,
        daterange(check_in, check_out, '[)') with &&
      ) where (status <> 'cancelled');
  end if;
end $$;

create table if not exists public.beds24_token_cache (
  id int primary key default 1 check (id = 1),
  access_token text not null,
  expires_at timestamptz not null
);
alter table public.beds24_token_cache enable row level security;

create table if not exists public.integration_sync_log (
  id bigint generated always as identity primary key,
  provider text not null default 'beds24',
  direction text not null check (direction in ('inbound','outbound')),
  event text, payload jsonb,
  status text not null default 'received',
  error text,
  created_at timestamptz not null default now()
);
alter table public.integration_sync_log enable row level security;
create index if not exists integration_sync_log_created_idx
  on public.integration_sync_log (provider, created_at desc);
