/**
 * lib/database.types.ts — hand-authored Supabase Database type.
 *
 * Kept in sync with supabase/migrations/*.sql. The Supabase CLI can regenerate
 * this once `npx supabase link` has succeeded:
 *   npx supabase gen types typescript --linked > lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'lifetime';
export type PromoTier        = 'monthly' | 'annual' | 'lifetime';
export type PushAudience     = 'all' | 'free' | 'premium' | 'trialing';
export type PushPlatform     = 'ios' | 'android' | 'web';
export type PushStatus       = 'pending' | 'sending' | 'done' | 'error';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                       string;
          display_name:             string | null;
          avatar_url:               string | null;
          subscription_tier:        SubscriptionTier;
          subscription_expires_at:  string | null;
          is_trialing:              boolean;
          is_admin:                 boolean;
          created_at:               string;
          updated_at:               string;
        };
        Insert: {
          id:                        string;
          display_name?:             string | null;
          avatar_url?:               string | null;
          subscription_tier?:        SubscriptionTier;
          subscription_expires_at?:  string | null;
          is_trialing?:              boolean;
          is_admin?:                 boolean;
          created_at?:               string;
          updated_at?:               string;
        };
        Update: {
          id?:                       string;
          display_name?:             string | null;
          avatar_url?:               string | null;
          subscription_tier?:        SubscriptionTier;
          subscription_expires_at?:  string | null;
          is_trialing?:              boolean;
          is_admin?:                 boolean;
          created_at?:               string;
          updated_at?:               string;
        };
        Relationships: [];
      };

      books: {
        Row: {
          id:              string;
          title:           string;
          hebrew_title:    string | null;
          subtitle:        string | null;
          description:     string | null;
          category:        string;
          layout_mode:     string;
          language:        string;
          age_group:       string;
          requires_sub:    boolean;
          cover_gradient:  string[] | null;
          cover_accent:    string | null;
          authors:         Json;
          total_chapters:  number;
          total_pages:     number;
          sefaria_ref:     string | null;
          storage_path:    string | null;
          is_published:    boolean;
          is_featured:     boolean;
          sort_order:      number;
          tags:            string[] | null;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id:               string;
          title:            string;
          hebrew_title?:    string | null;
          subtitle?:        string | null;
          description?:     string | null;
          category:         string;
          layout_mode?:     string;
          language?:        string;
          age_group?:       string;
          requires_sub?:    boolean;
          cover_gradient?:  string[] | null;
          cover_accent?:    string | null;
          authors?:         Json;
          total_chapters?:  number;
          total_pages?:     number;
          sefaria_ref?:     string | null;
          storage_path?:    string | null;
          is_published?:    boolean;
          is_featured?:     boolean;
          sort_order?:      number;
          tags?:            string[] | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: {
          id?:              string;
          title?:           string;
          hebrew_title?:    string | null;
          subtitle?:        string | null;
          description?:     string | null;
          category?:        string;
          layout_mode?:     string;
          language?:        string;
          age_group?:       string;
          requires_sub?:    boolean;
          cover_gradient?:  string[] | null;
          cover_accent?:    string | null;
          authors?:         Json;
          total_chapters?:  number;
          total_pages?:     number;
          sefaria_ref?:     string | null;
          storage_path?:    string | null;
          is_published?:    boolean;
          is_featured?:     boolean;
          sort_order?:      number;
          tags?:            string[] | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Relationships: [];
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
        Insert: {
          id?:            string;
          book_id:        string;
          chapter_index:  number;
          chapter_id:     string;
          title:          string;
          hebrew_title?:  string | null;
          page_count?:    number;
          storage_path?:  string | null;
          sefaria_ref?:   string | null;
          content_json?:  Json | null;
          content_hash?:  string | null;
          created_at?:    string;
          updated_at?:    string;
        };
        Update: {
          id?:            string;
          book_id?:       string;
          chapter_index?: number;
          chapter_id?:    string;
          title?:         string;
          hebrew_title?:  string | null;
          page_count?:    number;
          storage_path?:  string | null;
          sefaria_ref?:   string | null;
          content_json?:  Json | null;
          content_hash?:  string | null;
          created_at?:    string;
          updated_at?:    string;
        };
        Relationships: [];
      };

      reading_positions: {
        Row: {
          id:             string;
          user_id:        string;
          book_id:        string;
          chapter_id:     string;
          chapter_index:  number;
          scroll_y:       number;
          progress:       number;
          updated_at:     string;
        };
        Insert: {
          id?:            string;
          user_id:        string;
          book_id:        string;
          chapter_id:     string;
          chapter_index?: number;
          scroll_y?:      number;
          progress?:      number;
          updated_at?:    string;
        };
        Update: {
          id?:            string;
          user_id?:       string;
          book_id?:       string;
          chapter_id?:    string;
          chapter_index?: number;
          scroll_y?:      number;
          progress?:      number;
          updated_at?:    string;
        };
        Relationships: [];
      };

      bookmarks: {
        Row: {
          id:             string;
          user_id:        string;
          book_id:        string;
          book_title:     string | null;
          chapter_id:     string;
          chapter_title:  string | null;
          page:           number;
          excerpt:        string | null;
          note:           string | null;
          created_at:     string;
        };
        Insert: {
          id:             string;
          user_id:        string;
          book_id:        string;
          book_title?:    string | null;
          chapter_id:     string;
          chapter_title?: string | null;
          page?:          number;
          excerpt?:       string | null;
          note?:          string | null;
          created_at?:    string;
        };
        Update: {
          id?:            string;
          user_id?:       string;
          book_id?:       string;
          book_title?:    string | null;
          chapter_id?:    string;
          chapter_title?: string | null;
          page?:          number;
          excerpt?:       string | null;
          note?:          string | null;
          created_at?:    string;
        };
        Relationships: [];
      };

      highlights: {
        Row: {
          id:             string;
          user_id:        string;
          book_id:        string;
          book_title:     string | null;
          chapter_id:     string;
          chapter_title:  string | null;
          section_index:  number;
          text:           string;
          color:          string;
          note:           string | null;
          created_at:     string;
        };
        Insert: {
          id:             string;
          user_id:        string;
          book_id:        string;
          book_title?:    string | null;
          chapter_id:     string;
          chapter_title?: string | null;
          section_index:  number;
          text:           string;
          color:          string;
          note?:          string | null;
          created_at?:    string;
        };
        Update: {
          id?:            string;
          user_id?:       string;
          book_id?:       string;
          book_title?:    string | null;
          chapter_id?:    string;
          chapter_title?: string | null;
          section_index?: number;
          text?:          string;
          color?:         string;
          note?:          string | null;
          created_at?:    string;
        };
        Relationships: [];
      };

      word_notes: {
        Row: {
          id:             string;
          user_id:        string;
          book_id:        string;
          book_title:     string | null;
          chapter_id:     string;
          chapter_title:  string | null;
          section_index:  number;
          word_start:     number;
          word_end:       number;
          selected_text:  string;
          note_text:      string;
          color:          string;
          created_at:     string;
          updated_at:     string;
        };
        Insert: {
          id:             string;
          user_id:        string;
          book_id:        string;
          book_title?:    string | null;
          chapter_id:     string;
          chapter_title?: string | null;
          section_index:  number;
          word_start?:    number;
          word_end?:      number;
          selected_text:  string;
          note_text?:     string;
          color:          string;
          created_at?:    string;
          updated_at?:    string;
        };
        Update: {
          id?:            string;
          user_id?:       string;
          book_id?:       string;
          book_title?:    string | null;
          chapter_id?:    string;
          chapter_title?: string | null;
          section_index?: number;
          word_start?:    number;
          word_end?:      number;
          selected_text?: string;
          note_text?:     string;
          color?:         string;
          created_at?:    string;
          updated_at?:    string;
        };
        Relationships: [];
      };

      promo_codes: {
        Row: {
          id:             string;
          code:           string;
          tier:           PromoTier;
          duration_days:  number;
          max_uses:       number | null;
          uses_count:     number;
          expires_at:     string | null;
          is_active:      boolean;
          description:    string | null;
          created_at:     string;
        };
        Insert: {
          id?:            string;
          code:           string;
          tier?:          PromoTier;
          duration_days?: number;
          max_uses?:      number | null;
          uses_count?:    number;
          expires_at?:    string | null;
          is_active?:     boolean;
          description?:   string | null;
          created_at?:    string;
        };
        Update: {
          id?:            string;
          code?:          string;
          tier?:          PromoTier;
          duration_days?: number;
          max_uses?:      number | null;
          uses_count?:    number;
          expires_at?:    string | null;
          is_active?:     boolean;
          description?:   string | null;
          created_at?:    string;
        };
        Relationships: [];
      };

      promo_redemptions: {
        Row: {
          id:           string;
          promo_id:     string;
          user_id:      string;
          redeemed_at:  string;
        };
        Insert: {
          id?:          string;
          promo_id:     string;
          user_id:      string;
          redeemed_at?: string;
        };
        Update: {
          id?:          string;
          promo_id?:    string;
          user_id?:     string;
          redeemed_at?: string;
        };
        Relationships: [];
      };

      app_settings: {
        Row: {
          key:        string;
          value:      Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key:         string;
          value?:      Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?:        string;
          value?:      Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };

      push_tokens: {
        Row: {
          id:         string;
          user_id:    string;
          token:      string;
          platform:   PushPlatform;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:         string;
          user_id:     string;
          token:       string;
          platform:    PushPlatform;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?:         string;
          user_id?:    string;
          token?:      string;
          platform?:   PushPlatform;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      push_notifications: {
        Row: {
          id:               string;
          title:            string;
          body:             string;
          data:             Json | null;
          audience:         PushAudience;
          sent_at:          string;
          sent_by:          string | null;
          recipient_count:  number;
          success_count:    number;
          error_count:      number;
          status:           PushStatus;
        };
        Insert: {
          id?:               string;
          title:             string;
          body:              string;
          data?:             Json | null;
          audience?:         PushAudience;
          sent_at?:          string;
          sent_by?:          string | null;
          recipient_count?:  number;
          success_count?:    number;
          error_count?:      number;
          status?:           PushStatus;
        };
        Update: {
          id?:               string;
          title?:            string;
          body?:             string;
          data?:             Json | null;
          audience?:         PushAudience;
          sent_at?:          string;
          sent_by?:          string | null;
          recipient_count?:  number;
          success_count?:    number;
          error_count?:      number;
          status?:           PushStatus;
        };
        Relationships: [];
      };

      audio_clips: {
        Row: {
          id:           string;
          book_id:      string;
          clip_id:      string;
          title:        string;
          duration_s:   number | null;
          storage_path: string;
          sort_order:   number;
          is_premium:   boolean;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:           string;
          book_id:       string;
          clip_id:       string;
          title:         string;
          duration_s?:   number | null;
          storage_path:  string;
          sort_order?:   number;
          is_premium?:   boolean;
          created_at?:   string;
          updated_at?:   string;
        };
        Update: {
          id?:           string;
          book_id?:      string;
          clip_id?:      string;
          title?:        string;
          duration_s?:   number | null;
          storage_path?: string;
          sort_order?:   number;
          is_premium?:   boolean;
          created_at?:   string;
          updated_at?:   string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_current_user_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
