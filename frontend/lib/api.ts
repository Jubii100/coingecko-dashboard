import { MarketResponse, ChartResponse, TickersResponse, SearchFilters } from './types';

// Use relative URLs in production, localhost in development
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In production (Vercel), use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  
  // In development, use localhost
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.error || errorMessage;
      } catch {
        // If error response is not JSON, use the text
        errorMessage = errorText || errorMessage;
      }

      throw new ApiError(response.status, response.statusText, errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(503, 'Service Unavailable', 'Unable to connect to the API. Please check your connection.');
    }
    
    throw new ApiError(500, 'Internal Error', error instanceof Error ? error.message : 'An unexpected error occurred');
  }
}

export async function fetchMarkets(filters: Partial<SearchFilters> = {}): Promise<MarketResponse> {
  const params = new URLSearchParams();
  
  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }
  
  const url = `${API_BASE_URL}/api/markets${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchWithErrorHandling<MarketResponse>(url);
}

export async function fetchCoinChart(
  coinId: string,
  days: number = 7,
  vsCurrency: string = 'usd'
): Promise<ChartResponse> {
  const params = new URLSearchParams({
    days: days.toString(),
    vs_currency: vsCurrency,
  });
  
  const url = `${API_BASE_URL}/api/coins/${coinId}/chart?${params.toString()}`;
  return fetchWithErrorHandling<ChartResponse>(url);
}

export async function fetchCoinTickers(
  coinId: string,
  target: string = 'USDT'
): Promise<TickersResponse> {
  const params = new URLSearchParams({
    target,
  });
  
  const url = `${API_BASE_URL}/api/tickers/${coinId}?${params.toString()}`;
  return fetchWithErrorHandling<TickersResponse>(url);
}

export async function fetchHealthCheck(): Promise<{ status: string; timestamp: string }> {
  const url = `${API_BASE_URL}/api/health`;
  return fetchWithErrorHandling(url);
}

// Client-side filtering and sorting utilities
export function filterCoins(coins: any[], searchTerm: string): any[] {
  if (!searchTerm.trim()) return coins;
  
  const search = searchTerm.toLowerCase();
  return coins.filter(coin => 
    coin.name.toLowerCase().includes(search) ||
    coin.symbol.toLowerCase().includes(search) ||
    coin.id.toLowerCase().includes(search)
  );
}

export function sortCoins(coins: any[], sortBy: string, sortOrder: 'asc' | 'desc'): any[] {
  const sorted = [...coins].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'market_cap':
        aValue = a.market_cap || 0;
        bValue = b.market_cap || 0;
        break;
      case 'price':
        aValue = a.current_price || 0;
        bValue = b.current_price || 0;
        break;
      case 'volume':
        aValue = a.total_volume || 0;
        bValue = b.total_volume || 0;
        break;
      case 'change':
        aValue = a.price_change_percentage_24h || 0;
        bValue = b.price_change_percentage_24h || 0;
        break;
      default:
        aValue = a.market_cap_rank || Infinity;
        bValue = b.market_cap_rank || Infinity;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return sorted;
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500;
}

export function isRateLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}
