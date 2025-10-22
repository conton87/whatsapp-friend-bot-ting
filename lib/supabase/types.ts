export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string;
          title: string;
          group_label: string | null;
          host_name: string;
          cut_off_utc: string;
          options_slots: string[];
          options_venues: string[];
          currency: string | null;
          status: 'open' | 'confirmed';
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          group_label?: string | null;
          host_name: string;
          cut_off_utc: string;
          options_slots: string[];
          options_venues: string[];
          currency?: string | null;
          status?: 'open' | 'confirmed';
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['plans']['Insert']>;
      };
      responses: {
        Row: {
          id: string;
          plan_id: string;
          display_name: string;
          choice_slots: string[];
          choice_venue: string | null;
          attendance: 'in' | 'maybe' | 'out';
          pledge_amount: string | null;
          notes: string | null;
          ip_hash: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          plan_id: string;
          display_name: string;
          choice_slots: string[];
          choice_venue?: string | null;
          attendance?: 'in' | 'maybe' | 'out';
          pledge_amount?: string | null;
          notes?: string | null;
          ip_hash?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['responses']['Insert']>;
      };
      decisions: {
        Row: {
          id: string;
          plan_id: string;
          slot: string;
          venue: string;
          per_person_estimate: string | null;
          map_url: string | null;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          plan_id: string;
          slot: string;
          venue: string;
          per_person_estimate?: string | null;
          map_url?: string | null;
          confirmed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['decisions']['Insert']>;
      };
      host_tokens: {
        Row: {
          token: string;
          plan_id: string;
          created_at: string | null;
        };
        Insert: {
          token: string;
          plan_id: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['host_tokens']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
