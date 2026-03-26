create extension if not exists pgcrypto;

drop function if exists public.sync_profile_support_summary();
drop function if exists public.credit_profile_tokens(uuid, integer, text, uuid, text);
drop function if exists public.debit_profile_tokens(uuid, integer, text, uuid, text);
drop function if exists public.grant_monthly_tokens(uuid, integer, text);
drop function if exists public.grant_monthly_tokens_if_eligible();
drop function if exists public.finalize_paid_payment_grant(uuid, timestamptz, timestamptz, text);
drop function if exists public.create_listing_with_tokens(uuid, jsonb, integer, text, text);
drop function if exists public.renew_listing_with_tokens(uuid, uuid, integer, text, integer);
drop function if exists public.feature_listing_with_tokens(uuid, uuid, integer, text, integer);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_profile_token_summary()
returns trigger
language plpgsql
as $$
declare
  target_profile uuid;
begin
  target_profile := coalesce(new.profile_id, old.profile_id);

  if target_profile is null then
    return coalesce(new, old);
  end if;

  update public.profiles
  set
    token_balance = coalesce(
      (
        select coalesce(
          sum(
            case
              when type = 'credit' then amount
              else amount * -1
            end
          ),
          0
        )
        from public.token_transactions
        where profile_id = target_profile
      ),
      0
    ),
    token_earned = coalesce(
      (
        select coalesce(sum(amount), 0)
        from public.token_transactions
        where profile_id = target_profile
          and type = 'credit'
      ),
      0
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
  plan_type text not null default 'free',
  reliability_score numeric(3,2) not null default 0,
  product_rating numeric(3,2) not null default 0,
  service_rating numeric(3,2) not null default 0,
  transport_rating numeric(3,2) not null default 0,
  housing_rating numeric(3,2) not null default 0,
  housing_review_count integer not null default 0,
  token_balance integer not null default 0,
  token_earned integer not null default 0,
  monthly_token_last_granted_at timestamptz not null default now(),
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
  add column if not exists plan_type text not null default 'free',
  add column if not exists reliability_score numeric(3,2) not null default 0,
  add column if not exists product_rating numeric(3,2) not null default 0,
  add column if not exists service_rating numeric(3,2) not null default 0,
  add column if not exists transport_rating numeric(3,2) not null default 0,
  add column if not exists housing_rating numeric(3,2) not null default 0,
  add column if not exists housing_review_count integer not null default 0,
  add column if not exists token_balance integer not null default 0,
  add column if not exists token_earned integer not null default 0,
  add column if not exists monthly_token_last_granted_at timestamptz not null default now(),
  add column if not exists review_count integer not null default 0;

alter table public.profiles
  drop column if exists support_balance,
  drop column if exists support_count;

alter table public.profiles alter column reliability_score set default 0;
alter table public.profiles alter column product_rating set default 0;
alter table public.profiles alter column service_rating set default 0;
alter table public.profiles alter column transport_rating set default 0;

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
  listing_tier text not null default 'simple',
  token_cost integer not null default 0,
  priority_boost integer not null default 0,
  title text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  price_unit text,
  delivery_mode text not null default 'Combinado pelo campus',
  tags text[] not null default '{}',
  rating numeric(3,2) not null default 0,
  featured boolean not null default false,
  featured_until timestamptz,
  expires_at timestamptz,
  renewal_count integer not null default 0,
  last_renewed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'draft', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings alter column rating set default 0;

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
  add column if not exists housing_details jsonb not null default '{}'::jsonb,
  add column if not exists listing_tier text not null default 'simple',
  add column if not exists token_cost integer not null default 0,
  add column if not exists priority_boost integer not null default 0,
  add column if not exists featured_until timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists renewal_count integer not null default 0,
  add column if not exists last_renewed_at timestamptz;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_type_check'
  ) then
    alter table public.profiles
      drop constraint profiles_plan_type_check;
  end if;

  alter table public.profiles
    add constraint profiles_plan_type_check
    check (plan_type in ('free', 'pro'));
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
    where conname = 'payments_kind_check'
  ) then
    alter table public.payments
      drop constraint payments_kind_check;
  end if;

  alter table public.payments
    add constraint payments_kind_check
    check (kind in ('token_package', 'subscription'));
exception
  when duplicate_object then
    null;
