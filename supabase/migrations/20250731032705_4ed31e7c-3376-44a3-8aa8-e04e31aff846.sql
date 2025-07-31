-- Create transactions table for crypto portfolio
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id TEXT NOT NULL,
  crypto_symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  amount DECIMAL(20, 8) NOT NULL,
  price_usd DECIMAL(20, 8) NOT NULL,
  total_usd DECIMAL(20, 2) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create portfolio holdings table for current holdings calculation
CREATE TABLE public.portfolio_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id TEXT NOT NULL,
  crypto_symbol TEXT NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
  average_buy_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_invested DECIMAL(20, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, portfolio_id, crypto_symbol)
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolio holdings
CREATE POLICY "Users can view their own holdings" 
ON public.portfolio_holdings 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own holdings" 
ON public.portfolio_holdings 
FOR ALL 
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Create function to update portfolio holdings
CREATE OR REPLACE FUNCTION public.update_portfolio_holdings()
RETURNS TRIGGER AS $$
DECLARE
  current_holding RECORD;
  new_total_amount DECIMAL(20, 8);
  new_total_invested DECIMAL(20, 2);
  new_average_price DECIMAL(20, 8);
BEGIN
  -- Get current holding
  SELECT * INTO current_holding 
  FROM public.portfolio_holdings 
  WHERE user_id = NEW.user_id::uuid 
    AND portfolio_id = NEW.portfolio_id 
    AND crypto_symbol = NEW.crypto_symbol;

  IF NEW.transaction_type = 'buy' THEN
    IF current_holding IS NULL THEN
      -- First purchase
      INSERT INTO public.portfolio_holdings (
        user_id, portfolio_id, crypto_symbol, 
        total_amount, average_buy_price, total_invested
      ) VALUES (
        NEW.user_id::uuid, NEW.portfolio_id, NEW.crypto_symbol,
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
      WHERE user_id = NEW.user_id::uuid 
        AND portfolio_id = NEW.portfolio_id 
        AND crypto_symbol = NEW.crypto_symbol;
    END IF;
  ELSIF NEW.transaction_type = 'sell' THEN
    IF current_holding IS NOT NULL THEN
      new_total_amount := current_holding.total_amount - NEW.amount;
      
      IF new_total_amount <= 0 THEN
        -- Sold all holdings
        DELETE FROM public.portfolio_holdings 
        WHERE user_id = NEW.user_id::uuid 
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
        WHERE user_id = NEW.user_id::uuid 
          AND portfolio_id = NEW.portfolio_id 
          AND crypto_symbol = NEW.crypto_symbol;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic portfolio holdings updates
CREATE TRIGGER update_portfolio_holdings_trigger
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_portfolio_holdings();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
BEFORE UPDATE ON public.portfolio_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();