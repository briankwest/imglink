"""
Rate limiting API endpoints.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.services.rate_limiter import rate_limiter

router = APIRouter()


@router.get("/status", response_model=Dict[str, Any])
def get_rate_limit_status(
    request: Request,
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    """
    Get current rate limit status for the authenticated user or IP.
    """
    # Get identifier
    if current_user:
        identifier = f"user:{current_user.id}"
        user_tier = rate_limiter._get_user_tier(current_user.id)
    else:
        client_ip = request.client.host if request.client else "unknown"
        identifier = f"ip:{client_ip}"
        user_tier = "anonymous"
    
    # Get stats for all endpoints
    stats = rate_limiter.get_stats(identifier)
    
    # Get limits for common endpoints
    endpoints = [
        "/api/v1/images",
        "/api/v1/auth/login",
        "/api/v1/auth/register"
    ]
    
    limits = {}
    for endpoint in endpoints:
        endpoint_limits = rate_limiter.get_endpoint_limits(endpoint, user_tier)
        limits[endpoint] = {
            "limit": endpoint_limits["requests"],
            "window": endpoint_limits["window"],
            "window_text": f"{endpoint_limits['window'] // 3600} hour(s)" if endpoint_limits['window'] >= 3600 else f"{endpoint_limits['window'] // 60} minute(s)"
        }
    
    # Add default limits
    default_limits = rate_limiter.get_endpoint_limits("default", user_tier)
    limits["default"] = {
        "limit": default_limits["requests"],
        "window": default_limits["window"],
        "window_text": f"{default_limits['window'] // 3600} hour(s)" if default_limits['window'] >= 3600 else f"{default_limits['window'] // 60} minute(s)"
    }
    
    return {
        "user_tier": user_tier,
        "current_usage": stats,
        "limits": limits,
        "authenticated": current_user is not None
    }


@router.get("/tiers", response_model=Dict[str, Any])
def get_rate_limit_tiers():
    """
    Get information about available rate limit tiers.
    """
    return {
        "tiers": {
            "anonymous": {
                "name": "Anonymous",
                "description": "Default tier for unauthenticated users",
                "limits": {
                    "images_per_hour": 10,
                    "api_calls_per_hour": 100,
                    "login_attempts_per_5min": 5
                }
            },
            "standard": {
                "name": "Standard",
                "description": "Default tier for authenticated users",
                "limits": {
                    "images_per_hour": 100,
                    "api_calls_per_hour": 1000,
                    "login_attempts_per_5min": 10
                }
            },
            "premium": {
                "name": "Premium",
                "description": "Enhanced tier for premium users",
                "limits": {
                    "images_per_hour": 1000,
                    "api_calls_per_hour": 10000,
                    "login_attempts_per_5min": 20
                },
                "features": [
                    "10x higher rate limits",
                    "Priority API access",
                    "Advanced analytics"
                ]
            }
        }
    }