end;
$$;

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

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_listing_tier_check'
  ) then
    alter table public.listings
      add constraint listings_listing_tier_check
      check (listing_tier in ('simple', 'premium'));
  end if;
end;
$$;

drop table if exists public.donations cascade;

create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'credit' check (type in ('credit', 'debit')),
  reason text not null default 'manual_adjustment',
  amount integer not null check (amount > 0),
  note text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

alter table public.token_transactions
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists type text not null default 'credit',
  add column if not exists reason text not null default 'manual_adjustment',
  add column if not exists amount integer not null default 1,
  add column if not exists note text,
  add column if not exists reference_id uuid,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan_type text not null default 'free',
  status text not null default 'inactive',
  provider text,
  provider_plan_id text,
  provider_subscription_id text,
  customer_email text,
  customer_document text,
  token_grant_amount integer not null default 40,
  badge_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists plan_type text not null default 'free',
  add column if not exists status text not null default 'inactive',
  add column if not exists provider text,
  add column if not exists provider_plan_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists customer_email text,
  add column if not exists customer_document text,
  add column if not exists token_grant_amount integer not null default 40,
  add column if not exists badge_enabled boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists started_at timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  kind text not null default 'token_package',
  plan_type text not null default 'free',
  status text not null default 'pending',
  provider text,
  provider_payment_id text,
  merchant_charge_id text,
  package_code text,
  token_amount integer not null default 0,
  amount_cents integer not null default 0,
  currency text not null default 'BRL',
  checkout_url text,
  qr_code text,
  qr_code_base64 text,
  expires_at timestamptz,
  granted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null,
  add column if not exists kind text not null default 'token_package',
  add column if not exists plan_type text not null default 'free',
  add column if not exists status text not null default 'pending',
  add column if not exists provider text,
  add column if not exists provider_payment_id text,
  add column if not exists merchant_charge_id text,
  add column if not exists package_code text,
  add column if not exists token_amount integer not null default 0,
  add column if not exists amount_cents integer not null default 0,
  add column if not exists currency text not null default 'BRL',
  add column if not exists checkout_url text,
  add column if not exists qr_code text,
  add column if not exists qr_code_base64 text,
  add column if not exists expires_at timestamptz,
  add column if not exists granted_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists paid_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_plan_type_check'
  ) then
    alter table public.subscriptions
      drop constraint subscriptions_plan_type_check;
  end if;

  alter table public.subscriptions
    add constraint subscriptions_plan_type_check
    check (plan_type in ('free', 'pro'));
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
    where conname = 'subscriptions_status_check'
  ) then
    alter table public.subscriptions
      drop constraint subscriptions_status_check;
  end if;

  alter table public.subscriptions
    add constraint subscriptions_status_check
    check (status in ('inactive', 'active', 'past_due', 'cancelled'));
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
    where conname = 'payments_plan_type_check'
  ) then
    alter table public.payments
      drop constraint payments_plan_type_check;
  end if;

  alter table public.payments
    add constraint payments_plan_type_check
    check (plan_type in ('free', 'pro'));
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
    where conname = 'payments_status_check'
  ) then
    alter table public.payments
      drop constraint payments_status_check;
  end if;

  alter table public.payments
    add constraint payments_status_check
    check (status in ('pending', 'authorized', 'paid', 'failed', 'refunded', 'cancelled'));
exception
  when duplicate_object then
    null;
end;
$$;

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
    where conname = 'token_transactions_type_check'
  ) then
    alter table public.token_transactions
      drop constraint token_transactions_type_check;
  end if;

  alter table public.token_transactions
    add constraint token_transactions_type_check
    check (type in ('credit', 'debit'));
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
    where conname = 'token_transactions_reason_check'
  ) then
    alter table public.token_transactions
      drop constraint token_transactions_reason_check;
  end if;

  alter table public.token_transactions
    add constraint token_transactions_reason_check
    check (
      reason in (
        'initial_grant',
        'monthly_grant_free',
        'monthly_grant_pro',
        'token_package_purchase',
        'listing_create_simple',
        'listing_create_premium',
        'listing_renewal',
        'listing_featured',
        'subscription_grant',
        'manual_adjustment',
        'refund'
      )
    );
exception
  when duplicate_object then
    null;
end;
$$;

