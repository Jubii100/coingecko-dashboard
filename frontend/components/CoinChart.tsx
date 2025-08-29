"use client"

import * as React from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartResponse, CHART_TIMEFRAMES } from "@/lib/types"
import { 
  formatPrice, 
  formatChartTimestamp, 
  calculatePriceChange,
  getPercentageColor 
} from "@/lib/utils"

interface CoinChartProps {
  coinId: string
  coinName: string
  chartData: ChartResponse | null
  selectedTimeframe: number
  onTimeframeChange: (days: number) => void
  isLoading?: boolean
  error?: string | null
}

export function CoinChart({
  coinId,
  coinName,
  chartData,
  selectedTimeframe,
  onTimeframeChange,
  isLoading = false,
  error = null
}: CoinChartProps) {
  const chartPoints = React.useMemo(() => {
    if (!chartData?.prices) return []
    
    return chartData.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
      formattedTime: formatChartTimestamp(timestamp, chartData.days)
    }))
  }, [chartData])

  const priceChange = React.useMemo(() => {
    if (!chartData?.prices) return null
    return calculatePriceChange(chartData.prices)
  }, [chartData])

  const currentPrice = chartPoints[chartPoints.length - 1]?.price
  const priceChangeClass = getPercentageColor(priceChange)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <p className="font-medium">{data.formattedTime}</p>
          <p className="text-primary">
            Price: {formatPrice(data.price)}
          </p>
        </div>
      )
    }
    return null
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {coinName} Price Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-muted-foreground mb-2">
              Failed to load chart data
            </div>
            <div className="text-sm text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {coinName} Price Chart
          </div>
          {currentPrice && (
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatPrice(currentPrice)}
              </div>
              {priceChange !== null && (
                <div className={`flex items-center gap-1 text-sm ${priceChangeClass}`}>
                  {priceChange >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeframe Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CHART_TIMEFRAMES.map((timeframe) => (
            <Button
              key={timeframe.days}
              variant={selectedTimeframe === timeframe.days ? "default" : "outline"}
              size="sm"
              onClick={() => onTimeframeChange(timeframe.days)}
              disabled={isLoading}
            >
              {timeframe.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-64 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          ) : chartPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor="hsl(var(--primary))" 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor="hsl(var(--primary))" 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="formattedTime"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatPrice(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">No chart data available</div>
            </div>
          )}
        </div>

        {/* Chart Info */}
        {chartData && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {chartData.days} day{chartData.days !== 1 ? 's' : ''} of price data
            {chartData.prices.length > 0 && (
              <> • {chartData.prices.length} data points</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Loading skeleton for the chart
export function CoinChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded loading-shimmer" />
            <div className="w-32 h-6 bg-muted rounded loading-shimmer" />
          </div>
          <div className="text-right space-y-2">
            <div className="w-24 h-8 bg-muted rounded loading-shimmer ml-auto" />
            <div className="w-16 h-4 bg-muted rounded loading-shimmer ml-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-12 h-8 bg-muted rounded loading-shimmer" />
          ))}
        </div>
        <div className="h-64 w-full bg-muted rounded loading-shimmer" />
        <div className="mt-4 text-center">
          <div className="w-48 h-4 bg-muted rounded loading-shimmer mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}
