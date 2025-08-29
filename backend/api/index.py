"""
FastAPI backend for CoinGecko cryptocurrency dashboard.
Provides endpoints for market data, charts, and tickers with caching.
"""
import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

try:
    from utils.cache import cache_response, clear_cache, get_cache_stats
except ImportError:
    # Fallback for Vercel serverless environment
    import sys
    import os
    import functools
    
    # Try adding the parent directory to path
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    try:
        from utils.cache import cache_response, clear_cache, get_cache_stats
    except ImportError:
        # Final fallback - minimal cache implementation
        def cache_response(ttl: int = 60, cache_type: str = "default", **kwargs):
            def decorator(func):
                @functools.wraps(func)
                async def wrapper(*args, **kwargs):
                    return await func(*args, **kwargs)
                return wrapper
            return decorator
        
        def clear_cache(cache_type: str = "all"):
            return 0
        
        def get_cache_stats():
            return {"status": "cache_disabled"}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="CoinGecko Dashboard API",
    description="FastAPI backend for cryptocurrency market data",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://localhost:3000",
        "https://*.vercel.app",
        "https://your-custom-domain.com"  # Replace with actual domain
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# CoinGecko API configuration
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

# HTTP client for CoinGecko API
http_client = httpx.AsyncClient(
    timeout=10.0,
    headers={
        "User-Agent": "CoinGecko-Dashboard/1.0",
        **({"x-cg-pro-api-key": COINGECKO_API_KEY} if COINGECKO_API_KEY else {})
    }
)

# Pydantic models for response validation
class CoinMarketData(BaseModel):
    id: str
    symbol: str
    name: str
    image: str
    current_price: Optional[float]
    market_cap: Optional[int]
    market_cap_rank: Optional[int]
    price_change_percentage_24h: Optional[float]
    total_volume: Optional[float]
    circulating_supply: Optional[float]
    total_supply: Optional[float]

class MarketResponse(BaseModel):
    data: List[CoinMarketData]
    total: int
    page: int
    per_page: int

class ChartDataPoint(BaseModel):
    timestamp: int
    price: float

class ChartResponse(BaseModel):
    coin_id: str
    vs_currency: str
    days: int
    prices: List[List[float]]
    market_caps: List[List[float]]
    total_volumes: List[List[float]]

class TickerData(BaseModel):
    base: str
    target: str
    market: Dict[str, str]
    last: float
    volume: float
    converted_last: Dict[str, float]
    converted_volume: Dict[str, float]
    trust_score: str
    bid_ask_spread_percentage: Optional[float]
    timestamp: str
    last_traded_at: str
    last_fetch_at: str
    is_anomaly: bool
    is_stale: bool
    trade_url: Optional[str]

class TickersResponse(BaseModel):
    coin_id: str
    tickers: List[TickerData]


