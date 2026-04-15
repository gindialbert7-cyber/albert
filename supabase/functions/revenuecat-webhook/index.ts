/**
 * supabase/functions/revenuecat-webhook/index.ts
 *
 * Receives RevenueCat server-side webhook events and updates
 * the user's subscription_tier in the profiles table.
 *
 * Deployment:
 *   supabase functions deploy revenuecat-webhook --no-verify-jwt
 *
 * RevenueCat setup:
 *   Dashboard → Integrations → Webhooks → Add endpoint
 *   URL: https://{project-ref}.supabase.co/functions/v1/revenuecat-webhook
 *   Set REVENUECAT_WEBHOOK_SECRET in Supabase secrets:
 *     supabase secrets set REVENUECAT_WEBHOOK_SECRET=your_secret
 *
 * Security: HMAC-SHA256 signature validated on every request.
 * Idempotent: safe to replay any event.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── RevenueCat event types we care about ─────────────────────────────────────

const INITIAL_PURCHASE  = 'INITIAL_PURCHASE';
const RENEWAL           = 'RENEWAL';
const PRODUCT_CHANGE    = 'PRODUCT_CHANGE';
const CANCELLATION      = 'CANCELLATION';
const EXPIRATION        = 'EXPIRATION';
const BILLING_ISSUE     = 'BILLING_ISSUE';
const UNCANCELLATION    = 'UNCANCELLATION';
const NON_RENEWING      = 'NON_RENEWING_PURCHASE';  // lifetime

// ── Product → tier mapping ────────────────────────────────────────────────────

type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'lifetime';

function productToTier(productId: string | undefined): SubscriptionTier {
  if (!productId) return 'free';
  if (productId.includes('lifetime'))   return 'lifetime';
  if (productId.includes('annual'))     return 'annual';
  if (productId.includes('monthly'))    return 'monthly';
  return 'free';
}

// ── HMAC validation ───────────────────────────────────────────────────────────

async function validateSignature(
  payload:   string,
  signature: string | null,
  secret:    string,
): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes  = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected  = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  // RevenueCat sends lowercase hex
  return signature.toLowerCase() === expected.toLowerCase();
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();

  // Verify HMAC signature
  const secret    = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
  const signature = req.headers.get('X-RevenueCat-Signature');
  if (secret) {
    const valid = await validateSignature(rawBody, signature, secret);
    if (!valid) {
      return new Response('Invalid signature', { status: 401 });
    }
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType   = event?.event?.type as string | undefined;
  const appUserId   = event?.event?.app_user_id as string | undefined;
  const productId   = event?.event?.product_id as string | undefined;
  const expiresDate = event?.event?.expiration_at_ms as number | null | undefined;

  if (!appUserId) {
    return new Response('Missing app_user_id', { status: 400 });
  }

  // Initialize service-role Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Determine new subscription state
  let tier: SubscriptionTier = 'free';
  let expiresAt: string | null = null;
  let isTrialing = false;

  switch (eventType) {
    case INITIAL_PURCHASE:
    case RENEWAL:
    case UNCANCELLATION:
    case PRODUCT_CHANGE:
      tier      = productToTier(productId);
      expiresAt = expiresDate ? new Date(expiresDate).toISOString() : null;
      break;

    case NON_RENEWING:
      tier      = 'lifetime';
      expiresAt = null;
      break;

    case CANCELLATION:
      // Keep tier until expiry — don't downgrade immediately
      tier      = productToTier(productId);
      expiresAt = expiresDate ? new Date(expiresDate).toISOString() : null;
      break;

    case EXPIRATION:
    case BILLING_ISSUE:
      tier      = 'free';
      expiresAt = null;
      break;

    default:
      // Unknown event type — acknowledge and ignore
      console.log(`[webhook] unhandled event type: ${eventType}`);
      return new Response('OK', { status: 200 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier:       tier,
      subscription_expires_at: expiresAt,
      is_trialing:             isTrialing,
      updated_at:              new Date().toISOString(),
    })
    .eq('id', appUserId);

  if (error) {
    console.error(`[webhook] profiles update failed for ${appUserId}:`, error.message);
    // Return 500 so RevenueCat retries
    return new Response('DB error', { status: 500 });
  }

  console.log(`[webhook] ${eventType} → ${appUserId} set to ${tier}`);
  return new Response('OK', { status: 200 });
});
