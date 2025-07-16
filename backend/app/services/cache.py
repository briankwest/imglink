import json
import pickle
from typing import Optional, Any, Union
from functools import wraps
import hashlib
import time
from datetime import datetime, timedelta

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.core.config import settings


class CacheService:
    """Service for caching data with Redis fallback to in-memory"""
    
    def __init__(self):
        self.redis_client = None
        self.memory_cache = {}
        self.memory_cache_ttl = {}
        
        if REDIS_AVAILABLE and hasattr(settings, 'REDIS_URL'):
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL)
                # Test connection
                self.redis_client.ping()
                print("✅ Redis cache connected")
            except Exception as e:
                print(f"❌ Redis connection failed: {e}")
                self.redis_client = None
        
        if not self.redis_client:
            print("📝 Using in-memory cache")
    
    def _generate_key(self, key: str, prefix: str = "imglink") -> str:
        """Generate a cache key with prefix"""
        return f"{prefix}:{key}"
    
    def _serialize_value(self, value: Any) -> bytes:
        """Serialize value for storage"""
        try:
            # Try JSON first for simple types
            return json.dumps(value).encode('utf-8')
        except (TypeError, ValueError):
            # Fall back to pickle for complex objects
            return pickle.dumps(value)
    
    def _deserialize_value(self, data: bytes) -> Any:
        """Deserialize value from storage"""
        try:
            # Try JSON first
            return json.loads(data.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Fall back to pickle
            return pickle.loads(data)
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set a value in cache with TTL in seconds"""
        cache_key = self._generate_key(key)
        
        if self.redis_client:
            try:
                serialized = self._serialize_value(value)
                return self.redis_client.setex(cache_key, ttl, serialized)
            except Exception as e:
                print(f"Redis set error: {e}")
                # Fall through to memory cache
        
        # Memory cache fallback
        self.memory_cache[cache_key] = value
        self.memory_cache_ttl[cache_key] = time.time() + ttl
        return True
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache"""
        cache_key = self._generate_key(key)
        
        if self.redis_client:
            try:
                data = self.redis_client.get(cache_key)
                if data:
                    return self._deserialize_value(data)
            except Exception as e:
                print(f"Redis get error: {e}")
                # Fall through to memory cache
        
        # Memory cache fallback
        if cache_key in self.memory_cache:
            # Check TTL
            if time.time() < self.memory_cache_ttl.get(cache_key, 0):
                return self.memory_cache[cache_key]
            else:
                # Expired
                self.delete(key)
        
        return None
    
    def delete(self, key: str) -> bool:
        """Delete a value from cache"""
        cache_key = self._generate_key(key)
        
        if self.redis_client:
            try:
                self.redis_client.delete(cache_key)
            except Exception as e:
                print(f"Redis delete error: {e}")
        
        # Memory cache
        self.memory_cache.pop(cache_key, None)
        self.memory_cache_ttl.pop(cache_key, None)
        
        return True
    
    def clear_memory_cache(self):
        """Clear expired entries from memory cache"""
        current_time = time.time()
        expired_keys = [
            key for key, ttl in self.memory_cache_ttl.items()
            if current_time >= ttl
        ]
        
        for key in expired_keys:
            self.memory_cache.pop(key, None)
            self.memory_cache_ttl.pop(key, None)
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate cache keys matching pattern"""
        if self.redis_client:
            try:
                keys = self.redis_client.keys(f"{self._generate_key(pattern)}*")
                if keys:
                    self.redis_client.delete(*keys)
            except Exception as e:
                print(f"Redis pattern invalidation error: {e}")
        
        # Memory cache pattern matching
        cache_pattern = self._generate_key(pattern)
        keys_to_delete = [
            key for key in self.memory_cache.keys()
            if key.startswith(cache_pattern)
        ]
        
        for key in keys_to_delete:
            self.memory_cache.pop(key, None)
            self.memory_cache_ttl.pop(key, None)


# Global cache instance
cache_service = CacheService()


def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix or func.__name__]
            
            # Add positional args to key
            for arg in args:
                if isinstance(arg, (str, int, float, bool)):
                    key_parts.append(str(arg))
                else:
                    # Hash complex objects
                    key_parts.append(hashlib.md5(str(arg).encode()).hexdigest()[:8])
            
            # Add keyword args to key
            for k, v in sorted(kwargs.items()):
                if isinstance(v, (str, int, float, bool)):
                    key_parts.append(f"{k}:{v}")
                else:
                    key_parts.append(f"{k}:{hashlib.md5(str(v).encode()).hexdigest()[:8]}")
            
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """Helper function to invalidate cache patterns"""
    cache_service.invalidate_pattern(pattern)


def get_cache_stats() -> dict:
    """Get cache statistics"""
    stats = {
        "redis_available": cache_service.redis_client is not None,
        "memory_cache_size": len(cache_service.memory_cache),
    }
    
    if cache_service.redis_client:
        try:
            info = cache_service.redis_client.info()
            stats.update({
                "redis_used_memory": info.get("used_memory_human", "Unknown"),
                "redis_connected_clients": info.get("connected_clients", 0),
                "redis_total_commands": info.get("total_commands_processed", 0),
            })
        except Exception as e:
            stats["redis_error"] = str(e)
    
    return stats