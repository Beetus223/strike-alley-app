export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          is_active: boolean
          message: string
          starts_on: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          message: string
          starts_on?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          message?: string
          starts_on?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          booking_type: string
          contact_name: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          lanes: number
          notes: string | null
          party_size: number
          phone: string
          requested_date: string
          requested_time: string
          staff_notes: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          booking_type: string
          contact_name: string
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          lanes?: number
          notes?: string | null
          party_size?: number
          phone: string
          requested_date: string
          requested_time: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          booking_type?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          lanes?: number
          notes?: string | null
          party_size?: number
          phone?: string
          requested_date?: string
          requested_time?: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: []
      }
      bowlers: {
        Row: {
          bowler_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bowler_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bowler_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string | null
          featured: boolean
          id: string
          is_active: boolean
          schedule_text: string | null
          sort_order: number
          start_date: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          featured?: boolean
          id?: string
          is_active?: boolean
          schedule_text?: string | null
          sort_order?: number
          start_date?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          featured?: boolean
          id?: string
          is_active?: boolean
          schedule_text?: string | null
          sort_order?: number
          start_date?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hours_of_operation: {
        Row: {
          created_at: string
          day_label: string
          day_of_week: number
          food_service: string | null
          glow_bowling: string | null
          id: string
          note: string | null
          open_hours: string
          public_bowling: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_label: string
          day_of_week: number
          food_service?: string | null
          glow_bowling?: string | null
          id?: string
          note?: string | null
          open_hours?: string
          public_bowling?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_label?: string
          day_of_week?: number
          food_service?: string | null
          glow_bowling?: string | null
          id?: string
          note?: string | null
          open_hours?: string
          public_bowling?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      league_sessions: {
        Row: {
          created_at: string
          id: string
          league_id: string
          notes: string | null
          session_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          notes?: string | null
          session_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          notes?: string | null
          session_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_sessions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          description: string | null
          fee: string
          format: string
          handicap_base: number
          handicap_percent: number
          id: string
          is_active: boolean
          name: string
          night: string
          registration_open: boolean
          season: string
          slug: string
          sort_order: number
          spots: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee: string
          format: string
          handicap_base?: number
          handicap_percent?: number
          id?: string
          is_active?: boolean
          name: string
          night: string
          registration_open?: boolean
          season: string
          slug: string
          sort_order?: number
          spots?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee?: string
          format?: string
          handicap_base?: number
          handicap_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          night?: string
          registration_open?: boolean
          season?: string
          slug?: string
          sort_order?: number
          spots?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          average: number
          bowler_ref: string | null
          created_at: string
          first_name: string
          games_played: number
          id: string
          is_active: boolean
          last_name: string
          league_id: string
          profile_id: string | null
          team_id: string | null
          total_pinfall: number
        }
        Insert: {
          average?: number
          bowler_ref?: string | null
          created_at?: string
          first_name: string
          games_played?: number
          id?: string
          is_active?: boolean
          last_name: string
          league_id: string
          profile_id?: string | null
          team_id?: string | null
          total_pinfall?: number
        }
        Update: {
          average?: number
          bowler_ref?: string | null
          created_at?: string
          first_name?: string
          games_played?: number
          id?: string
          is_active?: boolean
          last_name?: string
          league_id?: string
          profile_id?: string | null
          team_id?: string | null
          total_pinfall?: number
        }
        Relationships: [
          {
            foreignKeyName: "players_bowler_ref_fkey"
            columns: ["bowler_ref"]
            isOneToOne: false
            referencedRelation: "bowlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          note: string | null
          price: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          note?: string | null
          price: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          note?: string | null
          price?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          created_at: string
          entered_by: string | null
          game_number: number
          id: string
          league_id: string
          player_id: string
          score: number
          session_id: string | null
          week_date: string
        }
        Insert: {
          created_at?: string
          entered_by?: string | null
          game_number: number
          id?: string
          league_id: string
          player_id: string
          score: number
          session_id?: string | null
          week_date: string
        }
        Update: {
          created_at?: string
          entered_by?: string | null
          game_number?: number
          id?: string
          league_id?: string
          player_id?: string
          score?: number
          session_id?: string | null
          week_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "league_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_hour_schedules: {
        Row: {
          created_at: string
          date_label: string
          id: string
          is_active: boolean
          reservation_notice: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_label: string
          id?: string
          is_active?: boolean
          reservation_notice: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_label?: string
          id?: string
          is_active?: boolean
          reservation_notice?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      seasonal_hours: {
        Row: {
          bowler_hours: string | null
          created_at: string
          day_label: string
          day_of_week: number
          food_service: string | null
          id: string
          note: string | null
          schedule_id: string
          updated_at: string
        }
        Insert: {
          bowler_hours?: string | null
          created_at?: string
          day_label: string
          day_of_week: number
          food_service?: string | null
          id?: string
          note?: string | null
          schedule_id: string
          updated_at?: string
        }
        Update: {
          bowler_hours?: string | null
          created_at?: string
          day_label?: string
          day_of_week?: number
          food_service?: string | null
          id?: string
          note?: string | null
          schedule_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_hours_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "seasonal_hour_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          league_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_bowler_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "staff" | "player"
      booking_status: "new" | "confirmed" | "declined" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "player"],
      booking_status: ["new", "confirmed", "declined", "completed"],
    },
  },
} as const
