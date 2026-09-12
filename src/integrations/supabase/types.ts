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
  public: {
    Tables: {
      community_posts: {
        Row: {
          body: string
          created_at: string
          id: string
          image_path: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_path?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diet_plan_meals: {
        Row: {
          created_at: string
          id: string
          items: string[]
          kcal_estimate: number | null
          name: string
          plan_id: string
          position: number
          time_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: string[]
          kcal_estimate?: number | null
          name: string
          plan_id: string
          position: number
          time_label?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: string[]
          kcal_estimate?: number | null
          name?: string
          plan_id?: string
          position?: number
          time_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plan_meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          preferences: Json
          source: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          preferences?: Json
          source: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          preferences?: Json
          source?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_connections: {
        Row: {
          created_at: string
          device_name: string | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          permissions: string[]
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          permissions?: string[]
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          permissions?: string[]
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_samples: {
        Row: {
          connection_id: string | null
          created_at: string
          end_at: string | null
          external_id: string
          id: string
          measured_at: string
          metadata: Json
          metric_type: string
          source_device: string | null
          source_name: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          end_at?: string | null
          external_id: string
          id?: string
          measured_at: string
          metadata?: Json
          metric_type: string
          source_device?: string | null
          source_name: string
          unit: string
          user_id: string
          value: number
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          end_at?: string | null
          external_id?: string
          id?: string
          measured_at?: string
          metadata?: Json
          metric_type?: string
          source_device?: string | null
          source_name?: string
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_samples_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "health_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          day: string
          done: boolean
          id: string
          items: string[]
          kcal: number
          kcal_estimated: boolean
          name: string
          note: string | null
          origin: string
          plan_id: string | null
          time_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          done?: boolean
          id?: string
          items?: string[]
          kcal?: number
          kcal_estimated?: boolean
          name: string
          note?: string | null
          origin?: string
          plan_id?: string | null
          time_label?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          done?: boolean
          id?: string
          items?: string[]
          kcal?: number
          kcal_estimated?: boolean
          name?: string
          note?: string | null
          origin?: string
          plan_id?: string | null
          time_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          day: string
          detail: string
          done: boolean
          id: string
          pillar: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          detail?: string
          done?: boolean
          id?: string
          pillar?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          detail?: string
          done?: boolean
          id?: string
          pillar?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          birth_date: string | null
          created_at: string
          diet_goal: string | null
          display_name: string
          food_preferences: string | null
          food_restrictions: string | null
          foods_avoid: string | null
          foods_include: string | null
          height_cm: number | null
          id: string
          meal_goal: number
          metabolic_sex: string | null
          preferred_start_time: string | null
          prep_time: string | null
          step_goal: number
          timezone: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          birth_date?: string | null
          created_at?: string
          diet_goal?: string | null
          display_name?: string
          food_preferences?: string | null
          food_restrictions?: string | null
          foods_avoid?: string | null
          foods_include?: string | null
          height_cm?: number | null
          id: string
          meal_goal?: number
          metabolic_sex?: string | null
          preferred_start_time?: string | null
          prep_time?: string | null
          step_goal?: number
          timezone?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          birth_date?: string | null
          created_at?: string
          diet_goal?: string | null
          display_name?: string
          food_preferences?: string | null
          food_restrictions?: string | null
          foods_avoid?: string | null
          foods_include?: string | null
          height_cm?: number | null
          id?: string
          meal_goal?: number
          metabolic_sex?: string | null
          preferred_start_time?: string | null
          prep_time?: string | null
          step_goal?: number
          timezone?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      protocol_progress: {
        Row: {
          completed_at: string
          day_number: number
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_number: number
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          created_at: string
          day: string
          hours: number
          id: string
          quality: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          hours: number
          id?: string
          quality?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          hours?: number
          id?: string
          quality?: number
          user_id?: string
        }
        Relationships: []
      }
      step_logs: {
        Row: {
          created_at: string
          day: string
          id: string
          steps: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          steps?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          steps?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_diet_plan: {
        Args: {
          _day: string
          _meals: Json
          _name: string
          _preferences: Json
          _source: string
          _summary: string
        }
        Returns: string
      }
      community_ranking: {
        Args: never
        Returns: {
          display_name: string
          missions_done: number
          protocol_days: number
          user_id: string
        }[]
      }
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
    Enums: {},
  },
} as const
