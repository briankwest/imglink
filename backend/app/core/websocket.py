"""
WebSocket connection manager for real-time notifications
"""
from typing import Dict, Set, Optional
import json
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications and comments"""
    
    def __init__(self):
        # Dictionary mapping user_id to set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Dictionary mapping room_id to set of user_ids in that room
        self.rooms: Dict[str, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept WebSocket connection and add to active connections"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove WebSocket from active connections"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user entry if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            
            logger.info(f"User {user_id} disconnected")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to all connections of a specific user"""
        if user_id in self.active_connections:
            disconnected = set()
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def broadcast(self, message: dict, exclude_user: Optional[int] = None):
        """Broadcast message to all connected users"""
        for user_id, connections in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
            
            await self.send_personal_message(message, user_id)
    
    def get_online_users(self) -> Set[int]:
        """Get set of currently online user IDs"""
        return set(self.active_connections.keys())
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if a specific user is online"""
        return user_id in self.active_connections
    
    async def join_room(self, room_id: str, user_id: int):
        """Add user to a room"""
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        self.rooms[room_id].add(user_id)
        logger.info(f"User {user_id} joined room {room_id}")
    
    async def leave_room(self, room_id: str, user_id: int):
        """Remove user from a room"""
        if room_id in self.rooms:
            self.rooms[room_id].discard(user_id)
            
            # Remove room if empty
            if not self.rooms[room_id]:
                del self.rooms[room_id]
            
            logger.info(f"User {user_id} left room {room_id}")
    
    async def send_to_room(self, room_id: str, message: dict, exclude_user: Optional[int] = None):
        """Send message to all users in a room"""
        if room_id in self.rooms:
            for user_id in self.rooms[room_id]:
                if exclude_user and user_id == exclude_user:
                    continue
                
                await self.send_personal_message(message, user_id)


# Global connection manager instance
manager = ConnectionManager()