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
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="albums")
    images = relationship("AlbumImage", back_populates="album", cascade="all, delete-orphan", order_by="AlbumImage.position")
    cover_image = relationship("Image", foreign_keys=[cover_image_id])


class AlbumImage(Base):
    __tablename__ = "album_images"

    # Composite primary key (no id column)
    album_id = Column(Integer, ForeignKey("albums.id"), nullable=False, primary_key=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False, primary_key=True)
    position = Column(Integer, default=0)
    
    # Relationships
    album = relationship("Album", back_populates="images")
    image = relationship("Image", back_populates="albums")