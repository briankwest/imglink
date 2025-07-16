from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Like(Base):
    __tablename__ = "likes"

    # Composite primary key (no id column)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, primary_key=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="likes")
    image = relationship("Image", back_populates="likes")