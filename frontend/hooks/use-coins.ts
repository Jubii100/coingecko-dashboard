"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchMarkets, fetchCoinChart, fetchCoinTickers } from "@/lib/api"
import { SearchFilters } from "@/lib/types"

export function useCoins(filters: Partial<SearchFilters> = {}) {
  return useQuery({
    queryKey: ['coins', 'markets', filters],
    queryFn: () => fetchMarkets(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  })
}

export function useCoinChart(coinId: string, days: number = 7) {
  return useQuery({
    queryKey: ['coins', 'chart', coinId, days],
    queryFn: () => fetchCoinChart(coinId, days),
    enabled: !!coinId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCoinTickers(coinId: string, target: string = 'USDT') {
  return useQuery({
    queryKey: ['coins', 'tickers', coinId, target],
    queryFn: () => fetchCoinTickers(coinId, target),
    enabled: !!coinId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })
}
