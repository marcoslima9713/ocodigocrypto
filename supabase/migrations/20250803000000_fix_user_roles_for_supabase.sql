-- Fix user_roles table to work with Supabase auth instead of Firebase
-- Add user_id column to user_roles table
ALTER TABLE public.user_roles ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update existing records to use user_id instead of firebase_uid
-- This will be empty initially since we're migrating from Firebase to Supabase
UPDATE public.user_roles SET user_id = NULL WHERE user_id IS NULL;

-- Make user_id NOT NULL after migration
ALTER TABLE public.user_roles ALTER COLUMN user_id SET NOT NULL;

-- Drop the firebase_uid column since we're not using Firebase anymore
ALTER TABLE public.user_roles DROP COLUMN firebase_uid;

-- Update unique constraint
DROP INDEX IF EXISTS user_roles_firebase_uid_role_key;
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles(user_id, role);

-- Update functions to use user_id instead of firebase_uid
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1
      WHEN role = 'member' THEN 2
      ELSE 3
    END
  LIMIT 1
$$;

-- Update RLS policies to use auth.uid() instead of Firebase UID
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update portfolio holdings policies to use auth.uid()
DROP POLICY IF EXISTS "Users can view their own holdings" ON public.portfolio_holdings;
CREATE POLICY "Users can view their own holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own holdings" ON public.portfolio_holdings;
CREATE POLICY "Users can create their own holdings" 
ON public.portfolio_holdings 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own holdings" ON public.portfolio_holdings;
CREATE POLICY "Users can update their own holdings" 
ON public.portfolio_holdings 
FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own holdings" ON public.portfolio_holdings;
CREATE POLICY "Users can delete their own holdings" 
ON public.portfolio_holdings 
FOR DELETE 
USING (user_id = auth.uid());

-- Update transactions policies to use auth.uid()
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (user_id = auth.uid());

-- Update admin policies to use auth.uid()
DROP POLICY IF EXISTS "Admins can view all holdings" ON public.portfolio_holdings;
CREATE POLICY "Admins can view all holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin')); 