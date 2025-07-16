from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    images = relationship("ImageTag", back_populates="tag", cascade="all, delete-orphan")
    
    @property
    def usage_count(self):
        """Calculate usage count from relationships"""
        return len(self.images) if self.images else 0
    
    def __repr__(self):
        return f"<Tag(name='{self.name}', usage_count={self.usage_count})>"


class ImageTag(Base):
    __tablename__ = "image_tags"
    
    # Composite primary key
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    
    # Relationships
    image = relationship("Image", backref="tags")
    tag = relationship("Tag", back_populates="images")
    
    def __repr__(self):
        return f"<ImageTag(image_id={self.image_id}, tag_id={self.tag_id})>"