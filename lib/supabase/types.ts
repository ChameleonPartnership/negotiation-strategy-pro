export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      strategy_projects: {
        Row: {
          id: string
          user_id: string
          name: string
          negotiation_for: string | null
          stakeholders: string | null
          draft_date: string | null
          sign_off: string | null
          start_date: string | null
          contingency_dates: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          negotiation_for?: string | null
          stakeholders?: string | null
          draft_date?: string | null
          sign_off?: string | null
          start_date?: string | null
          contingency_dates?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          negotiation_for?: string | null
          stakeholders?: string | null
          draft_date?: string | null
          sign_off?: string | null
          start_date?: string | null
          contingency_dates?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      scoping: {
        Row: {
          id: string
          project_id: string
          internal_stakeholders: string | null
          external_stakeholders: string | null
          preferred_approach: string | null
          our_outcomes: string | null
          their_outcomes: string | null
          main_issues: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          internal_stakeholders?: string | null
          external_stakeholders?: string | null
          preferred_approach?: string | null
          our_outcomes?: string | null
          their_outcomes?: string | null
          main_issues?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          internal_stakeholders?: string | null
          external_stakeholders?: string | null
          preferred_approach?: string | null
          our_outcomes?: string | null
          their_outcomes?: string | null
          main_issues?: string | null
          created_at?: string
        }
      }
      orientation: {
        Row: {
          id: string
          project_id: string
          answers: Json
          result: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          answers?: Json
          result?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          answers?: Json
          result?: string | null
          created_at?: string
        }
      }
      approach: {
        Row: {
          id: string
          project_id: string
          answers: Json
          result: string | null
          override: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          answers?: Json
          result?: string | null
          override?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          answers?: Json
          result?: string | null
          override?: string | null
          created_at?: string
        }
      }
      power_state: {
        Row: {
          id: string
          project_id: string
          scores: Json
          total_score: number | null
          power_state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scores?: Json
          total_score?: number | null
          power_state?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scores?: Json
          total_score?: number | null
          power_state?: string | null
          created_at?: string
        }
      }
      strategy_selection: {
        Row: {
          id: string
          project_id: string
          answers: Json
          suggested_strategy: string | null
          final_strategy: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          answers?: Json
          suggested_strategy?: string | null
          final_strategy?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          answers?: Json
          suggested_strategy?: string | null
          final_strategy?: string | null
          created_at?: string
        }
      }
      scenarios: {
        Row: {
          id: string
          project_id: string
          scenario_number: number
          name: string | null
          strategy: string | null
        }
        Insert: {
          id?: string
          project_id: string
          scenario_number: number
          name?: string | null
          strategy?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          scenario_number?: number
          name?: string | null
          strategy?: string | null
        }
      }
      phase_planners: {
        Row: {
          id: string
          scenario_id: string
          phase_data: Json
          trigger_a: string | null
          trigger_b: string | null
          trigger_c: string | null
          trigger_d: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          phase_data?: Json
          trigger_a?: string | null
          trigger_b?: string | null
          trigger_c?: string | null
          trigger_d?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scenario_id?: string
          phase_data?: Json
          trigger_a?: string | null
          trigger_b?: string | null
          trigger_c?: string | null
          trigger_d?: string | null
          created_at?: string
        }
      }
      action_planners: {
        Row: {
          id: string
          scenario_id: string
          planner_number: number
          strategy_label: string | null
          start_date: string | null
          phase_1: string | null
          phase_2: string | null
          phase_3: string | null
          phase_4: string | null
          phase_5: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          scenario_id: string
          planner_number: number
          strategy_label?: string | null
          start_date?: string | null
          phase_1?: string | null
          phase_2?: string | null
          phase_3?: string | null
          phase_4?: string | null
          phase_5?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          scenario_id?: string
          planner_number?: number
          strategy_label?: string | null
          start_date?: string | null
          phase_1?: string | null
          phase_2?: string | null
          phase_3?: string | null
          phase_4?: string | null
          phase_5?: string | null
          notes?: string | null
        }
      }
      ppa: {
        Row: {
          id: string
          scenario_id: string
          variant: string
          rows: Json
        }
        Insert: {
          id?: string
          scenario_id: string
          variant: string
          rows?: Json
        }
        Update: {
          id?: string
          scenario_id?: string
          variant?: string
          rows?: Json
        }
      }
      triggers: {
        Row: {
          id: string
          project_id: string
          trigger_data: Json
          notes: string | null
        }
        Insert: {
          id?: string
          project_id: string
          trigger_data?: Json
          notes?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          trigger_data?: Json
          notes?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type StrategyProject = Database['public']['Tables']['strategy_projects']['Row']
export type Scoping = Database['public']['Tables']['scoping']['Row']
export type Orientation = Database['public']['Tables']['orientation']['Row']
export type Approach = Database['public']['Tables']['approach']['Row']
export type PowerState = Database['public']['Tables']['power_state']['Row']
export type StrategySelection = Database['public']['Tables']['strategy_selection']['Row']
export type Scenario = Database['public']['Tables']['scenarios']['Row']
export type PhasePlanner = Database['public']['Tables']['phase_planners']['Row']
export type ActionPlanner = Database['public']['Tables']['action_planners']['Row']
export type PPA = Database['public']['Tables']['ppa']['Row']
export type Trigger = Database['public']['Tables']['triggers']['Row']
