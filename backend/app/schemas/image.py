from typing import Optional, Dict, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.image import ImagePrivacy


class ImageBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    privacy: ImagePrivacy = ImagePrivacy.PUBLIC
    is_nsfw: bool = False


class ImageCreate(ImageBase):
    pass


class ImageUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    privacy: Optional[ImagePrivacy] = None
    is_nsfw: Optional[bool] = None


class ImageInDBBase(ImageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    filename: str
    original_filename: Optional[str]
    file_size: Optional[int]
    file_type: Optional[str]
    width: Optional[int]
    height: Optional[int]
    url: str
    thumbnail_url: Optional[str]
    medium_url: Optional[str]
    large_url: Optional[str]
    delete_hash: str
    views: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    like_count: int = 0


class Image(ImageInDBBase):
    # CDN optimized URLs (computed field)
    optimized_urls: Optional[Dict[str, str]] = None
    # Tags associated with the image
    tags: List[str] = []


class ImageInDB(ImageInDBBase):
    pass