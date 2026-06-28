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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          address: string | null
          company_size: Database["public"]["Enums"]["company_size"] | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          industry: string | null
          lead_source: string | null
          legal_name: string | null
          name: string
          notes: string | null
          owner_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["account_status"]
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_size?: Database["public"]["Enums"]["company_size"] | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          industry?: string | null
          lead_source?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_size?: Database["public"]["Enums"]["company_size"] | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          industry?: string | null
          lead_source?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_lines: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          job_title: string | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          preferences: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferences?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferences?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_financials: {
        Row: {
          created_at: string
          deal_id: string
          estimated_direct_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          estimated_direct_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          estimated_direct_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_financials_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deal_financials_view"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "deal_financials_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_payment_installments: {
        Row: {
          amount: number
          created_at: string
          deal_id: string
          due_date: string | null
          id: string
          label: string
          paid_at: string | null
          status: Database["public"]["Enums"]["installment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          deal_id: string
          due_date?: string | null
          id?: string
          label: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deal_id?: string
          due_date?: string | null
          id?: string
          label?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_payment_installments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal_financials_view"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "deal_payment_installments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string
          business_line_id: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deposit_percentage: number | null
          expected_close_date: string | null
          id: string
          iva_rate: number
          lost_reason: string | null
          monthly_support_amount: number | null
          name: string
          observations: string | null
          owner_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          price: number
          primary_contact_id: string | null
          probability: number | null
          stage_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          business_line_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deposit_percentage?: number | null
          expected_close_date?: string | null
          id?: string
          iva_rate?: number
          lost_reason?: string | null
          monthly_support_amount?: number | null
          name: string
          observations?: string | null
          owner_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          price: number
          primary_contact_id?: string | null
          probability?: number | null
          stage_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          business_line_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deposit_percentage?: number | null
          expected_close_date?: string | null
          id?: string
          iva_rate?: number
          lost_reason?: string | null
          monthly_support_amount?: number | null
          name?: string
          observations?: string | null
          owner_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          price?: number
          primary_contact_id?: string | null
          probability?: number | null
          stage_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_business_line_id_fkey"
            columns: ["business_line_id"]
            isOneToOne: false
            referencedRelation: "business_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "v_deals_by_stage"
            referencedColumns: ["stage_id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_lost: boolean
          is_won: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name: string
          order_index: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      deal_financials_view: {
        Row: {
          deal_id: string | null
          estimated_direct_cost: number | null
          estimated_profit: number | null
          gross_margin: number | null
          iva_amount: number | null
          iva_rate: number | null
          margin_pct: number | null
          price: number | null
          total_with_iva: number | null
        }
        Relationships: []
      }
      v_crm_dashboard: {
        Row: {
          deals_won_this_month: number | null
          open_deals_count: number | null
          pipeline_value: number | null
          revenue_won_this_month: number | null
          total_accounts: number | null
        }
        Relationships: []
      }
      v_deals_by_stage: {
        Row: {
          color: string | null
          deal_count: number | null
          is_lost: boolean | null
          is_won: boolean | null
          order_index: number | null
          stage_id: string | null
          stage_name: string | null
          total_value: number | null
        }
        Relationships: []
      }
      v_deals_won_lost_monthly: {
        Row: {
          lost_count: number | null
          month: string | null
          won_count: number | null
          won_value: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      account_status: "lead" | "prospect" | "customer" | "inactive"
      company_size: "micro" | "small" | "medium" | "large"
      installment_status: "pending" | "invoiced" | "paid"
      payment_method:
        | "transferencia"
        | "tarjeta"
        | "efectivo"
        | "cheque"
        | "otro"
      user_role:
        | "founder"
        | "partner"
        | "project_manager"
        | "sales"
        | "operations"
        | "finance"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["lead", "prospect", "customer", "inactive"],
      company_size: ["micro", "small", "medium", "large"],
      installment_status: ["pending", "invoiced", "paid"],
      payment_method: [
        "transferencia",
        "tarjeta",
        "efectivo",
        "cheque",
        "otro",
      ],
      user_role: [
        "founder",
        "partner",
        "project_manager",
        "sales",
        "operations",
        "finance",
      ],
    },
  },
} as const
