"""
Rate limiting service using Redis.
"""
import time
from typing import Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
import json
import redis
from fastapi import Request, HTTPException, status

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitExceeded(HTTPException):
    """Custom exception for rate limit exceeded."""
    def __init__(self, retry_after: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )


class RateLimiter:
    """Redis-based rate limiter with sliding window algorithm."""
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis."""
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("Connected to Redis for rate limiting")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Rate limiting disabled.")
            self.redis_client = None
    
    def _get_key(self, identifier: str, endpoint: str) -> str:
        """Generate Redis key for rate limiting."""
        return f"rate_limit:{endpoint}:{identifier}"
    
    def _get_user_tier(self, user_id: Optional[int], user_tier: Optional[str] = None) -> str:
        """Get user tier for rate limiting."""
        if not user_id:
            return "anonymous"
        
        # If tier is provided, use it
        if user_tier:
            return user_tier
        
        # Default to standard for authenticated users
        return "standard"
    
    def check_rate_limit(
        self, 
        identifier: str, 
        endpoint: str,
        limit: int,
        window: int = 3600,  # Default 1 hour window
        user_id: Optional[int] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if request is within rate limit.
        
        Args:
            identifier: Unique identifier (IP address or user ID)
            endpoint: API endpoint being accessed
            limit: Maximum number of requests allowed
            window: Time window in seconds
            user_id: Optional user ID for tier-based limits
            
        Returns:
            Tuple of (is_allowed, metadata)
        """
        if not self.redis_client:
            # Redis not available, allow all requests
            return True, {"remaining": limit, "reset": 0}
        
        try:
            # Use sliding window algorithm
            now = time.time()
            window_start = now - window
            key = self._get_key(identifier, endpoint)
            
            # Remove old entries
            self.redis_client.zremrangebyscore(key, 0, window_start)
            
            # Count current requests in window
            current_count = self.redis_client.zcard(key)
            
            # Calculate reset time (when oldest request expires)
            oldest = self.redis_client.zrange(key, 0, 0, withscores=True)
            if oldest:
                oldest_timestamp = oldest[0][1]
                reset_time = int(oldest_timestamp + window)
                # Debug log if reset time seems wrong
                if reset_time - now > window * 2:
                    logger.warning(f"Unusual reset time detected: oldest={oldest_timestamp}, now={now}, window={window}, reset={reset_time}")
            else:
                reset_time = int(now + window)
            
            remaining = max(0, limit - current_count)
            
            if current_count < limit:
                # Add current request with timestamp as score
                # Use a unique member name to avoid overwriting
                self.redis_client.zadd(key, {f"req:{now}:{current_count}": now})
                self.redis_client.expire(key, window + 60)  # Add buffer to TTL
                
                return True, {
                    "limit": limit,
                    "remaining": remaining - 1,
                    "reset": reset_time,
                    "retry_after": None
                }
            else:
                # Rate limit exceeded
                retry_after = reset_time - int(now)
                return False, {
                    "limit": limit,
                    "remaining": 0,
                    "reset": reset_time,
                    "retry_after": retry_after
                }
                
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            # On error, allow request but log it
            return True, {"remaining": limit, "reset": 0}
    
    def get_endpoint_limits(self, endpoint: str, user_tier: str = "anonymous", db=None) -> Dict[str, int]:
        """
        Get rate limits for an endpoint based on user tier.
        
        Returns dict with 'requests' and 'window' keys.
        """
        # Try to get from database first
        if db:
            try:
                from app.models.rate_limit import RateLimit
                
                # Try exact endpoint match
                rate_limit = db.query(RateLimit).filter(
                    RateLimit.endpoint == endpoint,
                    RateLimit.tier == user_tier
                ).first()
                
                # If not found, try default
                if not rate_limit:
                    rate_limit = db.query(RateLimit).filter(
                        RateLimit.endpoint == "default",
                        RateLimit.tier == user_tier
                    ).first()
                
                if rate_limit:
                    return {
                        "requests": rate_limit.requests,
                        "window": rate_limit.window
                    }
            except Exception as e:
                logger.warning(f"Failed to get rate limits from database: {e}")
        
        # Fallback to hardcoded limits
        limits = {
            # Authentication endpoints
            "/api/v1/auth/login": {
                "anonymous": {"requests": 5, "window": 300},  # 5 per 5 minutes
                "standard": {"requests": 10, "window": 300},
                "premium": {"requests": 20, "window": 300}
            },
            "/api/v1/auth/register": {
                "anonymous": {"requests": 3, "window": 3600},  # 3 per hour
                "standard": {"requests": 5, "window": 3600},
                "premium": {"requests": 10, "window": 3600}
            },
            
            # Image upload endpoint
            "/api/v1/images": {
                "anonymous": {"requests": 10, "window": 3600},  # 10 per hour
                "standard": {"requests": 100, "window": 3600},  # 100 per hour
                "premium": {"requests": 1000, "window": 3600}   # 1000 per hour
            },
            
            # General API endpoints
            "default": {
                "anonymous": {"requests": 100, "window": 3600},  # 100 per hour
                "standard": {"requests": 1000, "window": 3600},  # 1000 per hour
                "premium": {"requests": 10000, "window": 3600}   # 10000 per hour
            }
        }
        
        # Get limits for specific endpoint or use default
        endpoint_limits = limits.get(endpoint, limits["default"])
        tier_limits = endpoint_limits.get(user_tier, endpoint_limits["anonymous"])
        
        return tier_limits
    
    def clear_limits(self, identifier: str = None, endpoint: str = None):
        """Clear rate limits for debugging/admin purposes."""
        if not self.redis_client:
            return
        
        try:
            if identifier and endpoint:
                # Clear specific endpoint for identifier
                key = self._get_key(identifier, endpoint)
                self.redis_client.delete(key)
            elif identifier:
                # Clear all endpoints for identifier
                keys = self.redis_client.keys(f"rate_limit:*:{identifier}")
                if keys:
                    self.redis_client.delete(*keys)
            else:
                # Clear all rate limits
                keys = self.redis_client.keys("rate_limit:*")
                if keys:
                    self.redis_client.delete(*keys)
            
            logger.info(f"Cleared rate limits: identifier={identifier}, endpoint={endpoint}")
        except Exception as e:
            logger.error(f"Error clearing rate limits: {e}")
    
    def get_stats(self, identifier: str, endpoint: str = "*") -> Dict[str, Any]:
        """Get rate limiting statistics for an identifier."""
        if not self.redis_client:
            return {}
        
        try:
            if endpoint == "*":
                # Get all endpoints for this identifier
                keys = self.redis_client.keys(f"rate_limit:*:{identifier}")
            else:
                keys = [self._get_key(identifier, endpoint)]
            
            stats = {}
            for key in keys:
                endpoint_name = key.split(":")[1]
                count = self.redis_client.zcard(key)
                if count > 0:
                    stats[endpoint_name] = {
                        "count": count,
                        "ttl": self.redis_client.ttl(key)
                    }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting rate limit stats: {e}")
            return {}


# Global rate limiter instance
rate_limiter = RateLimiter()