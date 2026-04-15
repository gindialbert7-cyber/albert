/**
 * supabase/functions/send-push/index.ts — Push Notification Sender
 *
 * Called from the admin notifications screen.
 * 1. Verifies caller is authenticated admin
 * 2. Loads push tokens for the target audience from the DB
 * 3. Sends via Expo Push API (chunked at 100 tokens per request)
 * 4. Records the notification + counts in push_notifications table
 *
 * Body: { title: string, body: string, audience: 'all'|'free'|'premium'|'trialing', data?: object }
 *
 * Requires env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase)
 *   EXPO_ACCESS_TOKEN (optional — for Expo push receipts, not required for basic sends)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE    = 100;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError('Missing Authorization header', 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) return jsonError('Unauthorized', 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) return jsonError('Forbidden: not an admin', 403);

    // ── Validate body ─────────────────────────────────────────────────────────
    const { title, body, audience = 'all', data: pushData } = await req.json();

    if (!title?.trim() || !body?.trim()) {
      return jsonError('title and body are required', 400);
    }
    if (!['all', 'free', 'premium', 'trialing'].includes(audience)) {
      return jsonError('Invalid audience', 400);
    }

    // ── Load target tokens ────────────────────────────────────────────────────
    let tokenQuery = supabase
      .from('push_tokens')
      .select('token, user_id');

    if (audience !== 'all') {
      // Join through profiles to filter by subscription tier / trialing
      const { data: targetProfiles } = await supabase
        .from('profiles')
        .select('id')
        .match(
          audience === 'trialing'
            ? { is_trialing: true }
            : audience === 'premium'
              ? { is_trialing: false }  // further filtered below
              : { subscription_tier: 'free', is_trialing: false }
        );

      let userIds = (targetProfiles ?? []).map((p: any) => p.id);

      // For "premium" audience, include monthly/annual/lifetime (non-trialing)
      if (audience === 'premium') {
        const { data: premProfiles } = await supabase
          .from('profiles')
          .select('id')
          .in('subscription_tier', ['monthly', 'annual', 'lifetime'])
          .eq('is_trialing', false);
        userIds = (premProfiles ?? []).map((p: any) => p.id);
      }

      if (userIds.length === 0) {
        return jsonResponse({ recipientCount: 0, successCount: 0, errorCount: 0, message: 'No users in this audience' });
      }

      tokenQuery = tokenQuery.in('user_id', userIds);
    }

    const { data: tokenRows, error: tokenError } = await tokenQuery;
    if (tokenError) return jsonError(`DB error: ${tokenError.message}`, 500);

    const tokens = (tokenRows ?? [])
      .map((r: any) => r.token)
      .filter((t: string) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

    if (tokens.length === 0) {
      return jsonResponse({ recipientCount: 0, successCount: 0, errorCount: 0, message: 'No Expo push tokens found' });
    }

    // ── Send in chunks ────────────────────────────────────────────────────────
    let successCount = 0;
    let errorCount   = 0;

    const expoHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    };
    const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    if (expoToken) expoHeaders['Authorization'] = `Bearer ${expoToken}`;

    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + CHUNK_SIZE);
      const messages = chunk.map((token: string) => ({
        to:    token,
        sound: 'default',
        title: title.trim(),
        body:  body.trim(),
        data:  pushData ?? {},
      }));

      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method:  'POST',
          headers: expoHeaders,
          body:    JSON.stringify(messages),
        });
        const json = await res.json();

        if (json.data) {
          for (const receipt of json.data) {
            if (receipt.status === 'ok')    successCount++;
            else                             errorCount++;
          }
        } else {
          // Expo returned an error for the whole chunk
          errorCount += chunk.length;
        }
      } catch {
        errorCount += chunk.length;
      }
    }

    // ── Record in DB ──────────────────────────────────────────────────────────
    const { data: notifRow, error: dbError } = await supabase
      .from('push_notifications')
      .insert({
        title:           title.trim(),
        body:            body.trim(),
        audience,
        data:            pushData ?? null,
        sent_by:         user.id,
        recipient_count: tokens.length,
        success_count:   successCount,
        error_count:     errorCount,
        status:          errorCount === tokens.length ? 'error' : 'done',
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[send-push] Failed to record notification:', dbError.message);
    }

    return jsonResponse({
      notificationId:  notifRow?.id ?? null,
      recipientCount:  tokens.length,
      successCount,
      errorCount,
    });

  } catch (e: any) {
    console.error('[send-push] Unexpected error:', e);
    return jsonError(e?.message ?? 'Internal server error', 500);
  }
});

function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
