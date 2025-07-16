from typing import Optional, List
from pydantic import BaseModel, Field, validator
from datetime import datetime
import re


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    
    @validator('name')
    def validate_tag_name(cls, v):
        # Remove extra whitespace
        v = ' '.join(v.split())
        
        # Check for valid characters (alphanumeric, spaces, hyphens, underscores)
        if not re.match(r'^[\w\s-]+$', v):
            raise ValueError('Tag names can only contain letters, numbers, spaces, hyphens, and underscores')
        
        return v.lower()


class TagCreate(TagBase):
    pass


class TagUpdate(TagBase):
    name: Optional[str] = Field(None, min_length=1, max_length=50)


class Tag(TagBase):
    id: int
    slug: str
    usage_count: int
    created_at: datetime
    created_by: Optional[int]
    
    class Config:
        from_attributes = True


class TagList(BaseModel):
    tags: List[Tag]
    total: int


class ImageTagAdd(BaseModel):
    tag_names: List[str] = Field(..., min_items=1, max_items=10)
    
    @validator('tag_names')
    def validate_tag_names(cls, v):
        # Remove duplicates and clean each tag
        cleaned_tags = []
        seen = set()
        
        for tag in v:
            # Clean the tag
            tag = ' '.join(tag.split()).lower()
            
            # Validate length
            if len(tag) < 1 or len(tag) > 50:
                raise ValueError(f'Tag "{tag}" must be between 1 and 50 characters')
            
            # Check for valid characters
            if not re.match(r'^[\w\s-]+$', tag):
                raise ValueError(f'Tag "{tag}" contains invalid characters')
            
            # Add if not duplicate
            if tag not in seen:
                cleaned_tags.append(tag)
                seen.add(tag)
        
        if not cleaned_tags:
            raise ValueError('At least one valid tag is required')
        
        return cleaned_tags


class ImageTagRemove(BaseModel):
    tag_name: str = Field(..., min_length=1, max_length=50)
    
    @validator('tag_name')
    def validate_tag_name(cls, v):
        return v.lower().strip()


class PopularTag(BaseModel):
    name: str
    slug: str
    usage_count: int
    
    class Config:
        from_attributes = True