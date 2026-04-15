/**
 * lib/supabase.ts — typed Supabase client singleton.
 *
 * Uses AsyncStorage for session persistence (required for React Native).
 * Import this instead of creating a new client in every file.
 *
 * Setup:
 *   1. Go to supabase.com → your project → Settings → API
 *   2. Copy "Project URL" and "anon public" key
 *   3. Add them to constants/Config.ts:
 *      SUPABASE_URL:      'https://xxxx.supabase.co'
 *      SUPABASE_ANON_KEY: 'eyJ...'
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/Config';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
  Config.SUPABASE_URL,
  Config.SUPABASE_ANON_KEY,
  {
    auth: {
      storage:             AsyncStorage,
      autoRefreshToken:    true,
      persistSession:      true,
      detectSessionInUrl:  false,   // must be false for React Native
    },
    global: {
      headers: {
        'x-app-version': Config.APP_VERSION,
      },
    },
    db: {
      schema: 'public',
    },
  },
);

/** Convenience: get current user id or null */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/** Convenience: get current session or null */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
