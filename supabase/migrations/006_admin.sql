-- ============================================================
-- Albert — Admin Role
-- Migration 006
-- ============================================================

-- Add is_admin flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Security-definer helper ───────────────────────────────────────────────────
-- Avoids RLS infinite recursion when admin policies query the profiles table.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

-- ── Admin policies ────────────────────────────────────────────────────────────

-- Admins can read ALL user profiles (for user management dashboard)
CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.is_current_user_admin());

-- Admins can update any profile (e.g. subscription tier override, grant/revoke admin)
CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Admins have full access to books (create, publish/unpublish, edit, delete)
CREATE POLICY "books: admin all"
  ON public.books FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Admins have full access to chapters
CREATE POLICY "chapters: admin all"
  ON public.chapters FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Admins have full access to promo codes (create, deactivate, edit)
CREATE POLICY "promo_codes: admin all"
  ON public.promo_codes FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Admins can read redemption records
CREATE POLICY "promo_redemptions: admin read"
  ON public.promo_redemptions FOR SELECT
  USING (public.is_current_user_admin());

-- ── Grant first admin ─────────────────────────────────────────────────────────
-- IMPORTANT: After running this migration, set yourself as admin in Supabase Dashboard:
--   UPDATE profiles SET is_admin = true WHERE id = '<your-user-id>';
-- Or via SQL Editor in the Supabase dashboard.
