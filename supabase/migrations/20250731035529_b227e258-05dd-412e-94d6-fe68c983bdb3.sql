-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.has_role(_firebase_uid TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE firebase_uid = _firebase_uid
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role(_firebase_uid TEXT)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.update_portfolio_holdings_firebase()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;