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
    
    # Composite primary key (no id column)
    # User who is following
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, primary_key=True, index=True)
    # User being followed
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, primary_key=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], backref="following_relationships")
    following = relationship("User", foreign_keys=[following_id], backref="follower_relationships")