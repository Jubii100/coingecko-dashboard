# API Documentation

## Overview

The FastAPI backend provides three main endpoints for cryptocurrency data, all with built-in caching and CDN optimization.

## Base URL

- Development: `http://localhost:8000`
- Production: `https://your-app.vercel.app`

## Authentication

No authentication required. The API uses CoinGecko's public API endpoints.

## Rate Limiting & Caching

- **TTL Cache**: 30s for markets, 60s for charts, 30s for tickers
- **CDN Cache**: Vercel CDN with `s-maxage` headers
- **CoinGecko Limits**: Respects CoinGecko API rate limits

## Endpoints

### GET /api/markets

Returns a list of cryptocurrencies with market data.

**Parameters:**
- `limit` (optional): Number of coins to return (default: 100, max: 250)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "data": [
    {
      "id": "bitcoin",
      "symbol": "btc",
      "name": "Bitcoin",
      "image": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      "current_price": 45000.50,
      "market_cap": 850000000000,
      "market_cap_rank": 1,
      "price_change_percentage_24h": 2.5,
      "total_volume": 25000000000,
      "circulating_supply": 19500000,
      "total_supply": 21000000
    }
  ],
  "total": 10000,
  "page": 1,
  "per_page": 100
}
```

**Cache:** 30 seconds TTL + CDN

### GET /api/coins/{coin_id}/chart

Returns historical price data for charts.

**Parameters:**
- `coin_id` (required): CoinGecko coin ID (e.g., "bitcoin", "ethereum")
- `days` (optional): Number of days of data (1, 7, 30, 90, 365) (default: 7)
- `vs_currency` (optional): Target currency (default: "usd")

**Response:**
```json
{
  "coin_id": "bitcoin",
  "vs_currency": "usd",
  "days": 7,
  "prices": [
    [1640995200000, 47000.50],
    [1641081600000, 47500.25],
    ...
  ],
  "market_caps": [
    [1640995200000, 890000000000],
    [1641081600000, 895000000000],
    ...
  ],
  "total_volumes": [
    [1640995200000, 25000000000],
    [1641081600000, 26000000000],
    ...
  ]
}
```

**Cache:** 60 seconds TTL + CDN

### GET /api/tickers/{coin_id}

Returns trading pairs data, filtered for USDT pairs and sorted by volume.

**Parameters:**
- `coin_id` (required): CoinGecko coin ID
- `target` (optional): Target currency filter (default: "USDT")

**Response:**
```json
{
  "coin_id": "vanry",
  "tickers": [
    {
      "base": "VANRY",
      "target": "USDT",
      "market": {
        "name": "Binance",
        "identifier": "binance"
      },
      "last": 0.125,
      "volume": 15000000,
      "converted_last": {
        "usd": 0.125
      },
      "converted_volume": {
        "usd": 1875000
      },
      "trust_score": "green",
      "bid_ask_spread_percentage": 0.08,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "last_traded_at": "2024-01-15T10:30:00.000Z",
      "last_fetch_at": "2024-01-15T10:30:15.000Z",
      "is_anomaly": false,
      "is_stale": false,
      "trade_url": "https://www.binance.com/en/trade/VANRY_USDT"
    }
  ]
}
```

**Special Logic for VANRY:**
- Filters tickers by `target=USDT`
- Sorts by volume (descending) then trust_score
- Prioritizes high-volume, trusted exchanges

**Cache:** 30 seconds TTL + CDN

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status_code": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Common Error Codes:**
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (coin not found)
- `429`: Rate Limited (CoinGecko API limits)
- `500`: Internal Server Error
- `503`: Service Unavailable (CoinGecko API down)

## Data Sources

All data is sourced from [CoinGecko API](https://www.coingecko.com/en/api):
- Market data: `/coins/markets` endpoint
- Chart data: `/coins/{id}/market_chart` endpoint  
- Ticker data: `/coins/{id}/tickers` endpoint

## Caching Strategy

### TTL Cache (Server-side)
- Uses `cachetools.TTLCache` for in-memory caching
- Prevents excessive API calls to CoinGecko
- Different TTL values based on data volatility

### CDN Cache (Vercel)
- `Cache-Control` headers for browser caching
- `Vercel-CDN-Cache-Control` for CDN edge caching
- Stale-while-revalidate strategy for better UX

### Cache Headers Example:
```
Cache-Control: public, max-age=30, stale-while-revalidate=60
Vercel-CDN-Cache-Control: max-age=30, s-maxage=30, stale-while-revalidate=60
```

## Performance Optimizations

1. **Payload Minimization**: Only essential fields returned
2. **Compression**: Gzip compression enabled
3. **Async Processing**: Non-blocking HTTP requests
4. **Connection Pooling**: Reused HTTP connections
5. **Error Handling**: Graceful degradation on API failures
