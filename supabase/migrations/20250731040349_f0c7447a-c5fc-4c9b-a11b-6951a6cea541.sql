-- Fix RLS policies to work properly with Firebase authentication
-- The issue is that current_setting might not be persisting correctly across requests

-- Drop existing policies that aren't working
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Users can create their own holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Users can update their own holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Users can delete their own holdings" ON public.portfolio_holdings;

-- Create a more robust approach using a function that checks the Firebase UID
CREATE OR REPLACE FUNCTION public.get_firebase_uid()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    current_setting('app.current_firebase_uid', true),
    ''
  )
$$;

-- Create new policies for transactions that work reliably
CREATE POLICY "Firebase users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

CREATE POLICY "Firebase users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

CREATE POLICY "Firebase users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

CREATE POLICY "Firebase users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

-- Create new policies for portfolio holdings
CREATE POLICY "Firebase users can view their own holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

CREATE POLICY "Firebase users can create their own holdings" 
ON public.portfolio_holdings 
FOR INSERT 
WITH CHECK (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

CREATE POLICY "Firebase users can update their own holdings" 
ON public.portfolio_holdings 
FOR UPDATE 
USING (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

CREATE POLICY "Firebase users can delete their own holdings" 
ON public.portfolio_holdings 
FOR DELETE 
USING (user_id = public.get_firebase_uid() AND public.get_firebase_uid() != '');

-- Keep admin policies
CREATE POLICY "Admins can view all holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (public.has_role(public.get_firebase_uid(), 'admin'));

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (public.has_role(public.get_firebase_uid(), 'admin'));