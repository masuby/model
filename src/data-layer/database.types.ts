/**
 * Database types generated from the live Supabase schema (project inform-tanzania) after migrations
 * 0001–0003. Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id eovhjdkwtxuidndypozp > src/data-layer/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
        Relationships: [
          { foreignKeyName: 'indicator_values_submission_id_fkey'; columns: ['submission_id']; isOneToOne: false; referencedRelation: 'submissions'; referencedColumns: ['id'] },
        ];
      };
      profiles: {
        Row: { created_at: string; full_name: string; id: string; institution: string | null; role: Database['public']['Enums']['app_role'] };
        Insert: { created_at?: string; full_name?: string; id: string; institution?: string | null; role?: Database['public']['Enums']['app_role'] };
        Update: { created_at?: string; full_name?: string; id?: string; institution?: string | null; role?: Database['public']['Enums']['app_role'] };
        Relationships: [];
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
    Views: { [_ in never]: never };
    Functions: {
      revert_value: { Args: { p_ref: string; p_unit_id: string; p_unit_name?: string }; Returns: undefined };
      review_submission: { Args: { p_decision: string; p_id: string; p_note?: string }; Returns: undefined };
    };
    Enums: { app_role: 'viewer' | 'sector' | 'pmo' | 'admin' };
    CompositeTypes: { [_ in never]: never };
  };
};
