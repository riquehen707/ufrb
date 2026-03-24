create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_profile_support_summary()
returns trigger
language plpgsql
as $$
declare
  target_profile uuid;
begin
  target_profile := coalesce(new.supporter_profile_id, old.supporter_profile_id);

  if target_profile is null then
    return coalesce(new, old);
  end if;

  update public.profiles
  set
    support_balance = coalesce(
      (
        select round(sum(amount)::numeric, 2)
        from public.donations
        where supporter_profile_id = target_profile
          and status = 'confirmed'
      ),
      0
    ),
    support_count = (
      select count(*)
      from public.donations
      where supporter_profile_id = target_profile
        and status = 'confirmed'
    ),
    updated_at = now()
  where id = target_profile;

  return coalesce(new, old);
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  university text not null default 'UFRB',
  campus text not null default 'Cruz das Almas',
  account_type text not null default 'buyer',
  course text,
  bio text,
  headline text,
  specialties text[] not null default '{}',
  avatar_url text,
  contact_email text,
  contact_phone text,
  instagram_handle text,
  verified_student boolean not null default false,
  reliability_score numeric(3,2) not null default 5.0,
  product_rating numeric(3,2) not null default 5.0,
  service_rating numeric(3,2) not null default 5.0,
  transport_rating numeric(3,2) not null default 5.0,
  housing_rating numeric(3,2) not null default 0,
  housing_review_count integer not null default 0,
  support_balance numeric(10,2) not null default 0,
  support_count integer not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists headline text,
  add column if not exists specialties text[] not null default '{}',
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists instagram_handle text,
  add column if not exists verified_student boolean not null default false,
  add column if not exists reliability_score numeric(3,2) not null default 5.0,
  add column if not exists product_rating numeric(3,2) not null default 5.0,
  add column if not exists service_rating numeric(3,2) not null default 5.0,
  add column if not exists transport_rating numeric(3,2) not null default 5.0,
  add column if not exists housing_rating numeric(3,2) not null default 0,
  add column if not exists housing_review_count integer not null default 0,
  add column if not exists support_balance numeric(10,2) not null default 0,
  add column if not exists support_count integer not null default 0,
  add column if not exists review_count integer not null default 0;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  seller_name text not null,
  seller_course text,
  intent text not null default 'offer',
  campus text not null,
  type text not null check (type in ('service', 'product')),
  category text not null,
  focus text,
  item_condition text,
  negotiation_mode text not null default 'fixed',
  image_url text,
  gallery_urls text[] not null default '{}',
  location_note text,
  location_lat double precision,
  location_lng double precision,
  housing_details jsonb not null default '{}'::jsonb,
  title text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  price_unit text,
  delivery_mode text not null default 'Combinado pelo campus',
  tags text[] not null default '{}',
  rating numeric(3,2) not null default 4.8,
  featured boolean not null default false,
  status text not null default 'active' check (status in ('active', 'draft', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists intent text not null default 'offer',
  add column if not exists focus text,
  add column if not exists item_condition text,
  add column if not exists negotiation_mode text not null default 'fixed',
  add column if not exists image_url text,
  add column if not exists gallery_urls text[] not null default '{}',
  add column if not exists location_note text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists housing_details jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_intent_check'
  ) then
    alter table public.listings
      add constraint listings_intent_check
      check (intent in ('offer', 'request'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_item_condition_check'
  ) then
    alter table public.listings
      add constraint listings_item_condition_check
      check (item_condition is null or item_condition in ('new', 'used'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_negotiation_mode_check'
  ) then
    alter table public.listings
      add constraint listings_negotiation_mode_check
      check (negotiation_mode in ('fixed', 'negotiable', 'counter_offer'));
  end if;
end;
$$;

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  supporter_profile_id uuid references public.profiles(id) on delete set null,
  donor_name text not null,
  donor_email text,
  amount numeric(10,2) not null check (amount > 0),
  method text not null default 'pix' check (method in ('pix', 'apoio', 'transferencia')),
  note text,
  is_public boolean not null default true,
  payment_reference text,
  provider_transaction_id text,
  provider_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.donations
  add column if not exists supporter_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists is_public boolean not null default true,
  add column if not exists payment_reference text,
  add column if not exists provider_transaction_id text,
  add column if not exists provider_payload jsonb not null default '{}'::jsonb,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  seller_profile_id uuid not null references public.profiles(id) on delete cascade,
  order_type text not null check (order_type in ('product', 'service')),
  amount numeric(10,2) not null check (amount >= 0),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  note text,
  completed_at timestamptz,
  reviewed_by_buyer_at timestamptz,
  reviewed_by_seller_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  participant_a_id uuid not null references public.profiles(id) on delete cascade,
  participant_b_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  scope text not null default 'products' check (scope in ('products', 'classes', 'transport', 'services')),
  last_message_preview text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_conversations_participants_check check (participant_a_id <> participant_b_id),
  unique (listing_id, participant_a_id, participant_b_id)
);

alter table public.marketplace_conversations
  add column if not exists listing_id uuid references public.listings(id) on delete set null,
  add column if not exists participant_a_id uuid references public.profiles(id) on delete cascade,
  add column if not exists participant_b_id uuid references public.profiles(id) on delete cascade,
  add column if not exists created_by uuid references public.profiles(id) on delete cascade,
  add column if not exists scope text not null default 'products',
  add column if not exists last_message_preview text,
  add column if not exists last_message_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_conversations_scope_check'
  ) then
    alter table public.marketplace_conversations
      drop constraint marketplace_conversations_scope_check;
  end if;

  alter table public.marketplace_conversations
    add constraint marketplace_conversations_scope_check
    check (scope in ('products', 'classes', 'transport', 'services'));
exception
  when duplicate_object then
    null;
end;
$$;

create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.marketplace_messages
  add column if not exists conversation_id uuid references public.marketplace_conversations(id) on delete cascade,
  add column if not exists sender_id uuid references public.profiles(id) on delete cascade,
  add column if not exists body text,
  add column if not exists read_at timestamptz;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_messages_body_check'
  ) then
    alter table public.marketplace_messages
      drop constraint marketplace_messages_body_check;
  end if;

  alter table public.marketplace_messages
    add constraint marketplace_messages_body_check
    check (length(trim(body)) > 0);
