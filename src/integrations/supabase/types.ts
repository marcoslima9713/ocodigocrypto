export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

  export interface CommunityFeedEntry {
    id: string;
    user_id: string;
    user_display_name: string;
    user_username?: string;
    action_type: 'buy' | 'sell' | 'add';
    asset: string;
    amount: number;
    price: number;
    total_value: number;
    pnl_percent?: number;
    pnl_amount?: number;
    created_at: string;
  }

  export interface UserPrivacySettings {
    user_id: string;
    show_in_community_feed: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface PortfolioRankingEntry {
    user_id: string;
    user_name: string;
    user_username?: string;
    user_created_at: string;
    time_window: '7_days' | '30_days';
    return_percent: number;
    top_asset?: string;
    top_asset_return?: number;
    dca_purchase_count: number;
    dca_avg_price?: number;
    total_invested: number;
    total_current_value: number;
    total_unrealized_pnl: number;
    badge?: 'Top Trader' | 'Elite Trader' | 'DCA Master';
  }

  export interface PortfolioRankings {
    return_percent: PortfolioRankingEntry[];
    top_asset: PortfolioRankingEntry[];
    dca_strategy: PortfolioRankingEntry[];
  }

export interface Database {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      members: {
        Row: {
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
      user_roles: {
        Row: {
          created_at: string | null
          firebase_uid: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          firebase_uid: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          firebase_uid?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
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
      community_feed: {
        Row: CommunityFeedEntry;
        Insert: Omit<CommunityFeedEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<CommunityFeedEntry, 'id' | 'created_at'>>;
      };
      
      user_privacy_settings: {
        Row: UserPrivacySettings;
        Insert: Omit<UserPrivacySettings, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserPrivacySettings, 'created_at' | 'updated_at'>>;
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: { _firebase_uid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_firebase_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _firebase_uid: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      set_config: {
        Args: {
          setting_name: string
          setting_value: string
          is_local?: boolean
        }
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
