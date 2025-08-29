// API Response Types
export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  // Optional fields for pinned pairs
  _pinned?: boolean;
  exchange?: string;
  ticker_price?: number;
}

export interface MarketResponse {
  data: CoinMarketData[];
  total: number;
  page: number;
  per_page: number;
}

export interface ChartResponse {
  coin_id: string;
  vs_currency: string;
  days: number;
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface TickerData {
  base: string;
  target: string;
  market: {
    name: string;
    identifier: string;
  };
  last: number;
  volume: number;
  converted_last: Record<string, number>;
  converted_volume: Record<string, number>;
  trust_score: string;
  bid_ask_spread_percentage: number | null;
  timestamp: string;
  last_traded_at: string;
  last_fetch_at: string;
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string | null;
}

export interface TickersResponse {
  coin_id: string;
  tickers: TickerData[];
}

// UI Component Types
export interface SearchFilters {
  search: string;
  sortBy: 'market_cap' | 'price' | 'volume' | 'change';
  sortOrder: 'asc' | 'desc';
  limit: number;
}

export interface ChartTimeframe {
  label: string;
  days: number;
  interval: string;
}

export const CHART_TIMEFRAMES: ChartTimeframe[] = [
  { label: '1D', days: 1, interval: 'hourly' },
  { label: '7D', days: 7, interval: 'daily' },
  { label: '30D', days: 30, interval: 'daily' },
  { label: '90D', days: 90, interval: 'daily' },
  { label: '1Y', days: 365, interval: 'daily' },
];

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Error Types
export interface ApiError {
  error: string;
  status_code: number;
  timestamp: string;
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Chart Data Types
export interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
  marketCap?: number;
}

export interface ProcessedChartData {
  data: ChartDataPoint[];
  priceChange: number | null;
  priceChangePercentage: number | null;
  minPrice: number;
  maxPrice: number;
  avgVolume: number;
}
