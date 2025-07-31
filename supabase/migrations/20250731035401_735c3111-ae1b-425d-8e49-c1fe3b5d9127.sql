-- Create user roles system for secure admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (firebase_uid, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_firebase_uid TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE firebase_uid = _firebase_uid
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role(_firebase_uid TEXT)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles 
  WHERE firebase_uid = _firebase_uid 
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1
      WHEN role = 'member' THEN 2
      ELSE 3
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (firebase_uid = current_setting('app.current_firebase_uid', true));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(current_setting('app.current_firebase_uid', true), 'admin'));

-- Re-enable RLS on financial tables with Firebase-compatible policies
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Portfolio holdings policies
CREATE POLICY "Users can view their own holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (user_id = current_setting('app.current_firebase_uid', true));

CREATE POLICY "Users can create their own holdings" 
ON public.portfolio_holdings 
FOR INSERT 
WITH CHECK (user_id = current_setting('app.current_firebase_uid', true));

CREATE POLICY "Users can update their own holdings" 
ON public.portfolio_holdings 
FOR UPDATE 
USING (user_id = current_setting('app.current_firebase_uid', true));

CREATE POLICY "Users can delete their own holdings" 
ON public.portfolio_holdings 
FOR DELETE 
USING (user_id = current_setting('app.current_firebase_uid', true));

-- Transactions policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (user_id = current_setting('app.current_firebase_uid', true));

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (user_id = current_setting('app.current_firebase_uid', true));

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (user_id = current_setting('app.current_firebase_uid', true));

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (user_id = current_setting('app.current_firebase_uid', true));

-- Admin policies for financial data
CREATE POLICY "Admins can view all holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (public.has_role(current_setting('app.current_firebase_uid', true), 'admin'));

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (public.has_role(current_setting('app.current_firebase_uid', true), 'admin'));

-- Create trigger to update timestamps
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update portfolio holdings after transactions (re-enable with Firebase UIDs)
CREATE OR REPLACE FUNCTION public.update_portfolio_holdings_firebase()
RETURNS TRIGGER AS $$
DECLARE
  current_holding RECORD;
  new_total_amount DECIMAL(20, 8);
  new_total_invested DECIMAL(20, 2);
  new_average_price DECIMAL(20, 8);
BEGIN
  -- Get current holding using Firebase UID
  SELECT * INTO current_holding 
  FROM public.portfolio_holdings 
  WHERE user_id = NEW.user_id
    AND portfolio_id = NEW.portfolio_id 
    AND crypto_symbol = NEW.crypto_symbol;

  IF NEW.transaction_type = 'buy' THEN
    IF current_holding IS NULL THEN
      -- First purchase
      INSERT INTO public.portfolio_holdings (
        user_id, portfolio_id, crypto_symbol, 
        total_amount, average_buy_price, total_invested
      ) VALUES (
        NEW.user_id, NEW.portfolio_id, NEW.crypto_symbol,
        NEW.amount, NEW.price_usd, NEW.total_usd
      );
    ELSE
      -- Update existing holding
      new_total_amount := current_holding.total_amount + NEW.amount;
      new_total_invested := current_holding.total_invested + NEW.total_usd;
      new_average_price := new_total_invested / new_total_amount;
      
      UPDATE public.portfolio_holdings 
      SET 
        total_amount = new_total_amount,
        total_invested = new_total_invested,
        average_buy_price = new_average_price,
        updated_at = now()
      WHERE user_id = NEW.user_id
        AND portfolio_id = NEW.portfolio_id 
        AND crypto_symbol = NEW.crypto_symbol;
    END IF;
  ELSIF NEW.transaction_type = 'sell' THEN
    IF current_holding IS NOT NULL THEN
      new_total_amount := current_holding.total_amount - NEW.amount;
      
      IF new_total_amount <= 0 THEN
        -- Sold all holdings
        DELETE FROM public.portfolio_holdings 
        WHERE user_id = NEW.user_id
          AND portfolio_id = NEW.portfolio_id 
          AND crypto_symbol = NEW.crypto_symbol;
      ELSE
        -- Partial sale - reduce total invested proportionally
        new_total_invested := current_holding.total_invested * (new_total_amount / current_holding.total_amount);
        
        UPDATE public.portfolio_holdings 
        SET 
          total_amount = new_total_amount,
          total_invested = new_total_invested,
          updated_at = now()
        WHERE user_id = NEW.user_id
          AND portfolio_id = NEW.portfolio_id 
          AND crypto_symbol = NEW.crypto_symbol;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS update_portfolio_holdings_trigger ON public.transactions;
CREATE TRIGGER update_portfolio_holdings_trigger
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_portfolio_holdings_firebase();