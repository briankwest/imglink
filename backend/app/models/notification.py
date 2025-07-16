"""
Notification model for real-time notifications
"""
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base

if TYPE_CHECKING:
    from .user import User  # noqa: F401


class NotificationType(str, enum.Enum):
    COMMENT = "comment"
    LIKE = "like"
    FOLLOW = "follow"
    MENTION = "mention"
    SYSTEM = "system"
    IMAGE_SHARED = "image_shared"
    ALBUM_SHARED = "album_shared"


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Recipient of the notification
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Type of notification
    type = Column(SQLEnum(NotificationType), nullable=False)
    
    # Notification content
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Related entities (optional, depends on notification type)
    # For likes/comments: related_image_id
    # For follows: related_user_id
    # For album shares: related_album_id
    related_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    related_image_id = Column(Integer, ForeignKey("images.id", ondelete="SET NULL"), nullable=True)
    related_album_id = Column(Integer, ForeignKey("albums.id", ondelete="SET NULL"), nullable=True)
    
    # Notification state
    read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Additional data (JSON field for flexibility)
    # Can store things like comment text preview, etc.
    data = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    related_user = relationship("User", foreign_keys=[related_user_id])
    related_image = relationship("Image", foreign_keys=[related_image_id])
    related_album = relationship("Album", foreign_keys=[related_album_id])
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.read = True
        self.read_at = datetime.utcnow()
    
    def __repr__(self):
        return f"<Notification {self.id}: {self.type} for user {self.user_id}>"