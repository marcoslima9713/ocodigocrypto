-- Criar tabela para criptomoedas da calculadora DCA
CREATE TABLE IF NOT EXISTS dca_cryptocurrencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  coin_gecko_id VARCHAR(50) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir criptomoedas padrão
INSERT INTO dca_cryptocurrencies (symbol, name, coin_gecko_id, order_index) VALUES
  ('BTC', 'Bitcoin', 'bitcoin', 1),
  ('ETH', 'Ethereum', 'ethereum', 2),
  ('SOL', 'Solana', 'solana', 3),
  ('USDT', 'Tether', 'tether', 4),
  ('DOGE', 'Dogecoin', 'dogecoin', 5),
  ('XRP', 'Ripple', 'ripple', 6),
  ('BNB', 'Binance Coin', 'binancecoin', 7);

-- Criar tabela para histórico de cálculos DCA
CREATE TABLE IF NOT EXISTS dca_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cryptocurrency_symbol VARCHAR(10) NOT NULL,
  initial_date DATE NOT NULL,
  investment_amount DECIMAL(15,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'
  total_invested DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  profitability_percentage DECIMAL(10,2) NOT NULL,
  total_coins DECIMAL(20,8) NOT NULL,
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dca_calculations_user_id ON dca_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_dca_calculations_cryptocurrency ON dca_calculations(cryptocurrency_symbol);
CREATE INDEX IF NOT EXISTS idx_dca_calculations_date ON dca_calculations(calculation_date);

-- Habilitar RLS
ALTER TABLE dca_cryptocurrencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dca_calculations ENABLE ROW LEVEL SECURITY;

-- Políticas para dca_cryptocurrencies (leitura pública)
CREATE POLICY "dca_cryptocurrencies_select_policy" ON dca_cryptocurrencies
  FOR SELECT USING (true);

-- Políticas para dca_calculations (usuários podem ver apenas seus próprios cálculos)
CREATE POLICY "dca_calculations_select_policy" ON dca_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dca_calculations_insert_policy" ON dca_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dca_calculations_update_policy" ON dca_calculations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "dca_calculations_delete_policy" ON dca_calculations
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_dca_cryptocurrencies_updated_at
  BEFORE UPDATE ON dca_cryptocurrencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 