-- These RPCs keep token debits and listing writes inside a single database
-- transaction, which is safer than splitting the logic across frontend calls.
create or replace function public.credit_profile_tokens(
  target_profile_id uuid,
  credit_amount integer,
  credit_reason text,
  credit_reference_id uuid default null,
  credit_note text default null
)
returns public.token_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_role text;
  locked_profile public.profiles%rowtype;
  inserted_transaction public.token_transactions;
begin
  acting_role := coalesce(auth.jwt() ->> 'role', '');

  if acting_role <> 'service_role'
    and auth.uid() <> target_profile_id
    and pg_trigger_depth() = 0 then
    raise exception 'Nao autorizado para creditar tokens nesse perfil.';
  end if;

  if credit_amount <= 0 then
    raise exception 'O credito de tokens precisa ser maior que zero.';
  end if;

  select *
  into locked_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if not found then
    raise exception 'Perfil nao encontrado para credito de tokens.';
  end if;

  insert into public.token_transactions (
    profile_id,
    type,
    reason,
    amount,
    note,
    reference_id
  )
  values (
    target_profile_id,
    'credit',
    credit_reason,
    credit_amount,
    credit_note,
    credit_reference_id
  )
  returning *
  into inserted_transaction;

  return inserted_transaction;
end;
$$;

create or replace function public.debit_profile_tokens(
  target_profile_id uuid,
  debit_amount integer,
  debit_reason text,
  debit_reference_id uuid default null,
  debit_note text default null
)
returns public.token_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_role text;
  locked_profile public.profiles%rowtype;
  inserted_transaction public.token_transactions;
begin
  acting_role := coalesce(auth.jwt() ->> 'role', '');

  if acting_role <> 'service_role'
    and auth.uid() <> target_profile_id
    and pg_trigger_depth() = 0 then
    raise exception 'Nao autorizado para debitar tokens desse perfil.';
  end if;

  if debit_amount <= 0 then
    raise exception 'O debito de tokens precisa ser maior que zero.';
  end if;

  select *
  into locked_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if not found then
    raise exception 'Perfil nao encontrado para debito de tokens.';
  end if;

  if locked_profile.token_balance < debit_amount then
    raise exception 'Saldo de tokens insuficiente.';
  end if;

  insert into public.token_transactions (
    profile_id,
    type,
    reason,
    amount,
    note,
    reference_id
  )
  values (
    target_profile_id,
    'debit',
    debit_reason,
    debit_amount,
    debit_note,
    debit_reference_id
  )
  returning *
  into inserted_transaction;

  return inserted_transaction;
end;
$$;

create or replace function public.grant_monthly_tokens(
  target_profile_id uuid,
  granted_amount integer,
  grant_reason text
)
returns public.token_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_transaction public.token_transactions;
begin
  select *
  into inserted_transaction
  from public.credit_profile_tokens(
    target_profile_id,
    granted_amount,
    grant_reason,
    null,
    'Credito mensal automatico.'
  );

  update public.profiles
  set
    monthly_token_last_granted_at = now(),
    updated_at = now()
  where id = target_profile_id;

  return inserted_transaction;
end;
$$;

