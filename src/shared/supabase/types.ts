export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          favorite_artists: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          favorite_artists?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      tracks: {
        Row: {
          id: string;
          title: string;
          artist_name: string;
          album_title: string | null;
          artwork_url: string | null;
          duration_seconds: number | null;
          popularity_score: number;
          tags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist_name: string;
          album_title?: string | null;
          artwork_url?: string | null;
          duration_seconds?: number | null;
          popularity_score?: number;
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracks"]["Insert"]>;
      };
      track_sources: {
        Row: {
          id: string;
          track_id: string;
          provider_id: string;
          provider_track_id: string;
          source_url: string | null;
          stream_url: string | null;
          artwork_url: string | null;
          quality: string | null;
          region_codes: string[];
          is_playable: boolean;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          provider_id: string;
          provider_track_id: string;
          source_url?: string | null;
          stream_url?: string | null;
          artwork_url?: string | null;
          quality?: string | null;
          region_codes?: string[];
          is_playable?: boolean;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["track_sources"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

