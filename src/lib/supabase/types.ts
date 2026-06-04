export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_config: {
        Row: {
          id: number
          lock_at: string
          first_match_at: string
        }
        Insert: {
          id?: number
          lock_at: string
          first_match_at: string
        }
        Update: {
          id?: number
          lock_at?: string
          first_match_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          is_admin?: boolean
          created_at?: string
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          join_code: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          join_code: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          join_code?: string
          created_by?: string | null
          created_at?: string
        }
      }
      league_members: {
        Row: {
          league_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          league_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          league_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          fifa_code: string
          group_letter: string
          flag_emoji: string | null
          blurb: string | null
          stars: string[] | null
          confederation: string | null
        }
        Insert: {
          id?: string
          name: string
          fifa_code: string
          group_letter: string
          flag_emoji?: string | null
          blurb?: string | null
          stars?: string[] | null
          confederation?: string | null
        }
        Update: {
          id?: string
          name?: string
          fifa_code?: string
          group_letter?: string
          flag_emoji?: string | null
          blurb?: string | null
          stars?: string[] | null
          confederation?: string | null
        }
      }
      matches: {
        Row: {
          id: string
          stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third'
          group_letter: string | null
          home_team_id: string | null
          away_team_id: string | null
          kickoff_at: string | null
          actual_home_score: number | null
          actual_away_score: number | null
          actual_winner_id: string | null
          decided_by: 'ft' | 'et' | 'pens' | null
          bracket_slot: number | null
          venue: string | null
          is_final: boolean
        }
        Insert: {
          id?: string
          stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third'
          group_letter?: string | null
          home_team_id?: string | null
          away_team_id?: string | null
          kickoff_at?: string | null
          actual_home_score?: number | null
          actual_away_score?: number | null
          actual_winner_id?: string | null
          decided_by?: 'ft' | 'et' | 'pens' | null
          bracket_slot?: number | null
          venue?: string | null
          is_final?: boolean
        }
        Update: {
          id?: string
          stage?: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third'
          group_letter?: string | null
          home_team_id?: string | null
          away_team_id?: string | null
          kickoff_at?: string | null
          actual_home_score?: number | null
          actual_away_score?: number | null
          actual_winner_id?: string | null
          decided_by?: 'ft' | 'et' | 'pens' | null
          bracket_slot?: number | null
          venue?: string | null
          is_final?: boolean
        }
      }
      predictions_group: {
        Row: {
          id: string
          user_id: string
          match_id: string
          pred_home_score: number | null
          pred_away_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          pred_home_score?: number | null
          pred_away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          pred_home_score?: number | null
          pred_away_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      predictions_knockout: {
        Row: {
          id: string
          user_id: string
          bracket_slot: number
          pred_home_team_id: string | null
          pred_away_team_id: string | null
          pred_home_score: number | null
          pred_away_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bracket_slot: number
          pred_home_team_id?: string | null
          pred_away_team_id?: string | null
          pred_home_score?: number | null
          pred_away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bracket_slot?: number
          pred_home_team_id?: string | null
          pred_away_team_id?: string | null
          pred_home_score?: number | null
          pred_away_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      predicted_brackets: {
        Row: {
          user_id: string
          bracket_data: Json
          computed_at: string
        }
        Insert: {
          user_id: string
          bracket_data: Json
          computed_at?: string
        }
        Update: {
          user_id?: string
          bracket_data?: Json
          computed_at?: string
        }
      }
      scores: {
        Row: {
          user_id: string
          group_pts: number
          advancement_pts: number
          knockout_match_pts: number
          total_pts: number
          updated_at: string
        }
        Insert: {
          user_id: string
          group_pts?: number
          advancement_pts?: number
          knockout_match_pts?: number
          total_pts?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          group_pts?: number
          advancement_pts?: number
          knockout_match_pts?: number
          total_pts?: number
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          name: string
          position: 'GK' | 'DEF' | 'MID' | 'FWD' | null
          club: string | null
          shirt_number: number | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          position?: 'GK' | 'DEF' | 'MID' | 'FWD' | null
          club?: string | null
          shirt_number?: number | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          position?: 'GK' | 'DEF' | 'MID' | 'FWD' | null
          club?: string | null
          shirt_number?: number | null
          is_active?: boolean
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          league_id: string
          user_id: string
          body: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      notification_prefs: {
        Row: {
          user_id: string
          email_lock_reminder: boolean
          email_lock_confirmed: boolean
          email_leaderboard_digest: boolean
        }
        Insert: {
          user_id: string
          email_lock_reminder?: boolean
          email_lock_confirmed?: boolean
          email_leaderboard_digest?: boolean
        }
        Update: {
          user_id?: string
          email_lock_reminder?: boolean
          email_lock_confirmed?: boolean
          email_leaderboard_digest?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience type aliases
export type Team = Database['public']['Tables']['teams']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type PredictionGroup = Database['public']['Tables']['predictions_group']['Row']
export type PredictionKnockout = Database['public']['Tables']['predictions_knockout']['Row']
export type Score = Database['public']['Tables']['scores']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type League = Database['public']['Tables']['leagues']['Row']
export type Player = Database['public']['Tables']['players']['Row']