exception
  when duplicate_object then
    null;
end;
$$;

alter table public.marketplace_orders
  add column if not exists listing_id uuid references public.listings(id) on delete set null,
  add column if not exists buyer_profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists seller_profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists order_type text,
  add column if not exists amount numeric(10,2) not null default 0,
  add column if not exists quantity integer not null default 1,
  add column if not exists status text not null default 'pending',
  add column if not exists note text,
  add column if not exists completed_at timestamptz,
  add column if not exists reviewed_by_buyer_at timestamptz,
  add column if not exists reviewed_by_seller_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_orders_status_check'
  ) then
    alter table public.marketplace_orders
      drop constraint marketplace_orders_status_check;
  end if;

  alter table public.marketplace_orders
    add constraint marketplace_orders_status_check
    check (status in ('pending', 'confirmed', 'completed', 'cancelled'));
exception
  when duplicate_object then
    null;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_orders_order_type_check'
  ) then
    alter table public.marketplace_orders
      drop constraint marketplace_orders_order_type_check;
  end if;

  alter table public.marketplace_orders
    add constraint marketplace_orders_order_type_check
    check (order_type in ('product', 'service'));
exception
  when duplicate_object then
    null;
end;
$$;

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_profile_id uuid not null references public.profiles(id) on delete cascade,
  review_type text not null check (review_type in ('product', 'service')),
  rating numeric(3,2) not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, reviewer_id)
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'donations_status_check'
  ) then
    alter table public.donations
      drop constraint donations_status_check;
  end if;

  alter table public.donations
    add constraint donations_status_check
    check (status in ('pending', 'confirmed', 'cancelled'));
