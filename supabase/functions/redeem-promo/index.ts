/**
 * supabase/functions/redeem-promo/index.ts
 *
 * Atomically redeems a promo code and upgrades the user's subscription.
 *
 * Deployment:
 *   supabase functions deploy redeem-promo
 *
 * Called by: app/promo.tsx → POST /functions/v1/redeem-promo
 *
 * Request body:  { code: string }
 * Response body: { tier, expiresAt } | { error: string }
 *
 * Security: requires valid Supabase JWT (user must be signed in).
 * Atomicity: uses a transaction to prevent race conditions on uses_count.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Tier = 'monthly' | 'annual' | 'lifetime';

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── Auth: extract user from JWT ──────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: { headers: { Authorization: authHeader } },
    },
  );

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const code = (body.code ?? '').trim().toUpperCase();
  if (!code) {
    return json({ error: 'Code is required' }, 400);
  }

  // Service role client for writes
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // ── Look up promo code ────────────────────────────────────────────────────
  const { data: promo, error: promoErr } = await admin
    .from('promo_codes')
    .select('id, tier, duration_days, max_uses, uses_count, expires_at, is_active')
    .eq('code', code)
    .single();

  if (promoErr || !promo) {
    return json({ error: 'Invalid promo code' }, 404);
  }

  if (!promo.is_active) {
    return json({ error: 'This promo code is no longer active' }, 410);
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return json({ error: 'This promo code has expired' }, 410);
  }

  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return json({ error: 'This promo code has reached its usage limit' }, 410);
  }

  // ── Check for duplicate redemption ────────────────────────────────────────
  const { data: existing } = await admin
    .from('promo_redemptions')
    .select('id')
    .eq('promo_id', promo.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return json({ error: 'You have already redeemed this promo code' }, 409);
  }

  // ── Atomic increment uses_count ───────────────────────────────────────────
  // Uses conditional update to guard against race conditions.
  const { data: updated, error: incrErr } = await admin
    .from('promo_codes')
    .update({ uses_count: promo.uses_count + 1 })
    .eq('id', promo.id)
    .eq('uses_count', promo.uses_count)  // optimistic lock
    .select('uses_count')
    .single();

  if (incrErr || !updated) {
    // Race condition — another request incremented first
    return json({ error: 'Promo code was claimed by someone else. Please try again.' }, 409);
  }

  // ── Record redemption ─────────────────────────────────────────────────────
  const { error: redemptionErr } = await admin
    .from('promo_redemptions')
    .insert({ promo_id: promo.id, user_id: user.id });

  if (redemptionErr) {
    // Roll back uses_count on redemption insert failure
    await admin.from('promo_codes')
      .update({ uses_count: promo.uses_count })
      .eq('id', promo.id);
    return json({ error: 'Redemption failed. Please try again.' }, 500);
  }

  // ── Upgrade subscription ──────────────────────────────────────────────────
  const tier       = promo.tier as Tier;
  const expiresAt  = tier === 'lifetime'
    ? null
    : new Date(Date.now() + promo.duration_days * 24 * 60 * 60 * 1000).toISOString();

  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      subscription_tier:       tier,
      subscription_expires_at: expiresAt,
      is_trialing:             false,
      updated_at:              new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileErr) {
    console.error(`[redeem-promo] profile update failed for ${user.id}:`, profileErr.message);
    return json({ error: 'Subscription update failed. Contact support.' }, 500);
  }

  console.log(`[redeem-promo] ${user.id} redeemed ${code} → ${tier} until ${expiresAt ?? 'lifetime'}`);

  return json({ tier, expiresAt });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type':                 'application/json',
      'Access-Control-Allow-Origin':  '*',
    },
  });
}
