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
      league_settings: {
        Row: {
          absent_rule: string
          absent_value: number | null
          created_at: string
          games_per_session: number
          handicap_base: number | null
          handicap_basis: string
          handicap_enabled: boolean
          handicap_method: string
          handicap_percent: number | null
          handicap_scope: string
          league_id: string
          notes: string | null
          season_end: string | null
          season_label: string | null
          season_start: string | null
          series_point: boolean
          standings_rule: string
          team_size: number | null
          tie_rule: string
          updated_at: string
          vacant_rule: string
          vacant_value: number | null
          winloss_method: string
          winloss_use_handicap: boolean
        }
        Insert: {
          absent_rule?: string
          absent_value?: number | null
          created_at?: string
          games_per_session?: number
          handicap_base?: number | null
          handicap_basis?: string
          handicap_enabled?: boolean
          handicap_method?: string
          handicap_percent?: number | null
          handicap_scope?: string
          league_id: string
          notes?: string | null
          season_end?: string | null
          season_label?: string | null
          season_start?: string | null
          series_point?: boolean
          standings_rule?: string
          team_size?: number | null
          tie_rule?: string
          updated_at?: string
          vacant_rule?: string
          vacant_value?: number | null
          winloss_method?: string
          winloss_use_handicap?: boolean
        }
        Update: {
          absent_rule?: string
          absent_value?: number | null
          created_at?: string
          games_per_session?: number
          handicap_base?: number | null
          handicap_basis?: string
          handicap_enabled?: boolean
          handicap_method?: string
          handicap_percent?: number | null
          handicap_scope?: string
          league_id?: string
          notes?: string | null
          season_end?: string | null
          season_label?: string | null
          season_start?: string | null
          series_point?: boolean
          standings_rule?: string
          team_size?: number | null
          tie_rule?: string
          updated_at?: string
          vacant_rule?: string
          vacant_value?: number | null
          winloss_method?: string
          winloss_use_handicap?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "league_settings_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
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
      lm_divisions: {
        Row: {
          code: string
          created_at: string
          id: string
          league_id: string
          name: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          league_id: string
          name?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          league_id?: string
          name?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lm_divisions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "lm_leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_league_nights: {
        Row: {
          completed_at: string | null
          created_at: string
          games_count: number | null
          id: string
          league_id: string
          night_date: string
          notes: string | null
          status: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          games_count?: number | null
          id?: string
          league_id: string
          night_date: string
          notes?: string | null
          status?: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          games_count?: number | null
          id?: string
          league_id?: string
          night_date?: string
          notes?: string | null
          status?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lm_league_nights_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "lm_leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_league_rules: {
        Row: {
          confirmation_notes: string | null
          created_at: string
          custom_rules: string | null
          game_points: number | null
          handicap_base: number | null
          handicap_method: string
          handicap_percent: number | null
          high_block_scratch: boolean
          high_single_scratch: boolean
          league_id: string
          match_point_rule: string | null
          needs_confirmation: boolean
          points_with_handicap: boolean
          series_points: number | null
          team_points: number | null
          updated_at: string
        }
        Insert: {
          confirmation_notes?: string | null
          created_at?: string
          custom_rules?: string | null
          game_points?: number | null
          handicap_base?: number | null
          handicap_method?: string
          handicap_percent?: number | null
          high_block_scratch?: boolean
          high_single_scratch?: boolean
          league_id: string
          match_point_rule?: string | null
          needs_confirmation?: boolean
          points_with_handicap?: boolean
          series_points?: number | null
          team_points?: number | null
          updated_at?: string
        }
        Update: {
          confirmation_notes?: string | null
          created_at?: string
          custom_rules?: string | null
          game_points?: number | null
          handicap_base?: number | null
          handicap_method?: string
          handicap_percent?: number | null
          high_block_scratch?: boolean
          high_single_scratch?: boolean
          league_id?: string
          match_point_rule?: string | null
          needs_confirmation?: boolean
          points_with_handicap?: boolean
          series_points?: number | null
          team_points?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lm_league_rules_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
            referencedRelation: "lm_leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_leagues: {
        Row: {
          bowlers_per_team: number | null
          bowling_day: number | null
          created_at: string
          division_count: number
          end_date: string | null
          games_per_night: number
          id: string
          is_active: boolean
          league_code: string
          name: string
          notes: string | null
          public_league_id: string | null
          season: string | null
          start_date: string | null
          start_time: string | null
          team_count: number | null
          updated_at: string
          uses_divisions: boolean
        }
        Insert: {
          bowlers_per_team?: number | null
          bowling_day?: number | null
          created_at?: string
          division_count?: number
          end_date?: string | null
          games_per_night?: number
          id?: string
          is_active?: boolean
          league_code: string
          name: string
          notes?: string | null
          public_league_id?: string | null
          season?: string | null
          start_date?: string | null
          start_time?: string | null
          team_count?: number | null
          updated_at?: string
          uses_divisions?: boolean
        }
        Update: {
          bowlers_per_team?: number | null
          bowling_day?: number | null
          created_at?: string
          division_count?: number
          end_date?: string | null
          games_per_night?: number
          id?: string
          is_active?: boolean
          league_code?: string
          name?: string
          notes?: string | null
          public_league_id?: string | null
          season?: string | null
          start_date?: string | null
          start_time?: string | null
          team_count?: number | null
          updated_at?: string
          uses_divisions?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lm_leagues_public_league_id_fkey"
            columns: ["public_league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_matchups: {
        Row: {
          created_at: string
          id: string
          lanes: string | null
          night_id: string
          team_a_id: string | null
          team_a_name: string | null
          team_b_id: string | null
          team_b_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lanes?: string | null
          night_id: string
          team_a_id?: string | null
          team_a_name?: string | null
          team_b_id?: string | null
          team_b_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lanes?: string | null
          night_id?: string
          team_a_id?: string | null
          team_a_name?: string | null
          team_b_id?: string | null
          team_b_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lm_matchups_night_id_fkey"
            columns: ["night_id"]
            isOneToOne: false
            referencedRelation: "lm_league_nights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_matchups_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "lm_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_matchups_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "lm_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_night_scores: {
        Row: {
          average_at_time: number | null
          bowler_id: string | null
          bowler_name: string | null
          created_at: string
          division_code: string | null
          game_number: number
          handicap_at_time: number | null
          id: string
          matchup_id: string | null
          night_id: string
          score: number
          team_id: string | null
          team_name: string | null
        }
        Insert: {
          average_at_time?: number | null
          bowler_id?: string | null
          bowler_name?: string | null
          created_at?: string
          division_code?: string | null
          game_number: number
          handicap_at_time?: number | null
          id?: string
          matchup_id?: string | null
          night_id: string
          score: number
          team_id?: string | null
          team_name?: string | null
        }
        Update: {
          average_at_time?: number | null
          bowler_id?: string | null
          bowler_name?: string | null
          created_at?: string
          division_code?: string | null
          game_number?: number
          handicap_at_time?: number | null
          id?: string
          matchup_id?: string | null
          night_id?: string
          score?: number
          team_id?: string | null
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lm_night_scores_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "bowlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_night_scores_matchup_id_fkey"
            columns: ["matchup_id"]
            isOneToOne: false
            referencedRelation: "lm_matchups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_night_scores_night_id_fkey"
            columns: ["night_id"]
            isOneToOne: false
            referencedRelation: "lm_league_nights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_night_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "lm_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_team_members: {
        Row: {
          bowler_id: string
          created_at: string
          division_id: string | null
          entering_average: number | null
          id: string
          is_active: boolean
          is_substitute: boolean
          team_id: string
        }
        Insert: {
          bowler_id: string
          created_at?: string
          division_id?: string | null
          entering_average?: number | null
          id?: string
          is_active?: boolean
          is_substitute?: boolean
          team_id: string
        }
        Update: {
          bowler_id?: string
          created_at?: string
          division_id?: string | null
          entering_average?: number | null
          id?: string
          is_active?: boolean
          is_substitute?: boolean
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lm_team_members_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "bowlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_team_members_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "lm_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "lm_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_teams: {
        Row: {
          captain_bowler_id: string | null
          created_at: string
          id: string
          is_active: boolean
          league_id: string
          name: string
          notes: string | null
          team_number: number | null
          updated_at: string
        }
        Insert: {
          captain_bowler_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          league_id: string
          name: string
          notes?: string | null
          team_number?: number | null
          updated_at?: string
        }
        Update: {
          captain_bowler_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          league_id?: string
          name?: string
          notes?: string | null
          team_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lm_teams_captain_bowler_id_fkey"
            columns: ["captain_bowler_id"]
            isOneToOne: false
            referencedRelation: "bowlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lm_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "lm_leagues"
            referencedColumns: ["id"]
          },
        ]
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
      team_matchups: {
        Row: {
          created_at: string
          id: string
          manual_losses: number | null
          manual_ties: number | null
          manual_wins: number | null
          opponent_team_id: string | null
          session_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manual_losses?: number | null
          manual_ties?: number | null
          manual_wins?: number | null
          opponent_team_id?: string | null
          session_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manual_losses?: number | null
          manual_ties?: number | null
          manual_wins?: number | null
          opponent_team_id?: string | null
          session_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_matchups_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_matchups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "league_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_matchups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
          team_number: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          name: string
          team_number?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          name?: string
          team_number?: number | null
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