exception
  when duplicate_object then
    null;
end;
$$;

create table if not exists public.housing_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_profile_id uuid not null references public.profiles(id) on delete cascade,
  rating numeric(3,2) not null check (rating >= 1 and rating <= 5),
  cleanliness_rating numeric(3,2) check (cleanliness_rating >= 1 and cleanliness_rating <= 5),
  payment_rating numeric(3,2) check (payment_rating >= 1 and payment_rating <= 5),
  respect_rating numeric(3,2) check (respect_rating >= 1 and respect_rating <= 5),
  would_live_again boolean,
  comment text,
  lived_from date,
  lived_until date,
  created_at timestamptz not null default now(),
  unique (reviewer_id, reviewed_profile_id, listing_id)
);

create or replace function public.refresh_profile_review_summary(target_profile uuid)
returns void
language plpgsql
as $$
begin
  update public.profiles
  set
    product_rating = coalesce(
      (
        select round(avg(rating)::numeric, 2)
        from public.marketplace_reviews
        where reviewed_profile_id = target_profile
          and review_type = 'product'
      ),
      5
    ),
    service_rating = coalesce(
      (
        select round(avg(rating)::numeric, 2)
        from public.marketplace_reviews
        where reviewed_profile_id = target_profile
          and review_type = 'service'
      ),
      5
    ),
    housing_rating = coalesce(
      (
        select round(avg(rating)::numeric, 2)
        from public.housing_reviews
        where reviewed_profile_id = target_profile
      ),
      0
    ),
    housing_review_count = (
      select count(*)
      from public.housing_reviews
      where reviewed_profile_id = target_profile
    ),
    reliability_score = coalesce(
      (
        select round(avg(rating)::numeric, 2)
        from (
          select rating::numeric as rating
          from public.marketplace_reviews
          where reviewed_profile_id = target_profile
          union all
          select rating::numeric as rating
          from public.housing_reviews
          where reviewed_profile_id = target_profile
        ) ratings
      ),
      5
    ),
    review_count = (
      select count(*)
      from public.marketplace_reviews
      where reviewed_profile_id = target_profile
    ) + (
      select count(*)
      from public.housing_reviews
      where reviewed_profile_id = target_profile
    ),
    updated_at = now()
  where id = target_profile;
end;
$$;

create or replace function public.sync_housing_profile_rating()
returns trigger
language plpgsql
as $$
declare
  target_profile uuid;
begin
  target_profile := coalesce(new.reviewed_profile_id, old.reviewed_profile_id);
  perform public.refresh_profile_review_summary(target_profile);
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_marketplace_profile_rating()
returns trigger
language plpgsql
as $$
declare
  target_profile uuid;
begin
  target_profile := coalesce(new.reviewed_profile_id, old.reviewed_profile_id);
  perform public.refresh_profile_review_summary(target_profile);
  return coalesce(new, old);
end;
$$;

create or replace function public.refresh_marketplace_conversation_summary(target_conversation uuid)
returns void
language plpgsql
as $$
begin
  update public.marketplace_conversations
  set
    last_message_preview = (
      select body
      from public.marketplace_messages
      where conversation_id = target_conversation
      order by created_at desc
      limit 1
    ),
    last_message_at = (
      select created_at
      from public.marketplace_messages
      where conversation_id = target_conversation
      order by created_at desc
      limit 1
    ),
    updated_at = coalesce(
      (
        select created_at
        from public.marketplace_messages
        where conversation_id = target_conversation
        order by created_at desc
        limit 1
      ),
      now()
    )
  where id = target_conversation;
end;
$$;

create or replace function public.sync_marketplace_conversation_summary()
returns trigger
language plpgsql
as $$
declare
  target_conversation uuid;
begin
  target_conversation := coalesce(new.conversation_id, old.conversation_id);
  perform public.refresh_marketplace_conversation_summary(target_conversation);
  return coalesce(new, old);
end;
$$;

create index if not exists listings_feed_idx
on public.listings (status, featured desc, created_at desc);

