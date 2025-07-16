from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class AlbumPrivacy(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    UNLISTED = "unlisted"


class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    cover_image_id = Column(Integer, ForeignKey("images.id", ondelete="SET NULL"))
    privacy = Column(Enum(AlbumPrivacy), default=AlbumPrivacy.PUBLIC)
    delete_hash = Column(String(100), unique=True, index=True)
    views = Column(Integer, default=0)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="albums")
    images = relationship("AlbumImage", back_populates="album", cascade="all, delete-orphan", order_by="AlbumImage.position")
    cover_image = relationship("Image", foreign_keys=[cover_image_id])


class AlbumImage(Base):
    __tablename__ = "album_images"

    id = Column(Integer, primary_key=True, index=True)
    album_id = Column(Integer, ForeignKey("albums.id"), nullable=False)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    position = Column(Integer, default=0)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    album = relationship("Album", back_populates="images")
    image = relationship("Image", back_populates="albums")