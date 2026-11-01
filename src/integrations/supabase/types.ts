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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          agent_accepted_terms_at: string | null
          agent_id: string
          created_at: string
          id: string
          property_id: string
          status: string
        }
        Insert: {
          agent_accepted_terms_at?: string | null
          agent_id: string
          created_at?: string
          id?: string
          property_id: string
          status?: string
        }
        Update: {
          agent_accepted_terms_at?: string | null
          agent_id?: string
          created_at?: string
          id?: string
          property_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      app_terms: {
        Row: {
          body: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          id: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      authorizations: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          notifications_enabled: boolean
          owner_accepted_terms_at: string | null
          property_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          owner_accepted_terms_at?: string | null
          property_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          owner_accepted_terms_at?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorizations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_directory: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_demo: boolean
          phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_demo?: boolean
          phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_demo?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          paid_at: string | null
          reference_month: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          reference_month: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          reference_month?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          address: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          city: string | null
          company_name: string | null
          created_at: string
          creci: string | null
          creci_status: Database["public"]["Enums"]["creci_status"]
          creci_uf: string | null
          document: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          pix_key: string | null
          subscription_until: string | null
          whatsapp: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          address?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          creci?: string | null
          creci_status?: Database["public"]["Enums"]["creci_status"]
          creci_uf?: string | null
          document?: string | null
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          pix_key?: string | null
          subscription_until?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          address?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          creci?: string | null
          creci_status?: Database["public"]["Enums"]["creci_status"]
          creci_uf?: string | null
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          pix_key?: string | null
          subscription_until?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[]
          base_price: number
          bathrooms: number
          bedrooms: number
          city: string | null
          created_at: string
          description: string | null
          garage_spaces: number
          guests: number
          id: string
          owner_id: string
          photos: string[]
          segment: string
          suites: number
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          city?: string | null
          created_at?: string
          description?: string | null
          garage_spaces?: number
          guests?: number
          id?: string
          owner_id: string
          photos?: string[]
          segment?: string
          suites?: number
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[]
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          city?: string | null
          created_at?: string
          description?: string | null
          garage_spaces?: number
          guests?: number
          id?: string
          owner_id?: string
          photos?: string[]
          segment?: string
          suites?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_days: {
        Row: {
          blocked: boolean
          day: string
          note: string | null
          price: number | null
          property_id: string
          updated_at: string
        }
        Insert: {
          blocked?: boolean
          day: string
          note?: string | null
          price?: number | null
          property_id: string
          updated_at?: string
        }
        Update: {
          blocked?: boolean
          day?: string
          note?: string | null
          price?: number | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_days_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_notifications: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          property_id: string
          read_at: string | null
          recipient_id: string
          status: string
          update_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          property_id: string
          read_at?: string | null
          recipient_id: string
          status?: string
          update_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          property_id?: string
          read_at?: string | null
          recipient_id?: string
          status?: string
          update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_notifications_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "property_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      property_updates: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          kind: string
          new_values: Json
          observed_ip: unknown
          old_values: Json
          owner_id: string
          property_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          kind: string
          new_values: Json
          observed_ip?: unknown
          old_values: Json
          owner_id: string
          property_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          kind?: string
          new_values?: Json
          observed_ip?: unknown
          old_values?: Json
          owner_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_updates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      agent_can_see_cover: {
        Args: { _name: string; _uid: string }
        Returns: boolean
      }
      agent_connected_to_owner: {
        Args: { _agent: string; _owner: string }
        Returns: boolean
      }
      agent_has_access: {
        Args: { _pid: string; _uid: string }
        Returns: boolean
      }
      agent_network_properties: {
        Args: never
        Returns: {
          bedrooms: number
          city: string
          cover: string
          guests: number
          has_access: boolean
          id: string
          owner_id: string
          request_status: string
          title: string
        }[]
      }
      agent_network_properties_segmented: {
        Args: never
        Returns: {
          bedrooms: number
          city: string
          cover: string
          guests: number
          has_access: boolean
          id: string
          owner_id: string
          request_status: string
          segment: string
          title: string
        }[]
      }
      agent_owner_contacts: {
        Args: never
        Returns: {
          city: string
          email: string
          full_name: string
          id: string
          phone: string
          whatsapp: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_agent: { Args: { _user_id: string }; Returns: boolean }
      list_approved_agents: {
        Args: never
        Returns: {
          account_type: Database["public"]["Enums"]["account_type"]
          city: string
          company_name: string
          creci: string
          creci_uf: string
          email: string
          full_name: string
          id: string
          phone: string
        }[]
      }
      mark_property_notification_read: {
        Args: { _id: string }
        Returns: undefined
      }
      owns_property: { Args: { _pid: string; _uid: string }; Returns: boolean }
      property_owner: { Args: { _pid: string }; Returns: string }
      save_property_change: {
        Args: {
          _actor: string
          _days?: Json
          _ip: unknown
          _patch: Json
          _property_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "owner" | "broker" | "agency"
      app_role: "admin" | "owner" | "broker" | "agency"
      creci_status: "not_required" | "pending" | "approved" | "rejected"
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
      account_type: ["owner", "broker", "agency"],
      app_role: ["admin", "owner", "broker", "agency"],
      creci_status: ["not_required", "pending", "approved", "rejected"],
    },
  },
} as const