create or replace function public.grant_monthly_tokens_if_eligible()
returns table (
  granted boolean,
  profile_id uuid,
  plan_type text,
  granted_amount integer,
  token_balance integer,
  next_eligible_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_profile public.profiles%rowtype;
  monthly_amount integer;
  monthly_reason text;
begin
  if auth.uid() is null then
    raise exception 'Sem sessao ativa para conceder tokens mensais.';
  end if;

  select *
  into locked_profile
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'Perfil nao encontrado para credito mensal.';
  end if;

  if locked_profile.plan_type = 'pro' then
    return query
    select
      false,
      locked_profile.id,
      locked_profile.plan_type,
      0,
      locked_profile.token_balance,
      null::timestamptz;
    return;
  end if;

  monthly_amount := 3;
  monthly_reason := 'monthly_grant_free';

  if locked_profile.monthly_token_last_granted_at is null
    or locked_profile.monthly_token_last_granted_at <= now() - interval '1 month' then
    perform public.grant_monthly_tokens(
      locked_profile.id,
      monthly_amount,
      monthly_reason
    );

    return query
    select
      true,
      locked_profile.id,
      locked_profile.plan_type,
      monthly_amount,
      (
        select token_balance
        from public.profiles
        where id = locked_profile.id
      ),
      now() + interval '1 month';
  end if;

  return query
  select
    false,
    locked_profile.id,
    locked_profile.plan_type,
    0,
    locked_profile.token_balance,
    locked_profile.monthly_token_last_granted_at + interval '1 month';
end;
$$;

create or replace function public.create_listing_with_tokens(
  target_profile_id uuid,
  listing_payload jsonb,
  requested_token_cost integer,
  token_reason text,
  requested_listing_tier text
)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  created_listing public.listings;
begin
  if auth.uid() <> target_profile_id then
    raise exception 'Nao autorizado para publicar com esse perfil.';
  end if;

  if requested_token_cost <= 0 then
    raise exception 'O custo do anuncio precisa ser maior que zero.';
  end if;

  perform 1
  from public.profiles
  where id = target_profile_id
  for update;

  insert into public.listings (
    owner_id,
    seller_name,
    seller_course,
    intent,
    campus,
    type,
    category,
    focus,
    item_condition,
    negotiation_mode,
    image_url,
    gallery_urls,
    location_note,
    location_lat,
    location_lng,
    housing_details,
    listing_tier,
    token_cost,
    priority_boost,
    title,
    description,
    price,
    price_unit,
    delivery_mode,
    tags,
    featured,
    featured_until,
    expires_at,
    status
  )
  values (
    target_profile_id,
    coalesce(nullif(listing_payload ->> 'seller_name', ''), 'Perfil CAMPUS'),
    nullif(listing_payload ->> 'seller_course', ''),
    coalesce(nullif(listing_payload ->> 'intent', ''), 'offer'),
    coalesce(nullif(listing_payload ->> 'campus', ''), 'Cruz das Almas'),
    coalesce(nullif(listing_payload ->> 'type', ''), 'product'),
    coalesce(nullif(listing_payload ->> 'category', ''), 'Livros'),
    nullif(listing_payload ->> 'focus', ''),
    nullif(listing_payload ->> 'item_condition', ''),
    coalesce(nullif(listing_payload ->> 'negotiation_mode', ''), 'fixed'),
    nullif(listing_payload ->> 'image_url', ''),
    case
      when jsonb_typeof(listing_payload -> 'gallery_urls') = 'array' then (
        select coalesce(array_agg(value), '{}'::text[])
        from jsonb_array_elements_text(listing_payload -> 'gallery_urls') as value
      )
      else '{}'::text[]
    end,
    nullif(listing_payload ->> 'location_note', ''),
    nullif(listing_payload ->> 'location_lat', '')::double precision,
    nullif(listing_payload ->> 'location_lng', '')::double precision,
    case
      when jsonb_typeof(listing_payload -> 'housing_details') = 'object' then
        listing_payload -> 'housing_details'
      else
        '{}'::jsonb
    end,
    requested_listing_tier,
    requested_token_cost,
    (
      select case when plan_type = 'pro' then 1 else 0 end
      from public.profiles
      where id = target_profile_id
    ),
    coalesce(nullif(listing_payload ->> 'title', ''), 'Anuncio CAMPUS'),
    coalesce(nullif(listing_payload ->> 'description', ''), 'Sem descricao.'),
    coalesce(nullif(listing_payload ->> 'price', ''), '0')::numeric(10,2),
    nullif(listing_payload ->> 'price_unit', ''),
    coalesce(nullif(listing_payload ->> 'delivery_mode', ''), 'Combinado pelo campus'),
    case
      when jsonb_typeof(listing_payload -> 'tags') = 'array' then (
        select coalesce(array_agg(value), '{}'::text[])
        from jsonb_array_elements_text(listing_payload -> 'tags') as value
      )
      else '{}'::text[]
    end,
    false,
    null,
    now() + interval '30 days',
    coalesce(nullif(listing_payload ->> 'status', ''), 'active')
  )
  returning *
  into created_listing;

  perform public.debit_profile_tokens(
    target_profile_id,
    requested_token_cost,
    token_reason,
    created_listing.id,
    'Debito automatico pela publicacao do anuncio.'
  );

  return created_listing;
end;
$$;

create or replace function public.renew_listing_with_tokens(
  target_profile_id uuid,
  target_listing_id uuid,
  requested_token_cost integer,
  token_reason text,
  days_to_extend integer
)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_listing public.listings;
begin
  if auth.uid() <> target_profile_id then
    raise exception 'Nao autorizado para renovar com esse perfil.';
  end if;

  if requested_token_cost <= 0 then
    raise exception 'O custo da renovacao precisa ser maior que zero.';
  end if;

  perform 1
  from public.listings
  where id = target_listing_id
    and owner_id = target_profile_id
  for update;

  if not found then
    raise exception 'Anuncio nao encontrado para renovacao.';
  end if;

  perform public.debit_profile_tokens(
    target_profile_id,
    requested_token_cost,
    token_reason,
    target_listing_id,
    'Debito automatico pela renovacao do anuncio.'
  );

  update public.listings
  set
    expires_at = greatest(coalesce(expires_at, now()), now())
      + make_interval(days => greatest(days_to_extend, 1)),
    renewal_count = renewal_count + 1,
    last_renewed_at = now(),
    status = 'active'
  where id = target_listing_id
  returning *
  into updated_listing;

  return updated_listing;
end;
$$;

create or replace function public.feature_listing_with_tokens(
  target_profile_id uuid,
  target_listing_id uuid,
  requested_token_cost integer,
  token_reason text,
  feature_days integer
)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_listing public.listings;
begin
  if auth.uid() <> target_profile_id then
    raise exception 'Nao autorizado para destacar com esse perfil.';
  end if;

  if requested_token_cost <= 0 then
    raise exception 'O custo do destaque precisa ser maior que zero.';
  end if;

  perform 1
  from public.listings
  where id = target_listing_id
    and owner_id = target_profile_id
  for update;

  if not found then
    raise exception 'Anuncio nao encontrado para destaque.';
  end if;

  perform public.debit_profile_tokens(
    target_profile_id,
    requested_token_cost,
    token_reason,
    target_listing_id,
    'Debito automatico pelo destaque do anuncio.'
  );

  update public.listings
  set
    featured = true,
    featured_until = greatest(coalesce(featured_until, now()), now())
      + make_interval(days => greatest(feature_days, 1))
  where id = target_listing_id
  returning *
  into updated_listing;

  return updated_listing;
end;
$$;

-- This RPC finalizes a paid platform payment exactly once. Keeping the credit,
-- profile/subscription updates and granted_at write in the same transaction
-- protects against duplicated webhooks and race conditions.
create or replace function public.finalize_paid_payment_grant(
  target_payment_id uuid,
  subscription_period_start timestamptz default null,
  subscription_period_end timestamptz default null,
  activation_note text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_role text;
  locked_payment public.payments%rowtype;
  finalized_payment public.payments%rowtype;
  subscription_token_amount integer;
begin
  acting_role := coalesce(auth.jwt() ->> 'role', '');

  if acting_role <> 'service_role' then
    raise exception 'Nao autorizado para finalizar pagamentos.';
  end if;

  select *
  into locked_payment
  from public.payments
  where id = target_payment_id
  for update;

  if not found then
    raise exception 'Pagamento nao encontrado para finalizacao.';
  end if;

  if locked_payment.status <> 'paid' then
    return locked_payment;
  end if;

  if locked_payment.granted_at is not null then
    return locked_payment;
  end if;

  if locked_payment.kind = 'token_package' then
    perform public.credit_profile_tokens(
      locked_payment.profile_id,
      locked_payment.token_amount,
      'token_package_purchase',
      locked_payment.id,
      format(
        'Pacote %s confirmado via PicPay.',
        coalesce(locked_payment.package_code, 'tokens')
      )
    );
  elsif locked_payment.kind = 'subscription' then
    if locked_payment.subscription_id is null then
      raise exception 'Assinatura nao encontrada para esse pagamento.';
    end if;

    select coalesce(token_grant_amount, 40)
    into subscription_token_amount
    from public.subscriptions
    where id = locked_payment.subscription_id
    for update;

    update public.profiles
    set
      plan_type = 'pro',
      monthly_token_last_granted_at = now(),
      updated_at = now()
    where id = locked_payment.profile_id;

    update public.subscriptions
    set
      status = 'active',
      badge_enabled = true,
      current_period_start = coalesce(subscription_period_start, now()),
      current_period_end = coalesce(subscription_period_end, current_period_end),
      updated_at = now()
    where id = locked_payment.subscription_id;

    update public.listings
    set
      priority_boost = 1,
      updated_at = now()
    where owner_id = locked_payment.profile_id
      and status = 'active';

    perform public.credit_profile_tokens(
      locked_payment.profile_id,
      coalesce(nullif(locked_payment.token_amount, 0), subscription_token_amount, 40),
      'subscription_grant',
      coalesce(locked_payment.subscription_id, locked_payment.id),
      coalesce(activation_note, 'Plano Pro ativado via Pix.')
    );
  else
    raise exception 'Tipo de pagamento invalido para finalizacao.';
  end if;

  update public.payments
  set
    granted_at = now(),
    updated_at = now()
  where id = target_payment_id
    and granted_at is null
  returning *
  into finalized_payment;

  if finalized_payment.id is null then
    select *
    into finalized_payment
    from public.payments
    where id = target_payment_id;
  end if;

  return finalized_payment;
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
      0
    ),
    service_rating = coalesce(
      (
        select round(avg(rating)::numeric, 2)
        from public.marketplace_reviews
        where reviewed_profile_id = target_profile
          and review_type = 'service'
      ),
      0
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
      0
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
on public.listings (status, featured desc, priority_boost desc, created_at desc);

create index if not exists listings_filters_idx
on public.listings (status, intent, type, category, created_at desc);

create index if not exists listings_focus_idx
on public.listings (focus, item_condition);

create index if not exists token_transactions_profile_idx
on public.token_transactions (profile_id, created_at desc);

create index if not exists subscriptions_profile_idx
on public.subscriptions (profile_id, status, current_period_end desc);

create index if not exists subscriptions_customer_document_idx
on public.subscriptions (customer_document, plan_type, status, updated_at desc)
where customer_document is not null;

create index if not exists subscriptions_customer_email_idx
on public.subscriptions (customer_email, plan_type, status, updated_at desc)
where customer_email is not null;

create unique index if not exists subscriptions_provider_subscription_id_idx
on public.subscriptions (provider_subscription_id)
where provider_subscription_id is not null;

create index if not exists payments_profile_idx
on public.payments (profile_id, status, created_at desc);

create unique index if not exists payments_provider_payment_id_idx
on public.payments (provider_payment_id)
where provider_payment_id is not null;

create unique index if not exists payments_merchant_charge_id_idx
on public.payments (merchant_charge_id)
where merchant_charge_id is not null;

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

drop trigger if exists handle_marketplace_orders_updated_at on public.marketplace_orders;
create trigger handle_marketplace_orders_updated_at
before update on public.marketplace_orders
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_subscriptions_updated_at on public.subscriptions;
create trigger handle_subscriptions_updated_at
before update on public.subscriptions
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_payments_updated_at on public.payments;
create trigger handle_payments_updated_at
before update on public.payments
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_marketplace_conversations_updated_at on public.marketplace_conversations;
create trigger handle_marketplace_conversations_updated_at
before update on public.marketplace_conversations
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_token_transactions_sync on public.token_transactions;
create trigger handle_token_transactions_sync
after insert or update or delete on public.token_transactions
for each row
execute procedure public.sync_profile_token_summary();

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

  if not exists (
    select 1
    from public.token_transactions
    where profile_id = new.id
      and reason = 'initial_grant'
  ) then
    perform public.credit_profile_tokens(
      new.id,
      5,
      'initial_grant',
      new.id,
      'Saldo inicial de boas-vindas.'
    );
  end if;

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
alter table public.token_transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
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

drop policy if exists "token_transactions_owner_read" on public.token_transactions;
create policy "token_transactions_owner_read"
on public.token_transactions
for select
using (profile_id = (select auth.uid()));

drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read"
on public.subscriptions
for select
using (profile_id = (select auth.uid()));

drop policy if exists "payments_owner_read" on public.payments;
create policy "payments_owner_read"
on public.payments
for select
using (profile_id = (select auth.uid()));

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

insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "listing_media_public_read" on storage.objects;
create policy "listing_media_public_read"
on storage.objects
for select
using (bucket_id = 'listing-media');

drop policy if exists "listing_media_authenticated_insert" on storage.objects;
create policy "listing_media_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "listing_media_authenticated_update" on storage.objects;
create policy "listing_media_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "listing_media_authenticated_delete" on storage.objects;
create policy "listing_media_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
