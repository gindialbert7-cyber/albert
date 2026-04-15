/**
 * lib/database.types.ts — auto-generated Supabase type definitions.
 *
 * To regenerate after schema changes:
 *   npx supabase gen types typescript --project-ref YOUR_PROJECT_REF > lib/database.types.ts
 *
 * These are hand-written to match migrations/001-005. Regenerate from CLI
 * once the Supabase project is linked.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                     string;
          display_name:           string | null;
          avatar_url:             string | null;
          subscription_tier:      'free' | 'monthly' | 'annual' | 'lifetime';
          subscription_expires_at:string | null;
          is_trialing:            boolean;
          is_admin:               boolean;
          created_at:             string;
          updated_at:             string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      books: {
        Row: {
          id:             string;
          title:          string;
          hebrew_title:   string | null;
          subtitle:       string | null;
          description:    string | null;
          category:       string;
          layout_mode:    string;
          language:       string;
          age_group:      string;
          requires_sub:   boolean;
          cover_gradient: string[] | null;
          cover_accent:   string | null;
          authors:        Json;
          total_chapters: number;
          total_pages:    number;
          sefaria_ref:    string | null;
          storage_path:   string | null;
          is_published:   boolean;
          is_featured:    boolean;
          sort_order:     number;
          tags:           string[];
          created_at:     string;
          updated_at:     string;
        };
        Insert: Partial<Database['public']['Tables']['books']['Row']> & { id: string; title: string; category: string };
        Update: Partial<Database['public']['Tables']['books']['Row']>;
      };

      chapters: {
        Row: {
          id:             string;
          book_id:        string;
          chapter_index:  number;
          chapter_id:     string;
          title:          string;
          hebrew_title:   string | null;
          page_count:     number;
          storage_path:   string | null;
          sefaria_ref:    string | null;
          content_json:   Json | null;
          content_hash:   string | null;
          created_at:     string;
          updated_at:     string;
        };
        Insert: Omit<Database['public']['Tables']['chapters']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['chapters']['Row']>;
      };

      reading_positions: {
        Row: {
          id:            string;
          user_id:       string;
          book_id:       string;
          chapter_id:    string;
          chapter_index: number;
          scroll_y:      number;
          progress:      number;
          updated_at:    string;
        };
        Insert: Omit<Database['public']['Tables']['reading_positions']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['reading_positions']['Row']>;
      };

      bookmarks: {
        Row: {
          id:            string;
          user_id:       string;
          book_id:       string;
          book_title:    string | null;
          chapter_id:    string;
          chapter_title: string | null;
          page:          number;
          excerpt:       string | null;
          note:          string | null;
          created_at:    string;
        };
        Insert: Omit<Database['public']['Tables']['bookmarks']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['bookmarks']['Row']>;
      };

      highlights: {
        Row: {
          id:            string;
          user_id:       string;
          book_id:       string;
          book_title:    string | null;
          chapter_id:    string;
          chapter_title: string | null;
          section_index: number;
          text:          string;
          color:         string;
          note:          string | null;
          created_at:    string;
        };
        Insert: Omit<Database['public']['Tables']['highlights']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['highlights']['Row']>;
      };

      word_notes: {
        Row: {
          id:            string;
          user_id:       string;
          book_id:       string;
          book_title:    string | null;
          chapter_id:    string;
          chapter_title: string | null;
          section_index: number;
          word_start:    number;
          word_end:      number;
          selected_text: string;
          note_text:     string;
          color:         string;
          created_at:    string;
          updated_at:    string;
        };
        Insert: Omit<Database['public']['Tables']['word_notes']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['word_notes']['Row']>;
      };

      promo_codes: {
        Row: {
          id:           string;
          code:         string;
          tier:         'monthly' | 'annual' | 'lifetime';
          duration_days:number;
          max_uses:     number | null;
          uses_count:   number;
          expires_at:   string | null;
          is_active:    boolean;
          description:  string | null;
          created_at:   string;
        };
        Insert: Partial<Database['public']['Tables']['promo_codes']['Row']> & { code: string };
        Update: Partial<Database['public']['Tables']['promo_codes']['Row']>;
      };

      promo_redemptions: {
        Row: {
          id:          string;
          promo_id:    string;
          user_id:     string;
          redeemed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['promo_redemptions']['Row'], 'id' | 'redeemed_at'> & { id?: string };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
