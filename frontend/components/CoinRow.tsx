"use client"

import * as React from "react"
import Image from "next/image"
import { TrendingUp, TrendingDown } from "lucide-react"

import { CoinMarketData } from "@/lib/types"
import { 
  formatPrice, 
  formatMarketCap, 
  formatVolume, 
  formatPercentage, 
  getPercentageColor 
} from "@/lib/utils"

interface CoinRowProps {
  coin: CoinMarketData
  rank: number
  onClick?: () => void
}

export function CoinRow({ coin, rank, onClick }: CoinRowProps) {
  const priceChangeClass = getPercentageColor(coin.price_change_percentage_24h)
  const isPositiveChange = (coin.price_change_percentage_24h || 0) >= 0

  return (
    <tr 
      className="coin-row cursor-pointer border-b"
      onClick={onClick}
    >
      {/* Rank */}
      <td className="p-4 text-center text-muted-foreground font-medium">
        {rank}
      </td>

      {/* Coin Info */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={coin.image}
              alt={coin.name}
              fill
              className="rounded-full object-cover"
              sizes="32px"
              onError={(e) => {
                // Fallback to a placeholder if image fails to load
                const target = e.target as HTMLImageElement
                target.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=random&color=fff&size=32`
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate flex items-center gap-2">
              {coin.name}
              {coin._pinned && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Pinned
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="uppercase">{coin.symbol}</span>
              {coin._pinned && coin.exchange && (
                <span className="ml-2">• USDT pair @ {coin.exchange}</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="p-4 text-right font-mono">
        <div className="font-semibold">
          {formatPrice(coin.ticker_price || coin.current_price)}
        </div>
        {coin._pinned && coin.ticker_price && (
          <div className="text-xs text-muted-foreground">
            Live pair price
          </div>
        )}
      </td>

      {/* 24h Change */}
      <td className="p-4 text-right">
        <div className={`flex items-center justify-end gap-1 ${priceChangeClass}`}>
          {coin.price_change_percentage_24h !== null && (
            <>
              {isPositiveChange ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {formatPercentage(coin.price_change_percentage_24h)}
              </span>
            </>
          )}
          {coin.price_change_percentage_24h === null && (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
      </td>

      {/* Market Cap */}
      <td className="p-4 text-right font-mono">
        <div className="font-medium">
          {formatMarketCap(coin.market_cap)}
        </div>
        {coin.market_cap_rank && (
          <div className="text-xs text-muted-foreground">
            Rank #{coin.market_cap_rank}
          </div>
        )}
      </td>

      {/* Volume */}
      <td className="p-4 text-right font-mono">
        <div className="font-medium">
          {formatVolume(coin.total_volume)}
        </div>
      </td>

      {/* Supply */}
      <td className="p-4 text-right font-mono text-sm">
        <div>
          {coin.circulating_supply ? (
            <>
              <div className="font-medium">
                {formatVolume(coin.circulating_supply)}
              </div>
              {coin.total_supply && (
                <div className="text-xs text-muted-foreground">
                  / {formatVolume(coin.total_supply)}
                </div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
      </td>
    </tr>
  )
}

// Loading skeleton component
export function CoinRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="p-4 text-center">
        <div className="w-6 h-4 bg-muted rounded loading-shimmer" />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-full loading-shimmer" />
          <div className="space-y-2">
            <div className="w-20 h-4 bg-muted rounded loading-shimmer" />
            <div className="w-12 h-3 bg-muted rounded loading-shimmer" />
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="w-16 h-4 bg-muted rounded loading-shimmer ml-auto" />
      </td>
      <td className="p-4 text-right">
        <div className="w-14 h-4 bg-muted rounded loading-shimmer ml-auto" />
      </td>
      <td className="p-4 text-right">
        <div className="space-y-1">
          <div className="w-16 h-4 bg-muted rounded loading-shimmer ml-auto" />
          <div className="w-12 h-3 bg-muted rounded loading-shimmer ml-auto" />
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="w-16 h-4 bg-muted rounded loading-shimmer ml-auto" />
      </td>
      <td className="p-4 text-right">
        <div className="space-y-1">
          <div className="w-16 h-4 bg-muted rounded loading-shimmer ml-auto" />
          <div className="w-12 h-3 bg-muted rounded loading-shimmer ml-auto" />
        </div>
      </td>
    </tr>
  )
}
