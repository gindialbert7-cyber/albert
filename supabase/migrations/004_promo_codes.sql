-- ============================================================
-- Albert — Promo Codes
-- Migration 004
-- ============================================================

create table if not exists public.promo_codes (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,       -- e.g. 'ALBERT2026' (stored uppercase)
  tier            text not null default 'monthly'
    check (tier in ('monthly','annual','lifetime')),
  duration_days   int not null default 30,    -- how long the subscription lasts
  max_uses        int,                        -- null = unlimited
  uses_count      int not null default 0,
  expires_at      timestamptz,               -- null = never expires
  is_active       boolean not null default true,
  description     text,                       -- internal note: 'Launch promo Q1 2026'
  created_at      timestamptz not null default now()
);

-- Track who used which code (prevents double-use per user)
create table if not exists public.promo_redemptions (
  id              uuid primary key default uuid_generate_v4(),
  promo_id        uuid not null references public.promo_codes(id),
  user_id         uuid not null references auth.users(id) on delete cascade,
  redeemed_at     timestamptz not null default now(),
  unique(promo_id, user_id)                  -- one redemption per user per code
);

create index idx_promo_code on public.promo_codes(code);
create index idx_promo_redemptions_user on public.promo_redemptions(user_id);

-- RLS: only service role touches these tables
alter table public.promo_codes         enable row level security;
alter table public.promo_redemptions   enable row level security;
create policy "promos: service only"       on public.promo_codes       for all using (auth.role() = 'service_role');
create policy "redemptions: service only"  on public.promo_redemptions for all using (auth.role() = 'service_role');

-- ── Seed a few launch promo codes ────────────────────────────────────────────
insert into public.promo_codes (code, tier, duration_days, max_uses, description) values
  ('LAUNCH2026',   'annual',   365,  500,  'Launch week annual promo'),
  ('SHAVUOT2026',  'monthly',   30,  null, 'Shavuot promotion'),
  ('EDUCATOR50',   'annual',   365,  50,   'Educator / school discount'),
  ('RABBINATE',    'lifetime',  null, 25,  'Rabbinate gift codes'),
  ('ALBERT30',     'monthly',   30,  null, 'General 30-day trial')
on conflict (code) do nothing;
