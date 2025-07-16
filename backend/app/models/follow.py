from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Follow(Base):
    """
    Model for user following relationships.
    A user (follower) follows another user (following).
    """
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User who is following
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # User being followed
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], backref="following_relationships")
    following = relationship("User", foreign_keys=[following_id], backref="follower_relationships")
    
    # Ensure a user can't follow the same person twice
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
    )