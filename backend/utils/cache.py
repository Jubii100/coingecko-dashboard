"""
Caching utilities for the FastAPI application.
Provides TTL-based caching and CDN cache headers.
"""
import os
import functools
import hashlib
from typing import Any, Callable, Optional
from cachetools import TTLCache
from fastapi import Response
from fastapi.responses import JSONResponse


# Global cache instances
_markets_cache = TTLCache(maxsize=100, ttl=int(os.getenv("CACHE_TTL_MARKETS", 30)))
_charts_cache = TTLCache(maxsize=500, ttl=int(os.getenv("CACHE_TTL_CHARTS", 60)))
_tickers_cache = TTLCache(maxsize=200, ttl=int(os.getenv("CACHE_TTL_TICKERS", 30)))

# Cache registry for different cache types
_cache_registry = {
    "markets": _markets_cache,
    "charts": _charts_cache,
    "tickers": _tickers_cache,
    "default": TTLCache(maxsize=100, ttl=60)
}


def cache_response(
    ttl: int = 60,
    cache_type: str = "default",
    key_prefix: str = "",
    include_cdn_headers: bool = True
):
    """
    Decorator for caching FastAPI responses with TTL and CDN headers.
    
    Args:
        ttl: Cache time-to-live in seconds
        cache_type: Type of cache to use (markets, charts, tickers, default)
        key_prefix: Prefix for cache keys
        include_cdn_headers: Whether to include Vercel CDN cache headers
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Response:
            # Generate cache key from function name and arguments
            cache_key = _generate_cache_key(func.__name__, key_prefix, args, kwargs)
            
            # Get appropriate cache instance
            cache = _cache_registry.get(cache_type, _cache_registry["default"])
            
            # Try to get from cache
            if cache_key in cache:
                cached_data = cache[cache_key]
                response = JSONResponse(content=cached_data)
                if include_cdn_headers:
                    _add_cache_headers(response, ttl)
                return response
            
            # Execute function and cache result
            try:
                result = await func(*args, **kwargs)
                
                # Handle different response types
                if isinstance(result, dict):
                    response_data = result
                elif hasattr(result, 'dict'):
                    response_data = result.dict()
                else:
                    response_data = result
                
                # Cache the data
                cache[cache_key] = response_data
                
                # Create response with cache headers
                response = JSONResponse(content=response_data)
                if include_cdn_headers:
                    _add_cache_headers(response, ttl)
                
                return response
                
            except Exception as e:
                # Don't cache errors, but still return them
                raise e
        
        return wrapper
    return decorator


def _generate_cache_key(func_name: str, prefix: str, args: tuple, kwargs: dict) -> str:
    """Generate a unique cache key from function parameters."""
    # Create a string representation of all arguments
    key_parts = [func_name]
    
    if prefix:
        key_parts.append(prefix)
    
    # Add positional arguments (skip self/cls if present)
    for arg in args:
        if hasattr(arg, '__dict__'):
            continue  # Skip class instances
        key_parts.append(str(arg))
    
    # Add keyword arguments
    for key, value in sorted(kwargs.items()):
        key_parts.append(f"{key}={value}")
    
    # Create hash of the key to keep it manageable
    key_string = "|".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def _add_cache_headers(response: Response, ttl: int) -> None:
    """Add caching headers optimized for Vercel CDN."""
    # Browser cache headers
    response.headers["Cache-Control"] = f"public, max-age={ttl}, stale-while-revalidate={ttl * 2}"
    
    # Vercel CDN cache headers
    response.headers["Vercel-CDN-Cache-Control"] = f"max-age={ttl}, s-maxage={ttl}, stale-while-revalidate={ttl * 2}"
    
    # Additional headers for better caching
    response.headers["Vary"] = "Accept-Encoding"


def clear_cache(cache_type: str = "all") -> int:
    """
    Clear cache entries.
    
    Args:
        cache_type: Type of cache to clear ("all", "markets", "charts", "tickers")
        
    Returns:
        Number of entries cleared
    """
    cleared_count = 0
    
    if cache_type == "all":
        for cache in _cache_registry.values():
            cleared_count += len(cache)
            cache.clear()
    elif cache_type in _cache_registry:
        cache = _cache_registry[cache_type]
        cleared_count = len(cache)
        cache.clear()
    
    return cleared_count


def get_cache_stats() -> dict:
    """Get statistics about cache usage."""
    stats = {}
    
    for cache_name, cache in _cache_registry.items():
        stats[cache_name] = {
            "size": len(cache),
            "maxsize": cache.maxsize,
            "ttl": getattr(cache, 'ttl', None),
            "hits": getattr(cache, 'hits', 0),
            "misses": getattr(cache, 'misses', 0)
        }
    
    return stats


# Cache warming functions
async def warm_cache():
    """Pre-warm cache with common requests."""
    # This can be called on startup to pre-populate cache
    # Implementation depends on specific endpoints
    pass
