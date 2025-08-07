-- Create crypto_images table
CREATE TABLE public.crypto_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better performance
CREATE INDEX idx_crypto_images_symbol ON public.crypto_images(symbol);

-- Add RLS policies
ALTER TABLE public.crypto_images ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read crypto images
CREATE POLICY "Allow authenticated users to read crypto images" ON public.crypto_images
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to manage crypto images
CREATE POLICY "Allow admin users to manage crypto images" ON public.crypto_images
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some default crypto images
INSERT INTO public.crypto_images (symbol, name, image_url) VALUES
('BTC', 'Bitcoin', 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'),
('ETH', 'Ethereum', 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'),
('ADA', 'Cardano', 'https://assets.coingecko.com/coins/images/975/large/Cardano.png'),
('SOL', 'Solana', 'https://assets.coingecko.com/coins/images/4128/large/solana.png'),
('DOT', 'Polkadot', 'https://assets.coingecko.com/coins/images/12171/large/polkadot_new_logo.png'),
('MATIC', 'Polygon', 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png'),
('LINK', 'Chainlink', 'https://assets.coingecko.com/coins/images/877/large/chainlink.png'),
('UNI', 'Uniswap', 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png'),
('AVAX', 'Avalanche', 'https://assets.coingecko.com/coins/images/12559/large/avalanche.png'),
('ATOM', 'Cosmos', 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png'); 