create index if not exists listings_filters_idx
on public.listings (status, intent, type, category, created_at desc);

create index if not exists listings_focus_idx
on public.listings (focus, item_condition);

create index if not exists donations_created_at_idx
on public.donations (created_at desc);

create index if not exists donations_confirmed_idx
on public.donations (status, confirmed_at desc);

create index if not exists donations_supporter_idx
on public.donations (supporter_profile_id, status, created_at desc);

create index if not exists marketplace_orders_participants_idx
on public.marketplace_orders (buyer_profile_id, seller_profile_id, created_at desc);

create index if not exists marketplace_orders_status_idx
on public.marketplace_orders (status, completed_at desc);

create index if not exists marketplace_conversations_participants_idx
on public.marketplace_conversations (participant_a_id, participant_b_id, updated_at desc);

create index if not exists marketplace_conversations_listing_idx
on public.marketplace_conversations (listing_id, updated_at desc);

create index if not exists marketplace_messages_conversation_idx
on public.marketplace_messages (conversation_id, created_at desc);

create index if not exists marketplace_reviews_reviewed_idx
on public.marketplace_reviews (reviewed_profile_id, created_at desc);

create index if not exists housing_reviews_reviewed_idx
on public.housing_reviews (reviewed_profile_id, created_at desc);

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_listings_updated_at on public.listings;
create trigger handle_listings_updated_at
before update on public.listings
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_housing_reviews_sync on public.housing_reviews;
create trigger handle_housing_reviews_sync
after insert or update or delete on public.housing_reviews
for each row
execute procedure public.sync_housing_profile_rating();

drop trigger if exists handle_donations_updated_at on public.donations;
create trigger handle_donations_updated_at
before update on public.donations
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_marketplace_orders_updated_at on public.marketplace_orders;
create trigger handle_marketplace_orders_updated_at
before update on public.marketplace_orders
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_marketplace_conversations_updated_at on public.marketplace_conversations;
create trigger handle_marketplace_conversations_updated_at
before update on public.marketplace_conversations
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_donations_support_sync on public.donations;
create trigger handle_donations_support_sync
after insert or update or delete on public.donations
for each row
execute procedure public.sync_profile_support_summary();

drop trigger if exists handle_marketplace_messages_sync on public.marketplace_messages;
create trigger handle_marketplace_messages_sync
after insert or update or delete on public.marketplace_messages
for each row
execute procedure public.sync_marketplace_conversation_summary();

drop trigger if exists handle_marketplace_reviews_sync on public.marketplace_reviews;
create trigger handle_marketplace_reviews_sync
after insert or update or delete on public.marketplace_reviews
for each row
execute procedure public.sync_marketplace_profile_rating();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    university,
    campus,
    account_type,
    contact_email,
    verified_student
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'university', 'UFRB'),
    coalesce(new.raw_user_meta_data ->> 'campus', 'Cruz das Almas'),
    coalesce(new.raw_user_meta_data ->> 'account_type', 'buyer'),
    new.email,
    case
      when new.email ilike '%@ufrb.edu.br' then true
      else false
    end
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    university = excluded.university,
    campus = excluded.campus,
    account_type = excluded.account_type,
    contact_email = coalesce(public.profiles.contact_email, excluded.contact_email),
    verified_student = public.profiles.verified_student or excluded.verified_student,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.donations enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;
alter table public.marketplace_reviews enable row level security;
alter table public.housing_reviews enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
using (true);

drop policy if exists "profiles_owner_manage" on public.profiles;
create policy "profiles_owner_manage"
on public.profiles
for all
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "listings_public_read_active" on public.listings;
create policy "listings_public_read_active"
on public.listings
for select
using (status = 'active');

drop policy if exists "listings_owner_manage" on public.listings;
create policy "listings_owner_manage"
on public.listings
for all
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "donations_public_insert" on public.donations;
create policy "donations_public_insert"
on public.donations
for insert
with check (
  status = 'pending'
  and (
    supporter_profile_id is null
    or supporter_profile_id = (select auth.uid())
  )
);

