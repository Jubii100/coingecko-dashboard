"use client"

import * as React from "react"
import { useState, useMemo } from "react"

// import { ThemeToggle } from "@/components/ThemeToggle"
import { SearchAndFilters } from "@/components/SearchAndFilters"
import { CoinRow, CoinRowSkeleton } from "@/components/CoinRow"
import { CoinChart, CoinChartSkeleton } from "@/components/CoinChart"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useCoins, useCoinChart, useCoinTickers } from "@/hooks/use-coins"
import { SearchFilters, CoinMarketData } from "@/lib/types"
import { filterCoins, sortCoins, getErrorMessage } from "@/lib/api"
import { Coins, TrendingUp, AlertCircle, RefreshCw } from "lucide-react"

const initialFilters: SearchFilters = {
  search: '',
  sortBy: 'market_cap',
  sortOrder: 'desc',
  limit: 100
}

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [selectedCoin, setSelectedCoin] = useState<CoinMarketData | null>(null)
  const [chartTimeframe, setChartTimeframe] = useState<number>(7)
  
  // Fetch market data
  const { 
    data: marketData, 
    isLoading: isLoadingMarkets, 
    error: marketsError,
    refetch: refetchMarkets
  } = useCoins({ limit: filters.limit })

  // Fetch chart data for selected coin
  const { 
    data: chartData, 
    isLoading: isLoadingChart, 
    error: chartError 
  } = useCoinChart(selectedCoin?.id || '', chartTimeframe)

  // Fetch tickers for selected coin (especially useful for VANRY)
  const { 
    data: tickersData, 
    isLoading: isLoadingTickers 
  } = useCoinTickers(selectedCoin?.id || '', 'USDT')

  // Fetch TRON/USDT ticker data for pinned display
  const { 
    data: tronTickerData, 
    isLoading: isLoadingTronTicker 
  } = useCoinTickers('tron', 'USDT')

  // Process and filter coins
  const processedCoins = useMemo(() => {
    if (!marketData?.data) return []
    
    let coins = [...marketData.data]
    
    // Find TRON coin in the market data
    const tronCoin = coins.find(coin => coin.id === 'tron')
    
    // Create pinned TRON/USDT entry if we have both market data and ticker data
    let pinnedTron: CoinMarketData | null = null
    if (tronCoin && tronTickerData?.tickers && tronTickerData.tickers.length > 0) {
      const bestTicker = tronTickerData.tickers[0] // First ticker should be the best (highest volume)
      pinnedTron = {
        ...tronCoin,
        name: 'TRX/USDT',
        _pinned: true,
        exchange: bestTicker.market.name,
        ticker_price: bestTicker.last,
      }
    }
    
    // Remove the original TRON entry to avoid duplication
    coins = coins.filter(coin => coin.id !== 'tron')
    
    // Apply search filter
    if (filters.search) {
      coins = filterCoins(coins, filters.search)
      // Also check if search matches TRX/USDT
      if (pinnedTron) {
        const searchLower = filters.search.toLowerCase()
        const matchesTron = 
          'trx'.includes(searchLower) ||
          'tron'.includes(searchLower) ||
          'usdt'.includes(searchLower) ||
          pinnedTron.symbol.toLowerCase().includes(searchLower)
        if (!matchesTron) {
          pinnedTron = null
        }
      }
    }
    
    // Apply sorting
    coins = sortCoins(coins, filters.sortBy, filters.sortOrder)
    
    // Prepend pinned TRX/USDT if it exists
    return pinnedTron ? [pinnedTron, ...coins] : coins
  }, [marketData?.data, filters, tronTickerData])

  const handleCoinClick = (coin: CoinMarketData) => {
    setSelectedCoin(coin)
    setChartTimeframe(7) // Reset to 7 days when opening new coin
  }

  const handleCloseModal = () => {
    setSelectedCoin(null)
  }

  const handleRefresh = () => {
    refetchMarkets()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CoinGecko Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time cryptocurrency market data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoadingMarkets}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingMarkets ? 'animate-spin' : ''}`} />
              </Button>
              {/* <ThemeToggle /> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SearchAndFilters
              filters={filters}
              onFiltersChange={setFilters}
              isLoading={isLoadingMarkets}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {marketsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage(marketsError)}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-2"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Market Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-left font-medium">#</th>
                    <th className="p-4 text-left font-medium">Coin</th>
                    <th className="p-4 text-right font-medium">Price</th>
                    <th className="p-4 text-right font-medium">24h Change</th>
                    <th className="p-4 text-right font-medium">Market Cap</th>
                    <th className="p-4 text-right font-medium">Volume</th>
                    <th className="p-4 text-right font-medium">Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingMarkets ? (
                    // Loading skeletons
                    Array.from({ length: 10 }).map((_, index) => (
                      <CoinRowSkeleton key={index} />
                    ))
                  ) : processedCoins.length > 0 ? (
                    // Actual coin data
                    processedCoins.map((coin, index) => (
                      <CoinRow
                        key={coin.id}
                        coin={coin}
                        rank={coin.market_cap_rank || index + 1}
                        onClick={() => handleCoinClick(coin)}
                      />
                    ))
                  ) : (
                    // No results
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        {filters.search ? (
                          <>No cryptocurrencies found matching "{filters.search}"</>
                        ) : (
                          <>No cryptocurrency data available</>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {marketData && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {processedCoins.length} of {marketData.total.toLocaleString()} cryptocurrencies
            {processedCoins.some(coin => coin._pinned) && (
              <> (including pinned TRX/USDT pair)</>
            )}
            {filters.search && (
              <> matching "{filters.search}"</>
            )}
          </div>
        )}
      </main>

      {/* Coin Detail Modal */}
      <Dialog open={!!selectedCoin} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCoin?._pinned 
                ? `TRON (${selectedCoin.symbol.toUpperCase()}) - Detail View`
                : `${selectedCoin?.name} (${selectedCoin?.symbol.toUpperCase()})`
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Chart */}
            {selectedCoin && (
              <>
                {isLoadingChart ? (
                  <CoinChartSkeleton />
                ) : (
                  <CoinChart
                    coinId={selectedCoin.id}
                    coinName={selectedCoin._pinned ? 'TRON' : selectedCoin.name}
                    chartData={chartData || null}
                    selectedTimeframe={chartTimeframe}
                    onTimeframeChange={setChartTimeframe}
                    isLoading={isLoadingChart}
                    error={chartError ? getErrorMessage(chartError) : null}
                  />
                )}

                {/* Trading Pairs (especially for VANRY) */}
                {tickersData && tickersData.tickers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Trading Pairs (USDT)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tickersData.tickers.slice(0, 5).map((ticker, index) => (
                          <div 
                            key={`${ticker.market.identifier}-${ticker.base}-${ticker.target}`}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <div className="font-medium">
                                {ticker.market.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {ticker.base}/{ticker.target}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-medium">
                                ${ticker.last.toFixed(6)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Vol: ${ticker.converted_volume.usd?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
