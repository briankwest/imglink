from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
from typing import Dict, Any
import time
from datetime import datetime

from app.api.deps import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def health_check() -> Dict[str, Any]:
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@router.get("/health/detailed")
def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Detailed health check with service dependencies"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {}
    }
    
    overall_healthy = True
    
    # Check database connection
    try:
        start_time = time.time()
        db.execute(text("SELECT 1"))
        db_response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        health_status["services"]["database"] = {
            "status": "healthy",
            "response_time_ms": round(db_response_time, 2)
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # Check Redis connection
    try:
        if hasattr(settings, 'REDIS_URL'):
            start_time = time.time()
            redis_client = redis.from_url(settings.REDIS_URL)
            redis_client.ping()
            redis_response_time = (time.time() - start_time) * 1000
            
            health_status["services"]["redis"] = {
                "status": "healthy",
                "response_time_ms": round(redis_response_time, 2)
            }
        else:
            health_status["services"]["redis"] = {
                "status": "not_configured"
            }
    except Exception as e:
        health_status["services"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        # Redis is optional, so don't mark overall as unhealthy
    
    # Check file system (uploads directory)
    try:
        import os
        uploads_dir = "/app/uploads"
        if os.path.exists(uploads_dir) and os.access(uploads_dir, os.W_OK):
            health_status["services"]["file_system"] = {
                "status": "healthy",
                "uploads_writable": True
            }
        else:
            health_status["services"]["file_system"] = {
                "status": "unhealthy",
                "uploads_writable": False
            }
            overall_healthy = False
    except Exception as e:
        health_status["services"]["file_system"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # Update overall status
    if not overall_healthy:
        health_status["status"] = "unhealthy"
    
    return health_status


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Readiness check for Kubernetes/orchestration"""
    try:
        # Check if we can connect to database
        db.execute(text("SELECT 1"))
        
        # Check if uploads directory exists
        import os
        if not os.path.exists("/app/uploads"):
            raise Exception("Uploads directory not found")
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service not ready: {str(e)}"
        )


@router.get("/live")
def liveness_check() -> Dict[str, Any]:
    """Liveness check for Kubernetes/orchestration"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }