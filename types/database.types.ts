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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          description: string
          diff: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          description: string
          diff?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          description?: string
          diff?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
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
      chart_of_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      customer_invoices: {
        Row: {
          account_id: string
          created_at: string
          created_by: string | null
          due_at: string | null
          folio: string | null
          id: string
          issued_at: string
          iva_amount: number | null
          iva_rate: number
          notes: string | null
          pdf_path: string | null
          project_id: string
          serie: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number | null
          updated_at: string
          uuid_fiscal: string | null
          xml_path: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          folio?: string | null
          id?: string
          issued_at?: string
          iva_amount?: number | null
          iva_rate?: number
          notes?: string | null
          pdf_path?: string | null
          project_id: string
          serie?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total?: number | null
          updated_at?: string
          uuid_fiscal?: string | null
          xml_path?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          folio?: string | null
          id?: string
          issued_at?: string
          iva_amount?: number | null
          iva_rate?: number
          notes?: string | null
          pdf_path?: string | null
          project_id?: string
          serie?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number | null
          updated_at?: string
          uuid_fiscal?: string | null
          xml_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_payments: {
        Row: {
          account_id: string
          amount: number
          bank_account: string | null
          bank_reference: string | null
          complement_pdf_path: string | null
          complement_xml_path: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          paid_at: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          receipt_path: string | null
          reconciliation_status: Database["public"]["Enums"]["reconciliation_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          bank_account?: string | null
          bank_reference?: string | null
          complement_pdf_path?: string | null
          complement_xml_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          receipt_path?: string | null
          reconciliation_status?: Database["public"]["Enums"]["reconciliation_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          bank_account?: string | null
          bank_reference?: string | null
          complement_pdf_path?: string | null
          complement_xml_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string
          receipt_path?: string | null
          reconciliation_status?: Database["public"]["Enums"]["reconciliation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          complement_pdf_path: string | null
          complement_xml_path: string | null
          created_at: string
          deal_id: string
          due_date: string | null
          id: string
          interest_amount: number | null
          invoice_id: string | null
          label: string
          paid_at: string | null
          percentage: number | null
          principal_amount: number | null
          project_id: string | null
          status: Database["public"]["Enums"]["installment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          complement_pdf_path?: string | null
          complement_xml_path?: string | null
          created_at?: string
          deal_id: string
          due_date?: string | null
          id?: string
          interest_amount?: number | null
          invoice_id?: string | null
          label: string
          paid_at?: string | null
          percentage?: number | null
          principal_amount?: number | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          complement_pdf_path?: string | null
          complement_xml_path?: string | null
          created_at?: string
          deal_id?: string
          due_date?: string | null
          id?: string
          interest_amount?: number | null
          invoice_id?: string | null
          label?: string
          paid_at?: string | null
          percentage?: number | null
          principal_amount?: number | null
          project_id?: string | null
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
          {
            foreignKeyName: "deal_payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_payment_installments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          financed_total: number | null
          financing_term_months: number | null
          id: string
          interest_rate: number | null
          is_financed: boolean
          is_msi: boolean
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
          financed_total?: number | null
          financing_term_months?: number | null
          id?: string
          interest_rate?: number | null
          is_financed?: boolean
          is_msi?: boolean
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
          financed_total?: number | null
          financing_term_months?: number | null
          id?: string
          interest_rate?: number | null
          is_financed?: boolean
          is_msi?: boolean
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
      employees: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          monthly_salary: number
          payroll_day: number
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id?: string
          monthly_salary: number
          payroll_day?: number
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          monthly_salary?: number
          payroll_day?: number
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["expense_category_kind"]
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["expense_category_kind"]
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["expense_category_kind"]
          name?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          bucket: string
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          id: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          bucket: string
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          id?: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_cost_periods: {
        Row: {
          amount: number
          conciliation_status: Database["public"]["Enums"]["cost_conciliation_status"]
          created_at: string
          fixed_cost_id: string
          id: string
          journal_entry_id: string | null
          notes: string | null
          period: string
          updated_at: string
          vendor_invoice_pdf_path: string | null
          vendor_invoice_ref: string | null
          vendor_invoice_xml_path: string | null
        }
        Insert: {
          amount: number
          conciliation_status?: Database["public"]["Enums"]["cost_conciliation_status"]
          created_at?: string
          fixed_cost_id: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period: string
          updated_at?: string
          vendor_invoice_pdf_path?: string | null
          vendor_invoice_ref?: string | null
          vendor_invoice_xml_path?: string | null
        }
        Update: {
          amount?: number
          conciliation_status?: Database["public"]["Enums"]["cost_conciliation_status"]
          created_at?: string
          fixed_cost_id?: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period?: string
          updated_at?: string
          vendor_invoice_pdf_path?: string | null
          vendor_invoice_ref?: string | null
          vendor_invoice_xml_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_cost_periods_fixed_cost_id_fkey"
            columns: ["fixed_cost_id"]
            isOneToOne: false
            referencedRelation: "fixed_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_cost_periods_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_costs: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          effective_date: string
          end_date: string | null
          frequency: Database["public"]["Enums"]["cost_frequency"]
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          effective_date?: string
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["cost_frequency"]
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          effective_date?: string
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["cost_frequency"]
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_costs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          freelancer_name: string
          id: string
          invoice_date: string
          notes: string | null
          paid_at: string | null
          project_id: string
          status: Database["public"]["Enums"]["freelancer_invoice_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          freelancer_name: string
          id?: string
          invoice_date?: string
          notes?: string | null
          paid_at?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["freelancer_invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          freelancer_name?: string
          id?: string
          invoice_date?: string
          notes?: string | null
          paid_at?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["freelancer_invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas_phases: {
        Row: {
          code: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          order_index: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      invoice_payments: {
        Row: {
          amount_applied: number
          created_at: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          amount_applied: number
          created_at?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          amount_applied?: number
          created_at?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "customer_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          id: string
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          label: string | null
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          label?: string | null
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          label?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_support_subscriptions: {
        Row: {
          account_id: string
          amount: number
          billing_cycle: Database["public"]["Enums"]["support_billing_cycle"]
          billing_day: number
          created_at: string
          direct_cost: number
          end_date: string | null
          id: string
          payment_method: Database["public"]["Enums"]["support_payment_method"]
          project_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          term: Database["public"]["Enums"]["support_term"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          billing_cycle?: Database["public"]["Enums"]["support_billing_cycle"]
          billing_day: number
          created_at?: string
          direct_cost?: number
          end_date?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["support_payment_method"]
          project_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          term?: Database["public"]["Enums"]["support_term"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          billing_cycle?: Database["public"]["Enums"]["support_billing_cycle"]
          billing_day?: number
          created_at?: string
          direct_cost?: number
          end_date?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["support_payment_method"]
          project_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          term?: Database["public"]["Enums"]["support_term"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_support_subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_support_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_accruals: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          journal_entry_id: string | null
          period: string
        }
        Insert: {
          amount: number
          created_at?: string
          employee_id: string
          id?: string
          journal_entry_id?: string | null
          period: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          journal_entry_id?: string | null
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_accruals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_accruals_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
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
      project_cost_installments: {
        Row: {
          amount: number
          collection_installment_id: string | null
          created_at: string
          deal_id: string
          due_date: string | null
          employee_id: string | null
          freelancer_invoice_id: string | null
          id: string
          label: string
          notes: string | null
          paid_at: string | null
          payee_type: string
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          collection_installment_id?: string | null
          created_at?: string
          deal_id: string
          due_date?: string | null
          employee_id?: string | null
          freelancer_invoice_id?: string | null
          id?: string
          label: string
          notes?: string | null
          paid_at?: string | null
          payee_type?: string
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          collection_installment_id?: string | null
          created_at?: string
          deal_id?: string
          due_date?: string | null
          employee_id?: string | null
          freelancer_invoice_id?: string | null
          id?: string
          label?: string
          notes?: string | null
          paid_at?: string | null
          payee_type?: string
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_cost_installments_collection_installment_id_fkey"
            columns: ["collection_installment_id"]
            isOneToOne: false
            referencedRelation: "deal_payment_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cost_installments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal_financials_view"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "project_cost_installments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cost_installments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cost_installments_freelancer_invoice_id_fkey"
            columns: ["freelancer_invoice_id"]
            isOneToOne: false
            referencedRelation: "freelancer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cost_installments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_decisions: {
        Row: {
          created_at: string
          decided_at: string
          decided_by: string | null
          description: string | null
          id: string
          impact: Database["public"]["Enums"]["decision_impact"]
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          description?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["decision_impact"]
          project_id: string
          title: string
        }
        Update: {
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          description?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["decision_impact"]
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_financials: {
        Row: {
          budget_sold: number
          cost_payment_type: string | null
          created_at: string
          credit_start_date: string | null
          direct_cost: number
          down_payment: number | null
          financed_total: number | null
          financing_term_months: number | null
          interest_rate_annual: number | null
          is_financed: boolean
          iva_rate: number
          payment_type: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          budget_sold?: number
          cost_payment_type?: string | null
          created_at?: string
          credit_start_date?: string | null
          direct_cost?: number
          down_payment?: number | null
          financed_total?: number | null
          financing_term_months?: number | null
          interest_rate_annual?: number | null
          is_financed?: boolean
          iva_rate?: number
          payment_type?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          budget_sold?: number
          cost_payment_type?: string | null
          created_at?: string
          credit_start_date?: string | null
          direct_cost?: number
          down_payment?: number | null
          financed_total?: number | null
          financing_term_months?: number | null
          interest_rate_annual?: number | null
          is_financed?: boolean
          iva_rate?: number
          payment_type?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_financials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ideas_phases: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          objectives: string | null
          owner_id: string | null
          phase_id: string
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          objectives?: string | null
          owner_id?: string | null
          phase_id: string
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          objectives?: string | null
          owner_id?: string | null
          phase_id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_ideas_phases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ideas_phases_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "ideas_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ideas_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role_in_project: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role_in_project?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role_in_project?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_risks: {
        Row: {
          created_at: string
          description: string
          id: string
          impact: Database["public"]["Enums"]["risk_level"]
          mitigation: string | null
          owner_id: string | null
          probability: Database["public"]["Enums"]["risk_level"]
          project_id: string
          status: Database["public"]["Enums"]["risk_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          impact?: Database["public"]["Enums"]["risk_level"]
          mitigation?: string | null
          owner_id?: string | null
          probability?: Database["public"]["Enums"]["risk_level"]
          project_id: string
          status?: Database["public"]["Enums"]["risk_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          impact?: Database["public"]["Enums"]["risk_level"]
          mitigation?: string | null
          owner_id?: string | null
          probability?: Database["public"]["Enums"]["risk_level"]
          project_id?: string
          status?: Database["public"]["Enums"]["risk_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_risks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_swot: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          project_id: string
          type: Database["public"]["Enums"]["swot_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          project_id: string
          type: Database["public"]["Enums"]["swot_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id?: string
          type?: Database["public"]["Enums"]["swot_type"]
        }
        Relationships: [
          {
            foreignKeyName: "project_swot_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_swot_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string
          business_line_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          deleted_at: string | null
          due_date: string | null
          id: string
          name: string
          progress_pct: number
          project_manager_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          business_line_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          name: string
          progress_pct?: number
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          business_line_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          name?: string
          progress_pct?: number
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_business_line_id_fkey"
            columns: ["business_line_id"]
            isOneToOne: false
            referencedRelation: "business_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deal_financials_view"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["revenue_kind"]
          notes: string | null
          payment_method: string | null
          project_id: string | null
          received_at: string
          related_installment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["revenue_kind"]
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          received_at?: string
          related_installment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["revenue_kind"]
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          received_at?: string
          related_installment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_related_installment_id_fkey"
            columns: ["related_installment_id"]
            isOneToOne: false
            referencedRelation: "deal_payment_installments"
            referencedColumns: ["id"]
          },
        ]
      }
      support_billing_records: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          paid_at: string | null
          period: string
          status: Database["public"]["Enums"]["support_billing_status"]
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          paid_at?: string | null
          period: string
          status?: Database["public"]["Enums"]["support_billing_status"]
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          period?: string
          status?: Database["public"]["Enums"]["support_billing_status"]
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_billing_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "monthly_support_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          task_id: string
          type: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          task_id: string
          type?: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          ideas_phase_instance_id: string | null
          parent_task_id: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          ideas_phase_instance_id?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          ideas_phase_instance_id?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_ideas_phase_instance_id_fkey"
            columns: ["ideas_phase_instance_id"]
            isOneToOne: false
            referencedRelation: "project_ideas_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_allocations: {
        Row: {
          allocation_pct: number | null
          created_at: string
          effective_from: string
          effective_to: string | null
          employee_id: string | null
          hours_per_month: number | null
          id: string
          notes: string | null
          profile_id: string
          project_id: string | null
          subscription_id: string | null
        }
        Insert: {
          allocation_pct?: number | null
          created_at?: string
          effective_from: string
          effective_to?: string | null
          employee_id?: string | null
          hours_per_month?: number | null
          id?: string
          notes?: string | null
          profile_id: string
          project_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          allocation_pct?: number | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          employee_id?: string | null
          hours_per_month?: number | null
          id?: string
          notes?: string | null
          profile_id?: string
          project_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_allocations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_allocations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "monthly_support_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      variable_expenses: {
        Row: {
          amount: number
          category_id: string | null
          conciliation_status: Database["public"]["Enums"]["cost_conciliation_status"]
          created_at: string
          description: string
          expense_date: string
          id: string
          project_id: string | null
          vendor_invoice_pdf_path: string | null
          vendor_invoice_ref: string | null
          vendor_invoice_xml_path: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          conciliation_status?: Database["public"]["Enums"]["cost_conciliation_status"]
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          project_id?: string | null
          vendor_invoice_pdf_path?: string | null
          vendor_invoice_ref?: string | null
          vendor_invoice_xml_path?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          conciliation_status?: Database["public"]["Enums"]["cost_conciliation_status"]
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          project_id?: string | null
          vendor_invoice_pdf_path?: string | null
          vendor_invoice_ref?: string | null
          vendor_invoice_xml_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variable_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variable_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      deal_financials_view: {
        Row: {
          cost_iva_amount: number | null
          cost_with_iva: number | null
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
      v_erp_financial_summary: {
        Row: {
          active_arr: number | null
          active_mrr: number | null
          active_support_margin: number | null
          current_month_financing_income: number | null
          current_month_revenue: number | null
          current_month_variable_expenses: number | null
          monthly_fixed_costs: number | null
        }
        Relationships: []
      }
      v_erp_monthly_trend: {
        Row: {
          month: string | null
          revenue: number | null
          variable_expenses: number | null
        }
        Relationships: []
      }
      v_pipeline_summary: {
        Row: {
          margin_potencial: number | null
          margin_real: number | null
          tcv_potencial: number | null
          tcv_real: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      convert_deal_to_project: { Args: { p_deal_id: string }; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_project_team_member: {
        Args: { p_project_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "lead" | "prospect" | "customer" | "inactive"
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      company_size: "micro" | "small" | "medium" | "large"
      cost_conciliation_status:
        | "sin_comprobante"
        | "con_comprobante"
        | "conciliado"
      cost_frequency: "monthly" | "annual" | "one_time"
      decision_impact: "low" | "medium" | "high"
      expense_category_kind: "fixed" | "variable"
      freelancer_invoice_status: "pending" | "paid"
      installment_status: "pending" | "invoiced" | "paid" | "partially_paid"
      invoice_status:
        | "borrador"
        | "emitida"
        | "parcialmente_pagada"
        | "pagada"
        | "cancelada"
        | "vencida"
      payment_method:
        | "transferencia"
        | "tarjeta"
        | "efectivo"
        | "cheque"
        | "otro"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      reconciliation_status:
        | "pendiente"
        | "conciliado"
        | "diferencia"
        | "rechazado"
      revenue_kind: "principal" | "interest"
      risk_level: "low" | "medium" | "high"
      risk_status: "open" | "mitigated" | "closed"
      subscription_status: "active" | "paused" | "cancelled"
      support_billing_cycle: "monthly" | "annual"
      support_billing_status: "pending" | "paid"
      support_payment_method: "stripe" | "transferencia"
      support_term: "6_months" | "1_year" | "3_years" | "indefinite"
      swot_type: "strength" | "weakness" | "opportunity" | "threat"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "in_review" | "done" | "blocked"
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
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      company_size: ["micro", "small", "medium", "large"],
      cost_conciliation_status: [
        "sin_comprobante",
        "con_comprobante",
        "conciliado",
      ],
      cost_frequency: ["monthly", "annual", "one_time"],
      decision_impact: ["low", "medium", "high"],
      expense_category_kind: ["fixed", "variable"],
      freelancer_invoice_status: ["pending", "paid"],
      installment_status: ["pending", "invoiced", "paid", "partially_paid"],
      invoice_status: [
        "borrador",
        "emitida",
        "parcialmente_pagada",
        "pagada",
        "cancelada",
        "vencida",
      ],
      payment_method: [
        "transferencia",
        "tarjeta",
        "efectivo",
        "cheque",
        "otro",
      ],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      reconciliation_status: [
        "pendiente",
        "conciliado",
        "diferencia",
        "rechazado",
      ],
      revenue_kind: ["principal", "interest"],
      risk_level: ["low", "medium", "high"],
      risk_status: ["open", "mitigated", "closed"],
      subscription_status: ["active", "paused", "cancelled"],
      support_billing_cycle: ["monthly", "annual"],
      support_billing_status: ["pending", "paid"],
      support_payment_method: ["stripe", "transferencia"],
      support_term: ["6_months", "1_year", "3_years", "indefinite"],
      swot_type: ["strength", "weakness", "opportunity", "threat"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "in_review", "done", "blocked"],
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
