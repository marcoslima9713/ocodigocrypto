// Local types for database entities since Supabase types may not be generated yet

export interface CommunityFeedEntry {
  id: string
  user_id: string
  user_display_name: string
  user_username?: string
  action_type: string
  asset: string
  amount: number
  price: number
  total_value: number
  pnl_percent?: number
  pnl_amount?: number
  source_transaction_id?: string
  created_at: string
}

export interface PortfolioRankingEntry {
  user_id: string
  user_name: string
  user_email?: string
  user_username?: string
  user_created_at: string
  time_window: '7_days' | '30_days'
  return_percent: number
  top_asset?: string
  top_asset_return?: number
  dca_purchase_count?: number
  dca_avg_price?: number
  total_invested: number
  total_current_value: number
  total_unrealized_pnl: number
  profit_usd: number
  badge?: 'Top Trader' | 'Elite Trader' | 'DCA Master'
}

export interface PortfolioRankings {
  return_percent: PortfolioRankingEntry[]
  top_asset: PortfolioRankingEntry[]
  dca_strategy: PortfolioRankingEntry[]
}

export interface UserPrivacySettings {
  user_id: string
  show_portfolio_value: boolean
  show_transactions: boolean
  show_in_community_feed: boolean
  created_at: string
  updated_at: string
}

export interface ModuleCover {
  id: number
  slug: string
  title: string
  cover_url: string
}