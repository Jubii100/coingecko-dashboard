import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return 'N/A';
  
  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  } else if (price < 1) {
    return `$${price.toFixed(4)}`;
  } else if (price < 100) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatMarketCap(marketCap: number | null | undefined): string {
  if (marketCap === null || marketCap === undefined) return 'N/A';
  
  const billion = 1000000000;
  const million = 1000000;
  const thousand = 1000;
  
  if (marketCap >= billion) {
    return `$${(marketCap / billion).toFixed(2)}B`;
  } else if (marketCap >= million) {
    return `$${(marketCap / million).toFixed(2)}M`;
  } else if (marketCap >= thousand) {
    return `$${(marketCap / thousand).toFixed(2)}K`;
  } else {
    return `$${marketCap.toFixed(2)}`;
  }
}

export function formatVolume(volume: number | null | undefined): string {
  return formatMarketCap(volume); // Same formatting logic
}

export function formatPercentage(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) return 'N/A';
  
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}

export function formatSupply(supply: number | null | undefined): string {
  if (supply === null || supply === undefined) return 'N/A';
  
  const billion = 1000000000;
  const million = 1000000;
  
  if (supply >= billion) {
    return `${(supply / billion).toFixed(2)}B`;
  } else if (supply >= million) {
    return `${(supply / million).toFixed(2)}M`;
  } else {
    return supply.toLocaleString();
  }
}

export function getPercentageColor(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) return '';
  return percentage >= 0 ? 'price-positive' : 'price-negative';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatChartTimestamp(timestamp: number, days: number): string {
  const date = new Date(timestamp);
  
  if (days === 1) {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (days <= 7) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit'
    });
  } else {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  }
}

export function calculatePriceChange(prices: [number, number][]): number | null {
  if (prices.length < 2) return null;
  
  const firstPrice = prices[0][1];
  const lastPrice = prices[prices.length - 1][1];
  
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}
