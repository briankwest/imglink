from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class ImagePrivacy(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    UNLISTED = "unlisted"


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(Text)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    file_size = Column(Integer)
    file_type = Column(String(50))
    width = Column(Integer)
    height = Column(Integer)
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500))
    medium_url = Column(String(500))
    large_url = Column(String(500))
    delete_hash = Column(String(100), unique=True, index=True)
    privacy = Column(Enum(ImagePrivacy), default=ImagePrivacy.PUBLIC)
    views = Column(Integer, default=0)
    is_nsfw = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="images")
    albums = relationship("AlbumImage", back_populates="image", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="image", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="image", cascade="all, delete-orphan")
    
    @property
    def like_count(self):
        return len(self.likes)