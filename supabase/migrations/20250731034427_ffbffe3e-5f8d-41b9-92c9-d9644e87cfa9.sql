-- Step 1: Drop all policies and triggers first
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view their own holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Users can manage their own holdings" ON public.portfolio_holdings;

DROP TRIGGER IF EXISTS trigger_update_portfolio_holdings ON public.transactions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_portfolio_holdings_updated_at ON public.portfolio_holdings;

-- Step 2: Alter column types to TEXT
ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.portfolio_holdings ALTER COLUMN user_id TYPE TEXT;

-- Step 3: Recreate RLS policies with TEXT comparison
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own holdings" 
ON public.portfolio_holdings 
FOR ALL 
USING (auth.uid()::text = user_id) 
WITH CHECK (auth.uid()::text = user_id);

-- Step 4: Update the portfolio holdings function to work with TEXT
CREATE OR REPLACE FUNCTION public.update_portfolio_holdings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  current_holding RECORD;
  new_total_amount DECIMAL(20, 8);
  new_total_invested DECIMAL(20, 2);
  new_average_price DECIMAL(20, 8);
BEGIN
  -- Get current holding (user_id is now TEXT)
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
$function$;

-- Step 5: Recreate triggers
CREATE TRIGGER trigger_update_portfolio_holdings
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_portfolio_holdings();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
  BEFORE UPDATE ON public.portfolio_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();