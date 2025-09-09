// Serviço para integração com MCP de Pools de Liquidez
export interface LiquidityPool {
  network: string;
  dex: string;
  token0: string;
  token1: string;
  token0_symbol: string;
  token1_symbol: string;
  liquidity_usd: number;
  volume_24h: number;
  fees_24h: number;
  apy: number;
  tvl: number;
  price_change_24h: number;
  pool_address: string;
  pair_address: string;
}

export interface NetworkInfo {
  name: string;
  chain_id: number;
  tvl: number;
  pool_count: number;
  volume_24h: number;
}

export interface PoolComparison {
  best_pool: LiquidityPool;
  total_pools: number;
  total_tvl: number;
  total_volume: number;
}

export interface LiquidityOpportunity {
  pool: LiquidityPool;
  opportunity_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  potential_apy: number;
}

class LiquidityService {
  private baseUrl = 'http://localhost:8000'; // URL do MCP server
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    // Por enquanto, usar apenas dados mockados para funcionar com npm run dev
    console.log('📊 Usando dados mockados para desenvolvimento');
    return this.getMockData(endpoint, params);
  }

  private getMockData(endpoint: string, params: any): any {
    // Dados mockados expandidos para desenvolvimento
    const mockPools: LiquidityPool[] = [
      // Ethereum Pools
      {
        network: 'ethereum',
        dex: 'Uniswap V3',
        token0: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
        token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        token0_symbol: 'USDC',
        token1_symbol: 'WETH',
        liquidity_usd: 15000000,
        volume_24h: 5000000,
        fees_24h: 15000,
        apy: 12.5,
        tvl: 15000000,
        price_change_24h: 2.5,
        pool_address: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
        pair_address: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'
      },
      {
        network: 'ethereum',
        dex: 'SushiSwap',
        token0: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        token0_symbol: 'DAI',
        token1_symbol: 'WETH',
        liquidity_usd: 8000000,
        volume_24h: 3000000,
        fees_24h: 9000,
        apy: 15.2,
        tvl: 8000000,
        price_change_24h: -1.2,
        pool_address: '0xC3D03e4F041Fd4cD388c549Ee2A29a9E5075882f',
        pair_address: '0xC3D03e4F041Fd4cD388c549Ee2A29a9E5075882f'
      },
      {
        network: 'ethereum',
        dex: 'Uniswap V3',
        token0: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        token0_symbol: 'WBTC',
        token1_symbol: 'WETH',
        liquidity_usd: 25000000,
        volume_24h: 8000000,
        fees_24h: 24000,
        apy: 18.9,
        tvl: 25000000,
        price_change_24h: 4.2,
        pool_address: '0xCBCdF9626bC03E24f779434178A73a0B4bad62eD',
        pair_address: '0xCBCdF9626bC03E24f779434178A73a0B4bad62eD'
      },
      {
        network: 'ethereum',
        dex: 'Balancer',
        token0: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        token1: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
        token0_symbol: 'DAI',
        token1_symbol: 'USDC',
        liquidity_usd: 12000000,
        volume_24h: 3500000,
        fees_24h: 10500,
        apy: 14.8,
        tvl: 12000000,
        price_change_24h: 0.8,
        pool_address: '0x0b09dea16768f0799065c475be02919503cb2a35',
        pair_address: '0x0b09dea16768f0799065c475be02919503cb2a35'
      },
      {
        network: 'ethereum',
        dex: 'Curve',
        token0: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        token1: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
        token0_symbol: 'DAI',
        token1_symbol: 'USDC',
        liquidity_usd: 18000000,
        volume_24h: 4500000,
        fees_24h: 13500,
        apy: 16.2,
        tvl: 18000000,
        price_change_24h: 1.1,
        pool_address: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
        pair_address: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7'
      },
      {
        network: 'ethereum',
        dex: 'Uniswap V3',
        token0: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        token1: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
        token0_symbol: 'USDT',
        token1_symbol: 'USDC',
        liquidity_usd: 22000000,
        volume_24h: 7000000,
        fees_24h: 21000,
        apy: 19.5,
        tvl: 22000000,
        price_change_24h: 0.3,
        pool_address: '0x3416cf6c708da44db2624d63ea0aaef7113527c6',
        pair_address: '0x3416cf6c708da44db2624d63ea0aaef7113527c6'
      },
      {
        network: 'ethereum',
        dex: 'SushiSwap',
        token0: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        token0_symbol: 'UNI',
        token1_symbol: 'WETH',
        liquidity_usd: 9000000,
        volume_24h: 2800000,
        fees_24h: 8400,
        apy: 17.8,
        tvl: 9000000,
        price_change_24h: 3.2,
        pool_address: '0x34965ba0ac2451a34a0471f04cca3f990b8dea27',
        pair_address: '0x34965ba0ac2451a34a0471f04cca3f990b8dea27'
      },
      {
        network: 'ethereum',
        dex: 'Uniswap V3',
        token0: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        token0_symbol: 'LINK',
        token1_symbol: 'WETH',
        liquidity_usd: 11000000,
        volume_24h: 3200000,
        fees_24h: 9600,
        apy: 15.9,
        tvl: 11000000,
        price_change_24h: 2.8,
        pool_address: '0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8',
        pair_address: '0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8'
      },
      // BSC Pools
      {
        network: 'bsc',
        dex: 'PancakeSwap',
        token0: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        token1: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0A169cFdAC',
        token0_symbol: 'CAKE',
        token1_symbol: 'WBNB',
        liquidity_usd: 12000000,
        volume_24h: 4000000,
        fees_24h: 12000,
        apy: 18.7,
        tvl: 12000000,
        price_change_24h: 3.8,
        pool_address: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
        pair_address: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0'
      },
      {
        network: 'bsc',
        dex: 'PancakeSwap',
        token0: '0x55d398326f99059fF775485246999027B3197955',
        token1: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0A169cFdAC',
        token0_symbol: 'USDT',
        token1_symbol: 'WBNB',
        liquidity_usd: 18000000,
        volume_24h: 6000000,
        fees_24h: 18000,
        apy: 16.3,
        tvl: 18000000,
        price_change_24h: 1.8,
        pool_address: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE',
        pair_address: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE'
      },
      {
        network: 'bsc',
        dex: 'PancakeSwap',
        token0: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        token1: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0A169cFdAC',
        token0_symbol: 'USDC',
        token1_symbol: 'WBNB',
        liquidity_usd: 14000000,
        volume_24h: 4500000,
        fees_24h: 13500,
        apy: 19.2,
        tvl: 14000000,
        price_change_24h: 2.1,
        pool_address: '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16',
        pair_address: '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16'
      },
      {
        network: 'bsc',
        dex: 'PancakeSwap',
        token0: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        token1: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0A169cFdAC',
        token0_symbol: 'BTCB',
        token1_symbol: 'WBNB',
        liquidity_usd: 16000000,
        volume_24h: 5200000,
        fees_24h: 15600,
        apy: 21.4,
        tvl: 16000000,
        price_change_24h: 4.5,
        pool_address: '0x61eb789d75a95caa3ff50ed7e47b96c132fec082',
        pair_address: '0x61eb789d75a95caa3ff50ed7e47b96c132fec082'
      },
      {
        network: 'bsc',
        dex: 'SushiSwap',
        token0: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        token1: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0A169cFdAC',
        token0_symbol: 'CAKE',
        token1_symbol: 'WBNB',
        liquidity_usd: 8000000,
        volume_24h: 2500000,
        fees_24h: 7500,
        apy: 16.8,
        tvl: 8000000,
        price_change_24h: 3.1,
        pool_address: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
        pair_address: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0'
      },
      // Polygon Pools
      {
        network: 'polygon',
        dex: 'QuickSwap',
        token0: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        token1: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        token0_symbol: 'WETH',
        token1_symbol: 'WMATIC',
        liquidity_usd: 6000000,
        volume_24h: 2000000,
        fees_24h: 6000,
        apy: 22.1,
        tvl: 6000000,
        price_change_24h: 1.5,
        pool_address: '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827',
        pair_address: '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827'
      },
      {
        network: 'polygon',
        dex: 'SushiSwap',
        token0: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        token1: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        token0_symbol: 'USDC',
        token1_symbol: 'WMATIC',
        liquidity_usd: 9000000,
        volume_24h: 3500000,
        fees_24h: 10500,
        apy: 19.5,
        tvl: 9000000,
        price_change_24h: 2.1,
        pool_address: '0x34965ba0ac2451a34a0471f04cca3f990b8dea27',
        pair_address: '0x34965ba0ac2451a34a0471f04cca3f990b8dea27'
      },
      {
        network: 'polygon',
        dex: 'QuickSwap',
        token0: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        token1: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        token0_symbol: 'USDC',
        token1_symbol: 'USDT',
        liquidity_usd: 11000000,
        volume_24h: 3800000,
        fees_24h: 11400,
        apy: 18.9,
        tvl: 11000000,
        price_change_24h: 0.7,
        pool_address: '0x2cf7252e74036d1da831d11089d326296e64a728',
        pair_address: '0x2cf7252e74036d1da831d11089d326296e64a728'
      },
      {
        network: 'polygon',
        dex: 'SushiSwap',
        token0: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        token1: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        token0_symbol: 'WETH',
        token1_symbol: 'USDC',
        liquidity_usd: 7500000,
        volume_24h: 2800000,
        fees_24h: 8400,
        apy: 20.3,
        tvl: 7500000,
        price_change_24h: 2.8,
        pool_address: '0x34965ba0ac2451a34a0471f04cca3f990b8dea27',
        pair_address: '0x34965ba0ac2451a34a0471f04cca3f990b8dea27'
      },
      // Arbitrum Pools
      {
        network: 'arbitrum',
        dex: 'Camelot',
        token0: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        token1: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        token0_symbol: 'USDC',
        token1_symbol: 'WETH',
        liquidity_usd: 9000000,
        volume_24h: 3500000,
        fees_24h: 10500,
        apy: 16.8,
        tvl: 9000000,
        price_change_24h: 0.8,
        pool_address: '0x84652bb2539513BAf36e225c930Fdd8eaa63CE27',
        pair_address: '0x84652bb2539513BAf36e225c930Fdd8eaa63CE27'
      },
      {
        network: 'arbitrum',
        dex: 'SushiSwap',
        token0: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        token1: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        token0_symbol: 'ARB',
        token1_symbol: 'WETH',
        liquidity_usd: 7000000,
        volume_24h: 2500000,
        fees_24h: 7500,
        apy: 21.4,
        tvl: 7000000,
        price_change_24h: 5.2,
        pool_address: '0x92C63c8A604356Fa3d666dF64Ab48625B15f6530',
        pair_address: '0x92C63c8A604356Fa3d666dF64Ab48625B15f6530'
      },
      {
        network: 'arbitrum',
        dex: 'Uniswap V3',
        token0: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        token1: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        token0_symbol: 'USDC',
        token1_symbol: 'WETH',
        liquidity_usd: 12000000,
        volume_24h: 4200000,
        fees_24h: 12600,
        apy: 18.2,
        tvl: 12000000,
        price_change_24h: 1.2,
        pool_address: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
        pair_address: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'
      },
      // Optimism Pools
      {
        network: 'optimism',
        dex: 'Uniswap V3',
        token0: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        token1: '0x4200000000000000000000000000000000000006',
        token0_symbol: 'USDC',
        token1_symbol: 'WETH',
        liquidity_usd: 5000000,
        volume_24h: 1800000,
        fees_24h: 5400,
        apy: 14.7,
        tvl: 5000000,
        price_change_24h: 1.2,
        pool_address: '0x85149247691df622eaF1a8Bd0CaFd40BC45154a9',
        pair_address: '0x85149247691df622eaF1a8Bd0CaFd40BC45154a9'
      },
      {
        network: 'optimism',
        dex: 'Velodrome',
        token0: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        token1: '0x4200000000000000000000000000000000000006',
        token0_symbol: 'USDC',
        token1_symbol: 'WETH',
        liquidity_usd: 3500000,
        volume_24h: 1200000,
        fees_24h: 3600,
        apy: 16.9,
        tvl: 3500000,
        price_change_24h: 0.9,
        pool_address: '0x79c912fef520be002c2b6e57ec4324e260f38e50',
        pair_address: '0x79c912fef520be002c2b6e57ec4324e260f38e50'
      },
      // Base Pools
      {
        network: 'base',
        dex: 'Uniswap V3',
        token0: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        token1: '0x4200000000000000000000000000000000000006',
        token0_symbol: 'USDC',
        token1_symbol: 'WETH',
        liquidity_usd: 3000000,
        volume_24h: 1200000,
        fees_24h: 3600,
        apy: 17.2,
        tvl: 3000000,
        price_change_24h: 2.8,
        pool_address: '0x4C36388bE6F416A29C8d8EDB537F4798B8DfE4A0',
        pair_address: '0x4C36388bE6F416A29C8d8EDB537F4798B8DfE4A0'
      },
      {
        network: 'base',
        dex: 'Aerodrome',
        token0: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        token1: '0x4200000000000000000000000000000000000006',
        token0_symbol: 'USDC',
        token1_symbol: 'WETH',
        liquidity_usd: 2000000,
        volume_24h: 800000,
        fees_24h: 2400,
        apy: 19.8,
        tvl: 2000000,
        price_change_24h: 1.5,
        pool_address: '0x4C36388bE6F416A29C8d8EDB537F4798B8DfE4A0',
        pair_address: '0x4C36388bE6F416A29C8d8EDB537F4798B8DfE4A0'
      },
      // Solana Pools
      {
        network: 'solana',
        dex: 'Raydium',
        token0: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        token1: 'So11111111111111111111111111111111111111112',
        token0_symbol: 'USDC',
        token1_symbol: 'SOL',
        liquidity_usd: 8000000,
        volume_24h: 3000000,
        fees_24h: 9000,
        apy: 25.3,
        tvl: 8000000,
        price_change_24h: 3.5,
        pool_address: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',
        pair_address: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'
      },
      {
        network: 'solana',
        dex: 'Orca',
        token0: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        token1: 'So11111111111111111111111111111111111111112',
        token0_symbol: 'USDC',
        token1_symbol: 'SOL',
        liquidity_usd: 6000000,
        volume_24h: 2200000,
        fees_24h: 6600,
        apy: 23.7,
        tvl: 6000000,
        price_change_24h: 3.2,
        pool_address: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',
        pair_address: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'
      },
      // Avalanche Pools
      {
        network: 'avalanche',
        dex: 'TraderJoe',
        token0: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        token1: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
        token0_symbol: 'USDC',
        token1_symbol: 'WAVAX',
        liquidity_usd: 4000000,
        volume_24h: 1500000,
        fees_24h: 4500,
        apy: 20.8,
        tvl: 4000000,
        price_change_24h: 1.9,
        pool_address: '0xf4003F4efBE8691B60249E6afbD307aBE7758adb',
        pair_address: '0xf4003F4efBE8691B60249E6afbD307aBE7758adb'
      },
      {
        network: 'avalanche',
        dex: 'Pangolin',
        token0: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        token1: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
        token0_symbol: 'USDC',
        token1_symbol: 'WAVAX',
        liquidity_usd: 2500000,
        volume_24h: 900000,
        fees_24h: 2700,
        apy: 18.5,
        tvl: 2500000,
        price_change_24h: 1.6,
        pool_address: '0xf4003F4efBE8691B60249E6afbD307aBE7758adb',
        pair_address: '0xf4003F4efBE8691B60249E6afbD307aBE7758adb'
      },
      // Fantom Pools
      {
        network: 'fantom',
        dex: 'SpookySwap',
        token0: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
        token1: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
        token0_symbol: 'USDC',
        token1_symbol: 'WFTM',
        liquidity_usd: 2000000,
        volume_24h: 800000,
        fees_24h: 2400,
        apy: 19.2,
        tvl: 2000000,
        price_change_24h: 1.3,
        pool_address: '0x2b4c76d0dc16be1c31d4c1dc53bf9b45987fc75c',
        pair_address: '0x2b4c76d0dc16be1c31d4c1dc53bf9b45987fc75c'
      },
      {
        network: 'fantom',
        dex: 'SpiritSwap',
        token0: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
        token1: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
        token0_symbol: 'USDC',
        token1_symbol: 'WFTM',
        liquidity_usd: 1500000,
        volume_24h: 600000,
        fees_24h: 1800,
        apy: 17.8,
        tvl: 1500000,
        price_change_24h: 1.1,
        pool_address: '0x2b4c76d0dc16be1c31d4c1dc53bf9b45987fc75c',
        pair_address: '0x2b4c76d0dc16be1c31d4c1dc53bf9b45987fc75c'
      },
      // Aptos Pools
      {
        network: 'aptos',
        dex: 'PancakeSwap',
        token0: '0x1::aptos_coin::AptosCoin',
        token1: '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T',
        token0_symbol: 'APT',
        token1_symbol: 'USDC',
        liquidity_usd: 1000000,
        volume_24h: 400000,
        fees_24h: 1200,
        apy: 22.5,
        tvl: 1000000,
        price_change_24h: 2.8,
        pool_address: '0x1::aptos_coin::AptosCoin',
        pair_address: '0x1::aptos_coin::AptosCoin'
      },
      // Sui Pools
      {
        network: 'sui',
        dex: 'Cetus',
        token0: '0x2::sui::SUI',
        token1: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        token0_symbol: 'SUI',
        token1_symbol: 'USDC',
        liquidity_usd: 500000,
        volume_24h: 200000,
        fees_24h: 600,
        apy: 24.8,
        tvl: 500000,
        price_change_24h: 3.2,
        pool_address: '0x2::sui::SUI',
        pair_address: '0x2::sui::SUI'
      }
    ];

    const mockNetworks: NetworkInfo[] = [
      { name: 'ethereum', chain_id: 1, tvl: 48000000, pool_count: 8, volume_24h: 16000000 },
      { name: 'bsc', chain_id: 56, tvl: 30000000, pool_count: 5, volume_24h: 10000000 },
      { name: 'polygon', chain_id: 137, tvl: 15000000, pool_count: 4, volume_24h: 5500000 },
      { name: 'arbitrum', chain_id: 42161, tvl: 16000000, pool_count: 3, volume_24h: 6000000 },
      { name: 'optimism', chain_id: 10, tvl: 5000000, pool_count: 2, volume_24h: 1800000 },
      { name: 'base', chain_id: 8453, tvl: 3000000, pool_count: 2, volume_24h: 1200000 },
      { name: 'solana', chain_id: 0, tvl: 8000000, pool_count: 2, volume_24h: 3000000 },
      { name: 'avalanche', chain_id: 43114, tvl: 4000000, pool_count: 2, volume_24h: 1500000 },
      { name: 'fantom', chain_id: 250, tvl: 2000000, pool_count: 2, volume_24h: 800000 },
      { name: 'aptos', chain_id: 0, tvl: 1000000, pool_count: 1, volume_24h: 400000 },
      { name: 'sui', chain_id: 0, tvl: 500000, pool_count: 1, volume_24h: 200000 }
    ];

    switch (endpoint) {
      case 'get_network_pools':
        const network = params.network || 'ethereum';
        const sortBy = params.sort_by || 'tvl';
        const limit = params.limit || 20;
        
        let filteredPools = mockPools.filter(pool => pool.network === network);
        
        // Ordenação correta baseada no parâmetro
        if (sortBy === 'tvl') {
          filteredPools.sort((a, b) => b.tvl - a.tvl);
        } else if (sortBy === 'apy') {
          filteredPools.sort((a, b) => b.apy - a.apy);
        } else if (sortBy === 'volume_usd') {
          filteredPools.sort((a, b) => b.volume_24h - a.volume_24h);
        } else if (sortBy === 'fees_24h') {
          filteredPools.sort((a, b) => b.fees_24h - a.fees_24h);
        }
        
        return filteredPools.slice(0, limit);

      case 'get_available_networks':
        return mockNetworks;

      case 'search_pools_by_token':
        const tokenSymbol = params.token_symbol?.toUpperCase();
        const searchNetwork = params.network || 'ethereum';
        
        return mockPools.filter(pool => 
          pool.network === searchNetwork && 
          (pool.token0_symbol.includes(tokenSymbol) || pool.token1_symbol.includes(tokenSymbol))
        );

      default:
        return [];
    }
  }

  async getNetworkPools(network: string, sortBy: string = 'tvl', limit: number = 20): Promise<LiquidityPool[]> {
    const cacheKey = `pools_${network}_${sortBy}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await this.makeRequest('get_network_pools', { network, sort_by: sortBy, limit });
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  async getAvailableNetworks(): Promise<NetworkInfo[]> {
    const cacheKey = 'networks';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await this.makeRequest('get_available_networks');
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  async searchPoolsByToken(tokenSymbol: string, network: string = 'ethereum'): Promise<LiquidityPool[]> {
    const cacheKey = `search_${tokenSymbol}_${network}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await this.makeRequest('search_pools_by_token', { token_symbol: tokenSymbol, network });
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  async getPoolComparison(tokenSymbol: string, network: string = 'ethereum'): Promise<Record<string, PoolComparison>> {
    const cacheKey = `comparison_${tokenSymbol}_${network}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await this.makeRequest('get_pool_comparison', { token_symbol: tokenSymbol, network });
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  calculateOpportunityScore(pool: LiquidityPool): number {
    // Algoritmo para calcular score de oportunidade
    const tvlScore = Math.min(pool.tvl / 10000000, 1) * 30; // Máximo 30 pontos para TVL
    const volumeScore = Math.min(pool.volume_24h / 5000000, 1) * 25; // Máximo 25 pontos para volume
    const apyScore = Math.min(pool.apy / 50, 1) * 25; // Máximo 25 pontos para APY
    const feeScore = Math.min(pool.fees_24h / 20000, 1) * 20; // Máximo 20 pontos para taxas
    
    return tvlScore + volumeScore + apyScore + feeScore;
  }

  getRiskLevel(pool: LiquidityPool): 'LOW' | 'MEDIUM' | 'HIGH' {
    const score = this.calculateOpportunityScore(pool);
    
    if (score >= 70) return 'LOW';
    if (score >= 40) return 'MEDIUM';
    return 'HIGH';
  }

  getRecommendation(pool: LiquidityPool): string {
    const apy = pool.apy;
    const tvl = pool.tvl;
    const volume = pool.volume_24h;
    
    if (apy > 20 && tvl > 5000000 && volume > 1000000) {
      return 'Excelente oportunidade - Alta liquidez e APY atrativo';
    } else if (apy > 15 && tvl > 2000000) {
      return 'Boa oportunidade - Liquidez adequada';
    } else if (apy > 10) {
      return 'Oportunidade moderada - Considere riscos';
    } else {
      return 'Baixa oportunidade - APY baixo';
    }
  }

  async getTopOpportunities(network: string, limit: number = 10): Promise<LiquidityOpportunity[]> {
    const pools = await this.getNetworkPools(network, 'tvl', 50);
    
    const opportunities: LiquidityOpportunity[] = pools.map(pool => ({
      pool,
      opportunity_score: this.calculateOpportunityScore(pool),
      risk_level: this.getRiskLevel(pool),
      recommendation: this.getRecommendation(pool),
      potential_apy: pool.apy
    }));
    
    // Ordenar por score de oportunidade
    opportunities.sort((a, b) => b.opportunity_score - a.opportunity_score);
    
    return opportunities.slice(0, limit);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  getNetworkIcon(network: string): string {
    const icons: Record<string, string> = {
      ethereum: '🔵',
      bsc: '🟡',
      polygon: '🟣',
      arbitrum: '🔵',
      optimism: '🔴',
      base: '🔵',
      solana: '🟢',
      avalanche: '🔴',
      fantom: '🔵',
      aptos: '🟣',
      sui: '🟢'
    };
    return icons[network] || '⚫';
  }

  getDexIcon(dex: string): string {
    const icons: Record<string, string> = {
      'Uniswap V3': '🦄',
      'SushiSwap': '🍣',
      'PancakeSwap': '🥞',
      'QuickSwap': '⚡',
      'Camelot': '🐪',
      'TraderJoe': '👨‍💼',
      'Raydium': '☀️',
      'Orca': '🐋',
      'Uniswap': '🦄',
      'Balancer': '⚖️',
      'Curve': '📈',
      '1inch': '🔗',
      'dYdX': '📊',
      'GMX': '🚀',
      'Perpetual': '♾️',
      'Synthetix': '📉',
      'Aave': '💰',
      'Compound': '🏦',
      'Yearn': '📈',
      'Convex': '🔄',
      'Velodrome': '🏁',
      'Aerodrome': '✈️',
      'SpookySwap': '👻',
      'SpiritSwap': '👻',
      'Pangolin': '🦎',
      'Cetus': '🐋'
    };
    return icons[dex] || '🏦';
  }
}

export const liquidityService = new LiquidityService();
