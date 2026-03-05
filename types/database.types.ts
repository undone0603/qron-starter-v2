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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit: number | null
          scopes: string[] | null
          total_requests: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit?: number | null
          scopes?: string[] | null
          total_requests?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit?: number | null
          scopes?: string[] | null
          total_requests?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json
          job_type: string
          output_data: Json | null
          priority: number | null
          progress: number | null
          qron_id: string | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data: Json
          job_type: string
          output_data?: Json | null
          priority?: number | null
          progress?: number | null
          qron_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type?: string
          output_data?: Json | null
          priority?: number | null
          progress?: number | null
          qron_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_queue_qron_id_fkey"
            columns: ["qron_id"]
            isOneToOne: false
            referencedRelation: "qrons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_facts: {
        Row: {
          blockchain_hash: string | null
          created_at: string
          fact_id: string
          geo: string
          payload: Json
          severity: number
          sku_id: string
          source: string
          time_window_end: string
          time_window_start: string
          type: Database["public"]["Enums"]["historical_fact_type"]
        }
        Insert: {
          blockchain_hash?: string | null
          created_at?: string
          fact_id?: string
          geo: string
          payload?: Json
          severity: number
          sku_id: string
          source: string
          time_window_end: string
          time_window_start: string
          type: Database["public"]["Enums"]["historical_fact_type"]
        }
        Update: {
          blockchain_hash?: string | null
          created_at?: string
          fact_id?: string
          geo?: string
          payload?: Json
          severity?: number
          sku_id?: string
          source?: string
          time_window_end?: string
          time_window_start?: string
          type?: Database["public"]["Enums"]["historical_fact_type"]
        }
        Relationships: [
          {
            foreignKeyName: "historical_facts_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "sku_analytics_summary"
            referencedColumns: ["sku_id"]
          },
          {
            foreignKeyName: "historical_facts_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["sku_id"]
          },
        ]
      }
      living_art_schedules: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          qron_id: string | null
          start_time: string
          target_image_url: string
          transition_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          qron_id?: string | null
          start_time: string
          target_image_url: string
          transition_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          qron_id?: string | null
          start_time?: string
          target_image_url?: string
          transition_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "living_art_schedules_qron_id_fkey"
            columns: ["qron_id"]
            isOneToOne: false
            referencedRelation: "qrons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "living_art_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          authenticity_features: Json | null
          confidence: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          features: Json | null
          id: number
          industry_id: number | null
          name: string
          price: number | null
          slug: string | null
          status: string | null
          story: string | null
          tenant_id: string | null
          updated_at: string | null
          workflow: string[] | null
        }
        Insert: {
          authenticity_features?: Json | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          features?: Json | null
          id?: number
          industry_id?: number | null
          name: string
          price?: number | null
          slug?: string | null
          status?: string | null
          story?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          workflow?: string[] | null
        }
        Update: {
          authenticity_features?: Json | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          features?: Json | null
          id?: number
          industry_id?: number | null
          name?: string
          price?: number | null
          slug?: string | null
          status?: string | null
          story?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          workflow?: string[] | null
        }
        Relationships: []
      }
      products_v2: {
        Row: {
          authenticity_features: Json | null
          category_id: string | null
          confidence: number | null
          created_at: string
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          industry_id: number | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number | null
          sku: string | null
          stock: number | null
          story: string | null
          tags: string[] | null
          updated_at: string
          vendor_id: string | null
          workflow: string[] | null
        }
        Insert: {
          authenticity_features?: Json | null
          category_id?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          industry_id?: number | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price?: number | null
          sku?: string | null
          stock?: number | null
          story?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor_id?: string | null
          workflow?: string[] | null
        }
        Update: {
          authenticity_features?: Json | null
          category_id?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          industry_id?: number | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number | null
          sku?: string | null
          stock?: number | null
          story?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor_id?: string | null
          workflow?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          generations_limit: number | null
          generations_used: number | null
          id: string
          referral_code: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          generations_limit?: number | null
          generations_used?: number | null
          id: string
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          generations_limit?: number | null
          generations_used?: number | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qron_tags: {
        Row: {
          created_at: string | null
          qron_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          qron_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          qron_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qron_tags_qron_id_fkey"
            columns: ["qron_id"]
            isOneToOne: false
            referencedRelation: "qrons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qron_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      qrons: {
        Row: {
          ai_prompt: string | null
          audio_url: string | null
          created_at: string | null
          current_art_schedule_id: string | null
          download_count: number | null
          expires_at: string | null
          folder_id: string | null
          has_dynamic_redirect: boolean | null
          id: string
          image_url: string
          is_demo: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          metadata: Json | null
          mode: string
          nft_chain: string | null
          nft_contract_address: string | null
          nft_token_id: string | null
          nft_transaction_hash: string | null
          prompt: string | null
          qr_content: string
          scan_count: number | null
          seed: number | null
          short_code: string | null
          storage_path: string
          style: string | null
          target_url: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          ai_prompt?: string | null
          audio_url?: string | null
          created_at?: string | null
          current_art_schedule_id?: string | null
          download_count?: number | null
          expires_at?: string | null
          folder_id?: string | null
          has_dynamic_redirect?: boolean | null
          id: string
          image_url: string
          is_demo?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          mode: string
          nft_chain?: string | null
          nft_contract_address?: string | null
          nft_token_id?: string | null
          nft_transaction_hash?: string | null
          prompt?: string | null
          qr_content: string
          scan_count?: number | null
          seed?: number | null
          short_code?: string | null
          storage_path: string
          style?: string | null
          target_url: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          ai_prompt?: string | null
          audio_url?: string | null
          created_at?: string | null
          current_art_schedule_id?: string | null
          download_count?: number | null
          expires_at?: string | null
          folder_id?: string | null
          has_dynamic_redirect?: boolean | null
          id?: string
          image_url?: string
          is_demo?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          mode?: string
          nft_chain?: string | null
          nft_contract_address?: string | null
          nft_token_id?: string | null
          nft_transaction_hash?: string | null
          prompt?: string | null
          qr_content?: string
          scan_count?: number | null
          seed?: number | null
          short_code?: string | null
          storage_path?: string
          style?: string | null
          target_url?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qrons_current_art_schedule_id_fkey"
            columns: ["current_art_schedule_id"]
            isOneToOne: false
            referencedRelation: "living_art_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qrons_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_events: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string | null
          device_type: string | null
          id: string
          ip_hash: string | null
          os: string | null
          qron_id: string | null
          referrer_url: string | null
          region: string | null
          scanned_at: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          os?: string | null
          qron_id?: string | null
          referrer_url?: string | null
          region?: string | null
          scanned_at?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          os?: string | null
          qron_id?: string | null
          referrer_url?: string | null
          region?: string | null
          scanned_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_qron_id_fkey"
            columns: ["qron_id"]
            isOneToOne: false
            referencedRelation: "qrons"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          brand_id: string
          canonical_sku: string
          category: Database["public"]["Enums"]["sku_category"]
          created_at: string
          first_seen_year: number | null
          historical_confidence_score: number
          historical_counterfeit_count: number
          known_channels: Json | null
          last_seen_year: number | null
          sku_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          canonical_sku: string
          category?: Database["public"]["Enums"]["sku_category"]
          created_at?: string
          first_seen_year?: number | null
          historical_confidence_score?: number
          historical_counterfeit_count?: number
          known_channels?: Json | null
          last_seen_year?: number | null
          sku_id?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          canonical_sku?: string
          category?: Database["public"]["Enums"]["sku_category"]
          created_at?: string
          first_seen_year?: number | null
          historical_confidence_score?: number
          historical_counterfeit_count?: number
          known_channels?: Json | null
          last_seen_year?: number | null
          sku_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skus_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      truth_claims: {
        Row: {
          claim_id: string
          consensus_aligned: boolean | null
          created_at: string
          details: Json
          reputation_weight: number
          resolved_at: string | null
          reward_amount: number
          scan_id: string
          sku_id: string
          user_id: string
          verdict: Database["public"]["Enums"]["truth_verdict"]
        }
        Insert: {
          claim_id?: string
          consensus_aligned?: boolean | null
          created_at?: string
          details?: Json
          reputation_weight?: number
          resolved_at?: string | null
          reward_amount?: number
          scan_id: string
          sku_id: string
          user_id: string
          verdict: Database["public"]["Enums"]["truth_verdict"]
        }
        Update: {
          claim_id?: string
          consensus_aligned?: boolean | null
          created_at?: string
          details?: Json
          reputation_weight?: number
          resolved_at?: string | null
          reward_amount?: number
          scan_id?: string
          sku_id?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["truth_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "truth_claims_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truth_claims_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "sku_analytics_summary"
            referencedColumns: ["sku_id"]
          },
          {
            foreignKeyName: "truth_claims_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["sku_id"]
          },
          {
            foreignKeyName: "truth_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string
          commission_rate: number | null
          converted_at: string | null
          created_at: string | null
          id: string
          last_earning_at: string | null
          paid_earnings: number | null
          pending_earnings: number | null
          referred_id: string | null
          referrer_id: string | null
          status: string | null
          total_earnings: number | null
        }
        Insert: {
          code: string
          commission_rate?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          last_earning_at?: string | null
          paid_earnings?: number | null
          pending_earnings?: number | null
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
          total_earnings?: number | null
        }
        Update: {
          code?: string
          commission_rate?: number | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          last_earning_at?: string | null
          paid_earnings?: number | null
          pending_earnings?: number | null
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
          total_earnings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      redirect_rules: {
        Row: {
          a_b_variant: string | null
          a_b_weight: number | null
          configuration: Json | null
          created_at: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          qron_id: string | null
          rule_type: string
          start_time: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          a_b_variant?: string | null
          a_b_weight?: number | null
          configuration?: Json | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          qron_id?: string | null
          rule_type: string
          start_time?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          a_b_variant?: string | null
          a_b_weight?: number | null
          configuration?: Json | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          qron_id?: string | null
          rule_type?: string
          start_time?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redirect_rules_qron_id_fkey"
            columns: ["qron_id"]
            isOneToOne: false
            referencedRelation: "qrons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redirect_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      sku_analytics_summary: {
        Row: {
          authentic_claims: number | null
          avg_reward: number | null
          brand_id: string | null
          canonical_sku: string | null
          category: Database["public"]["Enums"]["sku_category"] | null
          consensus_claims: number | null
          fake_claims: number | null
          historical_confidence_score: number | null
          historical_counterfeit_count: number | null
          historical_incident_count: number | null
          last_claim_at: string | null
          last_scan_at: string | null
          sku_id: string | null
          suspicious_claims: number | null
          total_claims: number | null
          total_scans: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skus_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_generation_limit: { Args: { user_uuid: string }; Returns: boolean }
      decrement_credit: { Args: { row_id: string }; Returns: undefined }
      generate_short_code: { Args: never; Returns: string }
      get_user_reward_total_today: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_scan_count_today: {
        Args: { p_user_id: string }
        Returns: number
      }
      increment_generation_count: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      is_first_flag_in_region: {
        Args: {
          p_geo: string
          p_sku_id: string
          p_verdict: Database["public"]["Enums"]["truth_verdict"]
        }
        Returns: boolean
      }
      refresh_sku_analytics_summary: { Args: never; Returns: undefined }
      send_conversion_email: { Args: never; Returns: string }
      send_winback_email: { Args: never; Returns: string }
    }
    Enums: {
      historical_fact_type:
        | "seizure"
        | "recall"
        | "chargeback_spike"
        | "auction_rejection"
        | "marketplace_flag"
        | "regulatory_action"
      sku_category:
        | "luxury_fashion"
        | "pharma"
        | "electronics"
        | "automotive"
        | "food_bev"
        | "other"
      truth_verdict: "authentic" | "suspicious" | "fake"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      historical_fact_type: [
        "seizure",
        "recall",
        "chargeback_spike",
        "auction_rejection",
        "marketplace_flag",
        "regulatory_action",
      ],
      sku_category: [
        "luxury_fashion",
        "pharma",
        "electronics",
        "automotive",
        "food_bev",
        "other",
      ],
      truth_verdict: ["authentic", "suspicious", "fake"],
    },
  },
} as const
