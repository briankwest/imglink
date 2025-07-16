"""
WebSocket endpoint for real-time notifications
"""
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import logging

from app.core.config import settings
from app.core.websocket import manager
from app.api.deps import get_db
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_user_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Authenticate WebSocket connection using JWT token from query parameter
    """
    if not token:
        await websocket.close(code=4001, reason="No authentication token provided")
        return None
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username_or_id = payload.get("sub")
        
        if not username_or_id:
            await websocket.close(code=4001, reason="Invalid token")
            return None
        
        # Get user from database - try by username first (for compatibility)
        if isinstance(username_or_id, str) and not username_or_id.isdigit():
            user = db.query(User).filter(User.username == username_or_id).first()
        else:
            # If it's numeric, try by ID
            try:
                user_id = int(username_or_id)
                user = db.query(User).filter(User.id == user_id).first()
            except (ValueError, TypeError):
                user = None
        
        if not user or not user.is_active:
            await websocket.close(code=4001, reason="User not found or inactive")
            return None
        
        return user
        
    except JWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return None


@router.websocket("/ws/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time notifications
    
    Client should connect with: ws://localhost:8000/api/v1/ws/notifications?token=<jwt_token>
    """
    # Authenticate user
    user = await get_current_user_websocket(websocket, websocket.query_params.get("token"), db)
    
    if not user:
        return
    
    # Connect WebSocket
    await manager.connect(websocket, user.id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to notification service",
            "user_id": user.id
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive message from client (e.g., heartbeat, read notifications)
                data = await websocket.receive_json()
                
                # Handle different message types
                if data.get("type") == "heartbeat":
                    await websocket.send_json({"type": "heartbeat", "status": "alive"})
                
                elif data.get("type") == "mark_read":
                    notification_id = data.get("notification_id")
                    # TODO: Mark notification as read in database
                    logger.info(f"User {user.id} marked notification {notification_id} as read")
                
                elif data.get("type") == "get_online_users":
                    # Send list of online users (useful for chat features)
                    online_users = manager.get_online_users()
                    await websocket.send_json({
                        "type": "online_users",
                        "users": list(online_users)
                    })
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in WebSocket connection for user {user.id}: {e}")
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        # Disconnect and cleanup
        manager.disconnect(websocket, user.id)
        logger.info(f"WebSocket disconnected for user {user.id}")


# Helper function to send notifications from other parts of the application
async def send_notification_to_user(user_id: int, notification: dict):
    """
    Send a notification to a specific user if they're online
    
    Args:
        user_id: The user to send notification to
        notification: Dictionary containing notification data
    """
    await manager.send_personal_message(notification, user_id)


async def broadcast_notification(notification: dict, exclude_user: Optional[int] = None):
    """
    Broadcast a notification to all online users
    
    Args:
        notification: Dictionary containing notification data
        exclude_user: Optional user ID to exclude from broadcast
    """
    await manager.broadcast(notification, exclude_user)