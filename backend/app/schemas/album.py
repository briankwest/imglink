from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.album import AlbumPrivacy
from app.schemas.image import Image


class AlbumBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    privacy: AlbumPrivacy = AlbumPrivacy.PUBLIC


class AlbumCreate(AlbumBase):
    image_ids: Optional[List[int]] = []


class AlbumUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    privacy: Optional[AlbumPrivacy] = None
    cover_image_id: Optional[int] = None


class AlbumInDBBase(AlbumBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    cover_image_id: Optional[int]
    delete_hash: str
    views: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class Album(AlbumInDBBase):
    images: List[Image] = []
    image_count: int = 0


class AlbumInDB(AlbumInDBBase):
    pass