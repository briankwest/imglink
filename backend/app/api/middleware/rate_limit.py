"""
Rate limiting middleware for FastAPI.
"""
from typing import Optional, Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services.rate_limiter import rate_limiter, RateLimitExceeded
from app.api.deps import get_current_user_optional
from app.core.database import get_db
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to apply rate limiting to API endpoints.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json", "/"]:
            return await call_next(request)
        
        # Skip static files
        if request.url.path.startswith("/uploads"):
            return await call_next(request)
        
        # Get identifier (IP address or user ID)
        client_ip = request.client.host if request.client else "unknown"
        
        # Try to get authenticated user
        user_id = None
        user_tier = "anonymous"
        
        try:
            # Get authorization header
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                # Try to get user from token without raising exceptions
                from app.core.security import decode_token
                from jose import JWTError
                
                token = auth_header.split(" ")[1]
                try:
                    payload = decode_token(token)
                    username = payload.get("sub")
                    if username:
                        # Get user from database
                        db = next(get_db())
                        from app.models.user import User
                        user = db.query(User).filter(User.username == username).first()
                        if user and user.is_active:
                            user_id = user.id
                            user_tier = user.tier or "standard"
                        db.close()
                except (JWTError, Exception):
                    # Invalid token, treat as anonymous
                    pass
        except Exception as e:
            logger.debug(f"Error getting user for rate limiting: {e}")
        
        # Use user ID as identifier if authenticated, otherwise use IP
        identifier = f"user:{user_id}" if user_id else f"ip:{client_ip}"
        
        # Get endpoint path
        endpoint = request.url.path
        
        # Get rate limits for this endpoint and user tier
        limits = rate_limiter.get_endpoint_limits(endpoint, user_tier)
        
        # Check rate limit
        allowed, metadata = rate_limiter.check_rate_limit(
            identifier=identifier,
            endpoint=endpoint,
            limit=limits["requests"],
            window=limits["window"],
            user_id=user_id
        )
        
        if not allowed:
            # Rate limit exceeded
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded. Try again in {metadata['retry_after']} seconds."
                },
                headers={
                    "X-RateLimit-Limit": str(metadata["limit"]),
                    "X-RateLimit-Remaining": str(metadata["remaining"]),
                    "X-RateLimit-Reset": str(metadata["reset"]),
                    "Retry-After": str(metadata["retry_after"])
                }
            )
        
        # Process request and add rate limit headers to response
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(metadata["limit"])
        response.headers["X-RateLimit-Remaining"] = str(metadata["remaining"])
        response.headers["X-RateLimit-Reset"] = str(metadata["reset"])
        
        return response