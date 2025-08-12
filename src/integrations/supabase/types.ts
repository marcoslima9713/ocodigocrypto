export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      community_feed: {
        Row: {
          action_type: string
          amount: number
          asset: string
          created_at: string | null
          id: string
          pnl_amount: number | null
          pnl_percent: number | null
          price: number
          source_transaction_id: string | null
          total_value: number
          user_display_name: string
          user_id: string
          user_username: string | null
        }
        Insert: {
          action_type: string
          amount: number
          asset: string
          created_at?: string | null
          id?: string
          pnl_amount?: number | null
          pnl_percent?: number | null
          price: number
          source_transaction_id?: string | null
          total_value: number
          user_display_name: string
          user_id: string
          user_username?: string | null
        }
        Update: {
          action_type?: string
          amount?: number
          asset?: string
          created_at?: string | null
          id?: string
          pnl_amount?: number | null
          pnl_percent?: number | null
          price?: number
          source_transaction_id?: string | null
          total_value?: number
          user_display_name?: string
          user_id?: string
          user_username?: string | null
        }
        Relationships: []
      }
      crypto_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          name: string
          symbol: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          name: string
          symbol: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          name?: string
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crypto_prices: {
        Row: {
          crypto_symbol: string
          price_usd: number
          updated_at: string
        }
        Insert: {
          crypto_symbol: string
          price_usd: number
          updated_at?: string
        }
        Update: {
          crypto_symbol?: string
          price_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      dca_calculations: {
        Row: {
          calculation_date: string | null
          created_at: string | null
          cryptocurrency_symbol: string
          current_value: number
          frequency: string
          id: string
          initial_date: string
          investment_amount: number
          profitability_percentage: number
          total_coins: number
          total_invested: number
          user_id: string | null
        }
        Insert: {
          calculation_date?: string | null
          created_at?: string | null
          cryptocurrency_symbol: string
          current_value: number
          frequency: string
          id?: string
          initial_date: string
          investment_amount: number
          profitability_percentage: number
          total_coins: number
          total_invested: number
          user_id?: string | null
        }
        Update: {
          calculation_date?: string | null
          created_at?: string | null
          cryptocurrency_symbol?: string
          current_value?: number
          frequency?: string
          id?: string
          initial_date?: string
          investment_amount?: number
          profitability_percentage?: number
          total_coins?: number
          total_invested?: number
          user_id?: string | null
        }
        Relationships: []
      }
      dca_cryptocurrencies: {
        Row: {
          coin_gecko_id: string
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_index: number | null
          symbol: string
          updated_at: string | null
        }
        Insert: {
          coin_gecko_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_index?: number | null
          symbol: string
          updated_at?: string | null
        }
        Update: {
          coin_gecko_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      free_access_settings: {
        Row: {
          allow_dashboard: boolean
          allow_dca_calculator: boolean
          allow_home: boolean
          allow_portfolio: boolean
          allowed_modules: string[]
          id: string
          updated_at: string | null
        }
        Insert: {
          allow_dashboard?: boolean
          allow_dca_calculator?: boolean
          allow_home?: boolean
          allow_portfolio?: boolean
          allowed_modules?: string[]
          id?: string
          updated_at?: string | null
        }
        Update: {
          allow_dashboard?: boolean
          allow_dca_calculator?: boolean
          allow_home?: boolean
          allow_portfolio?: boolean
          allowed_modules?: string[]
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      free_users: {
        Row: {
          allowed_modules: string[]
          created_at: string | null
          email: string
          full_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_modules?: string[]
          created_at?: string | null
          email: string
          full_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_modules?: string[]
          created_at?: string | null
          email?: string
          full_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string
          ggcheckout_transaction_id: string | null
          id: string
          is_active: boolean
          password_hash: string
          product_name: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name: string
          ggcheckout_transaction_id?: string | null
          id?: string
          is_active?: boolean
          password_hash: string
          product_name: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          ggcheckout_transaction_id?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string
          product_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_covers: {
        Row: {
          cover_url: string | null
          id: number
          slug: string | null
          title: string | null
        }
        Insert: {
          cover_url?: string | null
          id?: number
          slug?: string | null
          title?: string | null
        }
        Update: {
          cover_url?: string | null
          id?: number
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          average_buy_price: number
          created_at: string
          crypto_symbol: string
          id: string
          portfolio_id: string
          total_amount: number
          total_invested: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_buy_price?: number
          created_at?: string
          crypto_symbol: string
          id?: string
          portfolio_id: string
          total_amount?: number
          total_invested?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_buy_price?: number
          created_at?: string
          crypto_symbol?: string
          id?: string
          portfolio_id?: string
          total_amount?: number
          total_invested?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_rankings_simple: {
        Row: {
          badge: string | null
          created_at: string | null
          dca_avg_price: number | null
          dca_purchase_count: number | null
          id: string
          return_percent: number
          time_window: string
          top_asset: string | null
          top_asset_return: number | null
          total_current_value: number
          total_invested: number
          total_unrealized_pnl: number
          updated_at: string | null
          user_created_at: string | null
          user_id: string
          user_name: string
          user_username: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          dca_avg_price?: number | null
          dca_purchase_count?: number | null
          id?: string
          return_percent: number
          time_window: string
          top_asset?: string | null
          top_asset_return?: number | null
          total_current_value: number
          total_invested: number
          total_unrealized_pnl: number
          updated_at?: string | null
          user_created_at?: string | null
          user_id: string
          user_name: string
          user_username?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          dca_avg_price?: number | null
          dca_purchase_count?: number | null
          id?: string
          return_percent?: number
          time_window?: string
          top_asset?: string | null
          top_asset_return?: number | null
          total_current_value?: number
          total_invested?: number
          total_unrealized_pnl?: number
          updated_at?: string | null
          user_created_at?: string | null
          user_id?: string
          user_name?: string
          user_username?: string | null
        }
        Relationships: []
      }
      ranking_update_log: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string
          last_update: string
          records_updated: number | null
          update_type: string
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          last_update?: string
          records_updated?: number | null
          update_type?: string
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          last_update?: string
          records_updated?: number | null
          update_type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          crypto_symbol: string
          id: string
          portfolio_id: string
          price_usd: number
          total_usd: number
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          crypto_symbol: string
          id?: string
          portfolio_id: string
          price_usd: number
          total_usd: number
          transaction_date?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          crypto_symbol?: string
          id?: string
          portfolio_id?: string
          price_usd?: number
          total_usd?: number
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_privacy_settings: {
        Row: {
          created_at: string | null
          show_in_community_feed: boolean | null
          show_portfolio_value: boolean | null
          show_transactions: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          show_in_community_feed?: boolean | null
          show_portfolio_value?: boolean | null
          show_transactions?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          show_in_community_feed?: boolean | null
          show_portfolio_value?: boolean | null
          show_transactions?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users_progress: {
        Row: {
          completed_modules: string[] | null
          last_access: string | null
          user_id: string
        }
        Insert: {
          completed_modules?: string[] | null
          last_access?: string | null
          user_id: string
        }
        Update: {
          completed_modules?: string[] | null
          last_access?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_lessons: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration: number | null
          estimated_minutes: number | null
          file_path: string
          file_size: number | null
          id: string
          is_public: boolean | null
          module_id: string | null
          order_index: number | null
          status: string | null
          thumbnail_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          estimated_minutes?: number | null
          file_path: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          module_id?: string | null
          order_index?: number | null
          status?: string | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          estimated_minutes?: number | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          module_id?: string | null
          order_index?: number | null
          status?: string | null
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          status: string
          webhook_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          status: string
          webhook_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          status?: string
          webhook_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      portfolio_performance_rankings_v2: {
        Row: {
          profit_usd: number | null
          return_percent: number | null
          total_current_value: number | null
          total_invested: number | null
          user_created_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_user_role: {
        Args: { _firebase_uid: string } | { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_firebase_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args:
          | {
              _firebase_uid: string
              _role: Database["public"]["Enums"]["app_role"]
            }
          | { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      log_ranking_update: {
        Args: {
          p_update_type?: string
          p_records_updated?: number
          p_execution_time_ms?: number
        }
        Returns: undefined
      }
      refresh_portfolio_rankings_v2: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_portfolio_rankings_v2_with_log: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      set_config: {
        Args:
          | { is_local: boolean; setting_name: string; setting_value: string }
          | { setting_name: string; setting_value: string; is_local?: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member" | "user"
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
    Enums: {
      app_role: ["admin", "member", "user"],
    },
  },
} as const
