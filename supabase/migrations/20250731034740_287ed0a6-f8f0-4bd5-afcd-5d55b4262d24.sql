-- Remove RLS policies that depend on Supabase auth since we're using Firebase
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view their own holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Users can manage their own holdings" ON public.portfolio_holdings;

-- Disable RLS since we're using Firebase auth and application-level security
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings DISABLE ROW LEVEL SECURITY;