drop policy if exists "donations_public_read_confirmed" on public.donations;
create policy "donations_public_read_confirmed"
on public.donations
for select
using (status = 'confirmed' and is_public = true);

drop policy if exists "donations_supporter_read_own" on public.donations;
create policy "donations_supporter_read_own"
on public.donations
for select
using (supporter_profile_id = (select auth.uid()));

drop policy if exists "marketplace_orders_participants_read" on public.marketplace_orders;
create policy "marketplace_orders_participants_read"
on public.marketplace_orders
for select
using (
  buyer_profile_id = (select auth.uid())
  or seller_profile_id = (select auth.uid())
);

drop policy if exists "marketplace_orders_participants_insert" on public.marketplace_orders;
create policy "marketplace_orders_participants_insert"
on public.marketplace_orders
for insert
with check (
  buyer_profile_id = (select auth.uid())
  or seller_profile_id = (select auth.uid())
);

drop policy if exists "marketplace_orders_participants_update" on public.marketplace_orders;
create policy "marketplace_orders_participants_update"
on public.marketplace_orders
for update
using (
  buyer_profile_id = (select auth.uid())
  or seller_profile_id = (select auth.uid())
)
with check (
  buyer_profile_id = (select auth.uid())
  or seller_profile_id = (select auth.uid())
);

drop policy if exists "marketplace_conversations_participants_read" on public.marketplace_conversations;
create policy "marketplace_conversations_participants_read"
on public.marketplace_conversations
for select
using (
  participant_a_id = (select auth.uid())
  or participant_b_id = (select auth.uid())
);

drop policy if exists "marketplace_conversations_participants_insert" on public.marketplace_conversations;
create policy "marketplace_conversations_participants_insert"
on public.marketplace_conversations
for insert
with check (
  created_by = (select auth.uid())
  and (
    participant_a_id = (select auth.uid())
    or participant_b_id = (select auth.uid())
  )
);

drop policy if exists "marketplace_conversations_participants_update" on public.marketplace_conversations;
create policy "marketplace_conversations_participants_update"
on public.marketplace_conversations
for update
using (
  participant_a_id = (select auth.uid())
  or participant_b_id = (select auth.uid())
)
with check (
  participant_a_id = (select auth.uid())
  or participant_b_id = (select auth.uid())
);

drop policy if exists "marketplace_messages_participants_read" on public.marketplace_messages;
create policy "marketplace_messages_participants_read"
on public.marketplace_messages
for select
using (
  exists (
    select 1
    from public.marketplace_conversations
    where marketplace_conversations.id = marketplace_messages.conversation_id
      and (
        marketplace_conversations.participant_a_id = (select auth.uid())
        or marketplace_conversations.participant_b_id = (select auth.uid())
      )
  )
);

drop policy if exists "marketplace_messages_participants_insert" on public.marketplace_messages;
create policy "marketplace_messages_participants_insert"
on public.marketplace_messages
for insert
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.marketplace_conversations
    where marketplace_conversations.id = marketplace_messages.conversation_id
      and (
        marketplace_conversations.participant_a_id = (select auth.uid())
        or marketplace_conversations.participant_b_id = (select auth.uid())
      )
  )
);

drop policy if exists "marketplace_reviews_public_read" on public.marketplace_reviews;
create policy "marketplace_reviews_public_read"
on public.marketplace_reviews
for select
using (true);

drop policy if exists "marketplace_reviews_owner_insert" on public.marketplace_reviews;
create policy "marketplace_reviews_owner_insert"
on public.marketplace_reviews
for insert
with check ((select auth.uid()) = reviewer_id);

drop policy if exists "housing_reviews_public_read" on public.housing_reviews;
create policy "housing_reviews_public_read"
on public.housing_reviews
for select
using (true);

drop policy if exists "housing_reviews_owner_insert" on public.housing_reviews;
create policy "housing_reviews_owner_insert"
on public.housing_reviews
for insert
with check ((select auth.uid()) = reviewer_id);
