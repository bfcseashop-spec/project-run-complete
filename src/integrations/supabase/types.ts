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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_roles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          detail: string
          id: string
          refund_id: string
          timestamp: string
        }
        Insert: {
          action?: string
          created_at?: string
          detail?: string
          id: string
          refund_id?: string
          timestamp?: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string
          id?: string
          refund_id?: string
          timestamp?: string
        }
        Relationships: []
      }
      billing_records: {
        Row: {
          amount: number
          created_at: string
          date: string
          discount: number
          due: number
          form_data: Json | null
          id: string
          method: string
          paid: number
          patient: string
          service: string
          status: string
          tax: number
          total: number
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          discount?: number
          due?: number
          form_data?: Json | null
          id: string
          method?: string
          paid?: number
          patient?: string
          service?: string
          status?: string
          tax?: number
          total?: number
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          discount?: number
          due?: number
          form_data?: Json | null
          id?: string
          method?: string
          paid?: number
          patient?: string
          service?: string
          status?: string
          tax?: number
          total?: number
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          investment_name: string
          investor_id: string
          note: string
          slip_count: number
          slip_images: Json
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id: string
          investment_name?: string
          investor_id?: string
          note?: string
          slip_count?: number
          slip_images?: Json
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          investment_name?: string
          investor_id?: string
          note?: string
          slip_count?: number
          slip_images?: Json
        }
        Relationships: []
      }
      doctors: {
        Row: {
          address: string
          bio: string
          consultation_fee: number
          created_at: string
          email: string
          experience: number
          id: string
          join_date: string
          name: string
          patients: number
          phone: string
          photo: string
          qualification: string
          schedule: Json
          specialty: string
          status: string
        }
        Insert: {
          address?: string
          bio?: string
          consultation_fee?: number
          created_at?: string
          email?: string
          experience?: number
          id: string
          join_date?: string
          name?: string
          patients?: number
          phone?: string
          photo?: string
          qualification?: string
          schedule?: Json
          specialty?: string
          status?: string
        }
        Update: {
          address?: string
          bio?: string
          consultation_fee?: number
          created_at?: string
          email?: string
          experience?: number
          id?: string
          join_date?: string
          name?: string
          patients?: number
          phone?: string
          photo?: string
          qualification?: string
          schedule?: Json
          specialty?: string
          status?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          created_at: string
          date: string
          doctor: string
          form_data: Json
          id: string
          item_count: number
          patient: string
          saved_at: string
          total: number
        }
        Insert: {
          created_at?: string
          date?: string
          doctor?: string
          form_data?: Json
          id: string
          item_count?: number
          patient?: string
          saved_at?: string
          total?: number
        }
        Update: {
          created_at?: string
          date?: string
          doctor?: string
          form_data?: Json
          id?: string
          item_count?: number
          patient?: string
          saved_at?: string
          total?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          notes: string
          paid_to: string
          payment_method: string
          receipt: string
          status: string
          title: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id: string
          notes?: string
          paid_to?: string
          payment_method?: string
          receipt?: string
          status?: string
          title?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string
          paid_to?: string
          payment_method?: string
          receipt?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      injections: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          price: number
          route: string
          status: string
          stock: number
          strength: string
          unit: string
        }
        Insert: {
          category?: string
          created_at?: string
          id: string
          name?: string
          price?: number
          route?: string
          status?: string
          stock?: number
          strength?: string
          unit?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          route?: string
          status?: string
          stock?: number
          strength?: string
          unit?: string
        }
        Relationships: []
      }
      investment_settings: {
        Row: {
          key: string
          value: number
        }
        Insert: {
          key: string
          value?: number
        }
        Update: {
          key?: string
          value?: number
        }
        Relationships: []
      }
      investors: {
        Row: {
          capital_amount: number
          color: string
          created_at: string
          id: string
          investment_name: string
          name: string
          paid: number
          share_percent: number
        }
        Insert: {
          capital_amount?: number
          color?: string
          created_at?: string
          id: string
          investment_name?: string
          name?: string
          paid?: number
          share_percent?: number
        }
        Update: {
          capital_amount?: number
          color?: string
          created_at?: string
          id?: string
          investment_name?: string
          name?: string
          paid?: number
          share_percent?: number
        }
        Relationships: []
      }
      lab_reports: {
        Row: {
          age: number
          category: string
          collected_at: string
          created_at: string
          date: string
          doctor: string
          expected_tat: string | null
          gender: string
          id: string
          instrument: string
          normal_range: string
          pathologist: string
          patient: string
          patient_id: string
          remarks: string
          reported_at: string
          result: string
          result_date: string
          sample_type: string
          sections: Json
          status: string
          technician: string
          test_name: string
        }
        Insert: {
          age?: number
          category?: string
          collected_at?: string
          created_at?: string
          date?: string
          doctor?: string
          expected_tat?: string | null
          gender?: string
          id: string
          instrument?: string
          normal_range?: string
          pathologist?: string
          patient?: string
          patient_id?: string
          remarks?: string
          reported_at?: string
          result?: string
          result_date?: string
          sample_type?: string
          sections?: Json
          status?: string
          technician?: string
          test_name?: string
        }
        Update: {
          age?: number
          category?: string
          collected_at?: string
          created_at?: string
          date?: string
          doctor?: string
          expected_tat?: string | null
          gender?: string
          id?: string
          instrument?: string
          normal_range?: string
          pathologist?: string
          patient?: string
          patient_id?: string
          remarks?: string
          reported_at?: string
          result?: string
          result_date?: string
          sample_type?: string
          sections?: Json
          status?: string
          technician?: string
          test_name?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          batch_no: string
          box_no: string
          category: string
          created_at: string
          expiry: string
          id: string
          image: string
          manufacturer: string
          name: string
          price: number
          purchase_price: number
          sold_out: number
          status: string
          stock: number
          stock_alert: number
          unit: string
        }
        Insert: {
          batch_no?: string
          box_no?: string
          category?: string
          created_at?: string
          expiry?: string
          id?: string
          image?: string
          manufacturer?: string
          name: string
          price?: number
          purchase_price?: number
          sold_out?: number
          status?: string
          stock?: number
          stock_alert?: number
          unit?: string
        }
        Update: {
          batch_no?: string
          box_no?: string
          category?: string
          created_at?: string
          expiry?: string
          id?: string
          image?: string
          manufacturer?: string
          name?: string
          price?: number
          purchase_price?: number
          sold_out?: number
          status?: string
          stock?: number
          stock_alert?: number
          unit?: string
        }
        Relationships: []
      }
      opd_patients: {
        Row: {
          age: number
          blood_type: string | null
          complaint: string
          created_at: string
          doctor: string
          gender: string
          id: string
          medical_history: string | null
          name: string
          patient_type: string | null
          phone: string | null
          photo: string | null
          status: string
          time: string
        }
        Insert: {
          age?: number
          blood_type?: string | null
          complaint?: string
          created_at?: string
          doctor?: string
          gender?: string
          id: string
          medical_history?: string | null
          name?: string
          patient_type?: string | null
          phone?: string | null
          photo?: string | null
          status?: string
          time?: string
        }
        Update: {
          age?: number
          blood_type?: string | null
          complaint?: string
          created_at?: string
          doctor?: string
          gender?: string
          id?: string
          medical_history?: string | null
          name?: string
          patient_type?: string | null
          phone?: string | null
          photo?: string | null
          status?: string
          time?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          created_at: string
          email: string
          full_name: string
          id: string
          last_login: string | null
          role_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          last_login?: string | null
          role_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          created_at: string
          date: string
          id: string
          invoice_id: string
          items: Json
          method: string
          patient: string
          processed_by: string
          reason: string
          status: string
          total_refund: number
        }
        Insert: {
          created_at?: string
          date?: string
          id: string
          invoice_id?: string
          items?: Json
          method?: string
          patient?: string
          processed_by?: string
          reason?: string
          status?: string
          total_refund?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string
          items?: Json
          method?: string
          patient?: string
          processed_by?: string
          reason?: string
          status?: string
          total_refund?: number
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          id: string
          module: string
          role_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          id?: string
          module: string
          role_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          id?: string
          module?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_records: {
        Row: {
          age: number
          barcode: string
          collected_by: string
          collection_date: string
          collection_time: string
          created_at: string
          doctor: string
          gender: string
          id: string
          notes: string
          patient: string
          patient_id: string
          priority: string
          rejection_reason: string
          sample_type: string
          status: string
          storage_temp: string
          test_name: string
        }
        Insert: {
          age?: number
          barcode?: string
          collected_by?: string
          collection_date?: string
          collection_time?: string
          created_at?: string
          doctor?: string
          gender?: string
          id: string
          notes?: string
          patient?: string
          patient_id?: string
          priority?: string
          rejection_reason?: string
          sample_type?: string
          status?: string
          storage_temp?: string
          test_name?: string
        }
        Update: {
          age?: number
          barcode?: string
          collected_by?: string
          collection_date?: string
          collection_time?: string
          created_at?: string
          doctor?: string
          gender?: string
          id?: string
          notes?: string
          patient?: string
          patient_id?: string
          priority?: string
          rejection_reason?: string
          sample_type?: string
          status?: string
          storage_temp?: string
          test_name?: string
        }
        Relationships: []
      }
      test_categories: {
        Row: {
          created_at: string
          name: string
        }
        Insert: {
          created_at?: string
          name: string
        }
        Update: {
          created_at?: string
          name?: string
        }
        Relationships: []
      }
      test_names: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          name: string
          normal_range: string
          price: number
          sample_type: string
          unit: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id: string
          name?: string
          normal_range?: string
          price?: number
          sample_type?: string
          unit?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          name?: string
          normal_range?: string
          price?: number
          sample_type?: string
          unit?: string
        }
        Relationships: []
      }
      test_sample_types: {
        Row: {
          created_at: string
          name: string
        }
        Insert: {
          created_at?: string
          name: string
        }
        Update: {
          created_at?: string
          name?: string
        }
        Relationships: []
      }
      ultrasound_records: {
        Row: {
          created_at: string
          date: string
          doctor: string
          examination: string
          findings: string
          id: string
          images: Json
          impression: string
          patient: string
          region: string
          remarks: string
          report_date: string
          status: string
        }
        Insert: {
          created_at?: string
          date?: string
          doctor?: string
          examination?: string
          findings?: string
          id: string
          images?: Json
          impression?: string
          patient?: string
          region?: string
          remarks?: string
          report_date?: string
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor?: string
          examination?: string
          findings?: string
          id?: string
          images?: Json
          impression?: string
          patient?: string
          region?: string
          remarks?: string
          report_date?: string
          status?: string
        }
        Relationships: []
      }
      xray_records: {
        Row: {
          body_part: string
          created_at: string
          date: string
          doctor: string
          examination: string
          findings: string
          id: string
          images: Json
          impression: string
          patient: string
          remarks: string
          report_date: string
          status: string
        }
        Insert: {
          body_part?: string
          created_at?: string
          date?: string
          doctor?: string
          examination?: string
          findings?: string
          id: string
          images?: Json
          impression?: string
          patient?: string
          remarks?: string
          report_date?: string
          status?: string
        }
        Update: {
          body_part?: string
          created_at?: string
          date?: string
          doctor?: string
          examination?: string
          findings?: string
          id?: string
          images?: Json
          impression?: string
          patient?: string
          remarks?: string
          report_date?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role_name: { Args: { p_user_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
