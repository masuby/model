/**
 * Database types generated from the live Supabase schema (project inform-tanzania) after migrations
 * 0001–0004. Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id eovhjdkwtxuidndypozp > src/data-layer/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      audit_log: {
        Row: { action: string; actor_id: string | null; actor_name: string | null; at: string; detail: string | null; id: number; unit_id: string | null; unit_name: string | null };
        Insert: { action: string; actor_id?: string | null; actor_name?: string | null; at?: string; detail?: string | null; id?: number; unit_id?: string | null; unit_name?: string | null };
        Update: { action?: string; actor_id?: string | null; actor_name?: string | null; at?: string; detail?: string | null; id?: number; unit_id?: string | null; unit_name?: string | null };
        Relationships: [];
      };
      data_requests: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          created_by: string | null;
          created_by_name: string;
          due_date: string | null;
          id: string;
          institution_key: string;
          kind: string;
          message: string | null;
          response_note: string | null;
          spec_id: string;
          status: string;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_by_name: string;
          due_date?: string | null;
          id?: string;
          institution_key: string;
          kind: string;
          message?: string | null;
          response_note?: string | null;
          spec_id: string;
          status?: string;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_by_name?: string;
          due_date?: string | null;
          id?: string;
          institution_key?: string;
          kind?: string;
          message?: string | null;
          response_note?: string | null;
          spec_id?: string;
          status?: string;
        };
        Relationships: Rel[];
      };
      indicator_assignments: {
        Row: { assigned_at: string; assigned_by: string | null; institution_key: string; note: string | null; spec_id: string };
        Insert: { assigned_at?: string; assigned_by?: string | null; institution_key: string; note?: string | null; spec_id: string };
        Update: { assigned_at?: string; assigned_by?: string | null; institution_key?: string; note?: string | null; spec_id?: string };
        Relationships: Rel[];
      };
      notifications: {
        Row: {
          id: string;
          institution_key: string;
          kind: string;
          spec_id: string | null;
          request_id: string | null;
          submission_id: string | null;
          title: string;
          body: string | null;
          due_date: string | null;
          created_at: string;
          read_at: string | null;
          email_status: string;
          email_error: string | null;
        };
        Insert: {
          id?: string;
          institution_key: string;
          kind: string;
          spec_id?: string | null;
          request_id?: string | null;
          submission_id?: string | null;
          title: string;
          body?: string | null;
          due_date?: string | null;
          created_at?: string;
          read_at?: string | null;
          email_status?: string;
          email_error?: string | null;
        };
        Update: { read_at?: string | null; email_status?: string; email_error?: string | null };
        Relationships: [];
      };
      indicator_validations: {
        Row: { id: number; institution_key: string | null; note: string | null; request_id: string | null; spec_id: string; validated_at: string; validated_by: string | null; validated_by_name: string };
        Insert: { id?: number; institution_key?: string | null; note?: string | null; request_id?: string | null; spec_id: string; validated_at?: string; validated_by?: string | null; validated_by_name: string };
        Update: { id?: number; institution_key?: string | null; note?: string | null; request_id?: string | null; spec_id?: string; validated_at?: string; validated_by?: string | null; validated_by_name?: string };
        Relationships: Rel[];
      };
      indicator_values: {
        Row: {
          author_name: string | null;
          authority: string | null;
          dataset: string | null;
          note: string | null;
          ref: string;
          submission_id: string | null;
          unit_id: string;
          updated_at: string;
          updated_by: string | null;
          value: number | null;
        };
        Insert: {
          author_name?: string | null;
          authority?: string | null;
          dataset?: string | null;
          note?: string | null;
          ref: string;
          submission_id?: string | null;
          unit_id: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: number | null;
        };
        Update: {
          author_name?: string | null;
          authority?: string | null;
          dataset?: string | null;
          note?: string | null;
          ref?: string;
          submission_id?: string | null;
          unit_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: number | null;
        };
        Relationships: Rel[];
      };
      indicators: {
        Row: { component: string | null; core: boolean; dimension: string | null; name: string; spec_id: string; unit: string | null };
        Insert: { component?: string | null; core?: boolean; dimension?: string | null; name: string; spec_id: string; unit?: string | null };
        Update: { component?: string | null; core?: boolean; dimension?: string | null; name?: string; spec_id?: string; unit?: string | null };
        Relationships: [];
      };
      institutions: {
        Row: { created_at: string; full_name: string; key: string; kind: string; label: string };
        Insert: { created_at?: string; full_name: string; key: string; kind?: string; label: string };
        Update: { created_at?: string; full_name?: string; key?: string; kind?: string; label?: string };
        Relationships: [];
      };
      profiles: {
        Row: { created_at: string; full_name: string; id: string; institution: string | null; institution_key: string | null; role: Database['public']['Enums']['app_role']; scope_unit_id: string | null };
        Insert: { created_at?: string; full_name?: string; id: string; institution?: string | null; institution_key?: string | null; role?: Database['public']['Enums']['app_role']; scope_unit_id?: string | null };
        Update: { created_at?: string; full_name?: string; id?: string; institution?: string | null; institution_key?: string | null; role?: Database['public']['Enums']['app_role']; scope_unit_id?: string | null };
        Relationships: Rel[];
      };
      committee_records: {
        Row: {
          author_id: string;
          author_name: string;
          author_role: string | null;
          created_at: string;
          hazard: string | null;
          id: string;
          kind: string;
          level: string;
          note: string | null;
          payload: Json;
          region: string;
          region_id: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
          reviewer_name: string | null;
          source: string;
          status: string;
          unit_id: string;
          unit_name: string;
          valid_from: string | null;
          valid_to: string | null;
        };
        Insert: {
          author_id?: string;
          author_name: string;
          author_role?: string | null;
          created_at?: string;
          hazard?: string | null;
          id?: string;
          kind: string;
          level: string;
          note?: string | null;
          payload: Json;
          region?: string;
          region_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          source: string;
          status?: string;
          unit_id: string;
          unit_name: string;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: {
          author_id?: string;
          author_name?: string;
          author_role?: string | null;
          created_at?: string;
          hazard?: string | null;
          id?: string;
          kind?: string;
          level?: string;
          note?: string | null;
          payload?: Json;
          region?: string;
          region_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          source?: string;
          status?: string;
          unit_id?: string;
          unit_name?: string;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Relationships: Rel[];
      };
      raw_submissions: {
        Row: {
          method: string | null;
          source: string | null;
          value_type: string;
          author_id: string;
          author_name: string;
          created_at: string;
          dataset: string;
          entries: Json;
          id: string;
          institution_key: string | null;
          note: string | null;
          period: string | null;
          request_id: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
          reviewer_name: string | null;
          spec_id: string;
          status: string;
        };
        Insert: {
          method?: string | null;
          source?: string | null;
          value_type?: string;
          author_id?: string;
          author_name: string;
          created_at?: string;
          dataset: string;
          entries: Json;
          id?: string;
          institution_key?: string | null;
          note?: string | null;
          period?: string | null;
          request_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          spec_id: string;
          status?: string;
        };
        Update: {
          method?: string | null;
          source?: string | null;
          value_type?: string;
          author_id?: string;
          author_name?: string;
          created_at?: string;
          dataset?: string;
          entries?: Json;
          id?: string;
          institution_key?: string | null;
          note?: string | null;
          period?: string | null;
          request_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          spec_id?: string;
          status?: string;
        };
        Relationships: Rel[];
      };
      raw_values: {
        Row: {
          method: string | null;
          source: string | null;
          value_type: string;
          author_name: string | null;
          dataset: string | null;
          institution_key: string | null;
          level: string;
          period: string | null;
          spec_id: string;
          submission_id: string | null;
          unit_id: string;
          updated_at: string;
          updated_by: string | null;
          value: number | null;
        };
        Insert: {
          method?: string | null;
          source?: string | null;
          value_type?: string;
          author_name?: string | null;
          dataset?: string | null;
          institution_key?: string | null;
          level: string;
          period?: string | null;
          spec_id: string;
          submission_id?: string | null;
          unit_id: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: number | null;
        };
        Update: {
          method?: string | null;
          source?: string | null;
          value_type?: string;
          author_name?: string | null;
          dataset?: string | null;
          institution_key?: string | null;
          level?: string;
          period?: string | null;
          spec_id?: string;
          submission_id?: string | null;
          unit_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: number | null;
        };
        Relationships: Rel[];
      };
      submissions: {
        Row: {
          author_id: string;
          author_name: string;
          authority: string;
          changes: Json;
          created_at: string;
          dataset: string | null;
          id: string;
          note: string | null;
          region: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
          reviewer_name: string | null;
          status: string;
          unit_id: string;
          unit_name: string;
        };
        Insert: {
          author_id?: string;
          author_name: string;
          authority: string;
          changes: Json;
          created_at?: string;
          dataset?: string | null;
          id?: string;
          note?: string | null;
          region?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          status?: string;
          unit_id: string;
          unit_name: string;
        };
        Update: {
          author_id?: string;
          author_name?: string;
          authority?: string;
          changes?: Json;
          created_at?: string;
          dataset?: string | null;
          id?: string;
          note?: string | null;
          region?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          reviewer_name?: string | null;
          status?: string;
          unit_id?: string;
          unit_name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      indicator_values_public: {
        Row: { unit_id: string; ref: string; value: number | null; authority: string | null; dataset: string | null; note: string | null; updated_at: string };
        Relationships: [];
      };
      raw_values_public: {
        Row: {
          spec_id: string;
          unit_id: string;
          level: string;
          value: number | null;
          value_type: string | null;
          method: string | null;
          source: string | null;
          dataset: string | null;
          period: string | null;
          institution_key: string | null;
          submission_id: string | null;
          updated_at: string;
        };
        Relationships: [];
      };
      indicator_validations_public: {
        Row: { id: number; spec_id: string; institution_key: string; request_id: string | null; note: string | null; validated_at: string };
        Relationships: [];
      };
    };
    Functions: {
      assign_indicators: { Args: { p_institution_key: string; p_note?: string; p_spec_ids: string[] }; Returns: number };
      close_request: { Args: { p_id: string; p_note?: string; p_status: string }; Returns: undefined };
      confirm_values: { Args: { p_note?: string; p_request_id?: string; p_spec_id: string }; Returns: undefined };
      create_requests: { Args: { p_due?: string; p_kind: string; p_message?: string; p_spec_ids: string[] }; Returns: number };
      revert_raw_value: { Args: { p_spec_id: string; p_unit_id: string }; Returns: undefined };
      revert_value: { Args: { p_ref: string; p_unit_id: string; p_unit_name?: string }; Returns: undefined };
      review_committee_record: { Args: { p_decision: string; p_id: string; p_note?: string }; Returns: undefined };
      review_raw_submission: { Args: { p_decision: string; p_id: string; p_note?: string }; Returns: undefined };
      submit_committee_record: {
        Args: {
          p_hazard?: string;
          p_kind: string;
          p_level: string;
          p_note?: string;
          p_payload: Json;
          p_region: string;
          p_region_id?: string;
          p_source: string;
          p_unit_id: string;
          p_unit_name: string;
          p_valid_from?: string;
          p_valid_to?: string;
        };
        Returns: string;
      };
      review_submission: { Args: { p_decision: string; p_id: string; p_note?: string }; Returns: undefined };
      submit_raw_values: {
        Args: { p_dataset: string; p_entries: Json; p_method?: string; p_note?: string; p_period?: string; p_request_id?: string; p_source?: string; p_spec_id: string; p_value_type?: string };
        Returns: string;
      };
    };
    Enums: { app_role: 'viewer' | 'sector' | 'ddrrc' | 'rdrrc' | 'ndrrc' | 'pmo' | 'admin' };
    CompositeTypes: { [_ in never]: never };
  };
};
