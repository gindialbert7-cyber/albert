#!/usr/bin/env node
/**
 * scripts/bootstrap-admin.ts
 *
 * Creates the first admin user in Supabase and sets their role.
 * Run once after applying migrations.
 *
 * Requires:
 *   SUPABASE_URL               — project API URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key (never commit this)
 *   ADMIN_EMAIL                — email for the admin account
 *   ADMIN_PASSWORD             — password (min 8 chars)
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD=securepassword \
 *   npx ts-node scripts/bootstrap-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL               = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD            = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.error('Export them in your shell before running this script.');
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error('Error: ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Creating admin user: ${ADMIN_EMAIL}`);

  // Create user via Admin API
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email:             ADMIN_EMAIL!,
    password:          ADMIN_PASSWORD!,
    email_confirm:     true,
    user_metadata: {
      display_name: 'Admin',
      role: 'admin',
    },
  });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      console.log('User already exists — fetching existing user...');
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) { console.error('Failed to list users:', listError.message); process.exit(1); }
      const existing = listData.users.find(u => u.email === ADMIN_EMAIL);
      if (!existing) { console.error('Could not find existing user.'); process.exit(1); }
      await setAdminRole(existing.id);
      return;
    }
    console.error('Failed to create user:', createError.message);
    process.exit(1);
  }

  const userId = userData.user!.id;
  console.log(`User created: ${userId}`);
  await setAdminRole(userId);
}

async function setAdminRole(userId: string) {
  // Upsert into admin_users table (created by migration 006_admin.sql)
  const { error } = await supabase
    .from('admin_users')
    .upsert({ user_id: userId, role: 'super_admin', granted_at: new Date().toISOString() });

  if (error) {
    console.error('Failed to set admin role:', error.message);
    console.error('Ensure migration 006_admin.sql has been applied.');
    process.exit(1);
  }

  // Also update profile subscription to reflect admin status
  await supabase
    .from('profiles')
    .update({ subscription_tier: 'lifetime' })
    .eq('id', userId);

  console.log(`Admin role granted for ${ADMIN_EMAIL}`);
  console.log('Done. You can now sign in at /admin with these credentials.');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