# Utility functions
async def fetch_from_coingecko(endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Fetch data from CoinGecko API with error handling."""
    url = f"{COINGECKO_BASE_URL}/{endpoint}"
    
    try:
        response = await http_client.get(url, params=params or {})
        response.raise_for_status()
        return response.json()
    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logger.warning("CoinGecko API rate limit exceeded")
            raise HTTPException(status_code=429, detail="API rate limit exceeded")
        elif e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Coin not found")
        else:
            logger.error(f"CoinGecko API error: {e}")
            raise HTTPException(status_code=503, detail="External API error")
    
    except httpx.RequestError as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


def filter_vanry_tickers(tickers: List[Dict[str, Any]], target: str = "USDT") -> List[Dict[str, Any]]:
    """Filter and sort tickers for VANRY with special logic."""
    # Filter by target currency
    filtered = [ticker for ticker in tickers if ticker.get("target", "").upper() == target.upper()]
    
    # Sort by volume (descending) and trust score
    trust_score_order = {"green": 3, "yellow": 2, "red": 1, None: 0}
    
    def sort_key(ticker):
        volume = ticker.get("volume", 0)
        trust_score = trust_score_order.get(ticker.get("trust_score"), 0)
        return (-volume, -trust_score)  # Negative for descending order
    
    filtered.sort(key=sort_key)
    return filtered


# API Endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "cache_stats": get_cache_stats()
    }


@app.get("/api/markets", response_model=MarketResponse)
@cache_response(ttl=30, cache_type="markets", key_prefix="markets")
async def get_markets(
    limit: int = Query(default=100, ge=1, le=250, description="Number of coins to return"),
    page: int = Query(default=1, ge=1, description="Page number for pagination")
):
    """Get cryptocurrency market data with pagination."""
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": limit,
        "page": page,
        "sparkline": False,
        "price_change_percentage": "24h"
    }
    
    try:
        data = await fetch_from_coingecko("coins/markets", params)
        
        # Transform data to match our model
        coins = []
        for coin in data:
            coins.append(CoinMarketData(
                id=coin["id"],
                symbol=coin["symbol"],
                name=coin["name"],
                image=coin["image"],
                current_price=coin.get("current_price"),
                market_cap=coin.get("market_cap"),
                market_cap_rank=coin.get("market_cap_rank"),
                price_change_percentage_24h=coin.get("price_change_percentage_24h"),
                total_volume=coin.get("total_volume"),
                circulating_supply=coin.get("circulating_supply"),
                total_supply=coin.get("total_supply")
            ))
        
        # Estimate total count (CoinGecko doesn't provide this directly)
        estimated_total = 10000  # Approximate number of coins on CoinGecko
        
        return MarketResponse(
            data=coins,
            total=estimated_total,
            page=page,
            per_page=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching markets: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market data")


@app.get("/api/coins/{coin_id}/chart", response_model=ChartResponse)
@cache_response(ttl=60, cache_type="charts", key_prefix="chart")
async def get_coin_chart(
    coin_id: str = Path(..., description="CoinGecko coin ID"),
    days: int = Query(default=7, description="Number of days (1, 7, 30, 90, 365)"),
    vs_currency: str = Query(default="usd", description="Target currency")
):
    """Get historical price data for a cryptocurrency."""
    # Validate days parameter
    valid_days = [1, 7, 30, 90, 365]
    if days not in valid_days:
        raise HTTPException(status_code=400, detail=f"Days must be one of: {valid_days}")
    
    params = {
        "vs_currency": vs_currency,
        "days": days,
        "interval": "daily" if days > 1 else "hourly"
    }
    
    try:
        data = await fetch_from_coingecko(f"coins/{coin_id}/market_chart", params)
        
        return ChartResponse(
            coin_id=coin_id,
            vs_currency=vs_currency,
            days=days,
            prices=data.get("prices", []),
            market_caps=data.get("market_caps", []),
            total_volumes=data.get("total_volumes", [])
        )
    
    except Exception as e:
        logger.error(f"Error fetching chart for {coin_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chart data")


@app.get("/api/tickers/{coin_id}", response_model=TickersResponse)
@cache_response(ttl=30, cache_type="tickers", key_prefix="tickers")
async def get_coin_tickers(
    coin_id: str = Path(..., description="CoinGecko coin ID"),
    target: str = Query(default="USDT", description="Target currency filter")
):
    """Get trading pairs data for a cryptocurrency."""
    params = {
        "include_exchange_logo": False,
        "page": 1,
        "depth": True
    }
    
    try:
        data = await fetch_from_coingecko(f"coins/{coin_id}/tickers", params)
        tickers_data = data.get("tickers", [])
        
        # Apply special filtering for VANRY or any coin
        if coin_id.lower() == "vanry" or target.upper() == "USDT":
            tickers_data = filter_vanry_tickers(tickers_data, target)
        
        # Transform tickers data
        tickers = []
        for ticker in tickers_data:
            try:
                tickers.append(TickerData(
                    base=ticker.get("base", ""),
                    target=ticker.get("target", ""),
                    market={
                        "name": ticker.get("market", {}).get("name", ""),
                        "identifier": ticker.get("market", {}).get("identifier", "")
                    },
                    last=float(ticker.get("last", 0)),
                    volume=float(ticker.get("volume", 0)),
                    converted_last=ticker.get("converted_last", {}),
                    converted_volume=ticker.get("converted_volume", {}),
                    trust_score=ticker.get("trust_score", ""),
                    bid_ask_spread_percentage=ticker.get("bid_ask_spread_percentage"),
                    timestamp=ticker.get("timestamp", ""),
                    last_traded_at=ticker.get("last_traded_at", ""),
                    last_fetch_at=ticker.get("last_fetch_at", ""),
                    is_anomaly=ticker.get("is_anomaly", False),
                    is_stale=ticker.get("is_stale", False),
                    trade_url=ticker.get("trade_url")
                ))
            except (ValueError, TypeError) as e:
                logger.warning(f"Skipping invalid ticker data: {e}")
                continue
        
        return TickersResponse(
            coin_id=coin_id,
            tickers=tickers
        )
    
    except Exception as e:
        logger.error(f"Error fetching tickers for {coin_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ticker data")


# Admin endpoints
@app.post("/api/admin/clear-cache")
async def clear_api_cache(cache_type: str = Query(default="all", description="Cache type to clear")):
    """Clear cache entries (admin endpoint)."""
    cleared_count = clear_cache(cache_type)
    return {
        "message": f"Cleared {cleared_count} cache entries",
        "cache_type": cache_type,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/admin/cache-stats")
async def get_cache_statistics():
    """Get cache usage statistics (admin endpoint)."""
    return {
        "stats": get_cache_stats(),
        "timestamp": datetime.utcnow().isoformat()
    }


# Application lifecycle - simplified for Vercel
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    try:
        logger.info("Starting CoinGecko Dashboard API")
        logger.info(f"CoinGecko API Key configured: {'Yes' if COINGECKO_API_KEY else 'No'}")
    except Exception as e:
        logger.error(f"Startup error: {e}")


# Root endpoint for Vercel
@app.get("/")
async def root():
    """Root endpoint redirect."""
    return {
        "message": "CoinGecko Dashboard API",
        "docs": "/api/docs",
        "health": "/api/health"
    }
