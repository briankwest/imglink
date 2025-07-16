from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    usage_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", backref="created_tags")
    images = relationship("ImageTag", back_populates="tag", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tag(name='{self.name}', usage_count={self.usage_count})>"


class ImageTag(Base):
    __tablename__ = "image_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    image = relationship("Image", backref="tags")
    tag = relationship("Tag", back_populates="images")
    
    # Ensure unique image-tag combinations
    __table_args__ = (
        UniqueConstraint('image_id', 'tag_id', name='_image_tag_uc'),
    )
    
    def __repr__(self):
        return f"<ImageTag(image_id={self.image_id}, tag_id={self.tag_id})>"