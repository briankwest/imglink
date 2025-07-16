from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import re

from app.api.deps import get_db, get_current_user, get_current_active_user
from app.models.user import User
from app.models.tag import Tag, ImageTag
from app.models.image import Image
from app.schemas.tag import (
    Tag as TagSchema,
    TagCreate,
    PopularTag,
    ImageTagAdd,
    ImageTagRemove,
    TagList
)

router = APIRouter()


def create_slug(name: str) -> str:
    """Create a URL-friendly slug from tag name."""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Remove any characters that aren't alphanumeric or hyphens
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    # Remove leading and trailing hyphens
    slug = slug.strip('-')
    return slug


@router.get("/popular", response_model=List[PopularTag])
def get_popular_tags(
    *,
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100)
) -> Any:
    """
    Get most popular tags by usage count.
    """
    tags = db.query(Tag).filter(
        Tag.usage_count > 0
    ).order_by(
        desc(Tag.usage_count),
        Tag.name
    ).limit(limit).all()
    
    return tags


@router.get("/search", response_model=List[TagSchema])
def search_tags(
    *,
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(10, ge=1, le=50)
) -> Any:
    """
    Search for tags by name. Used for autocomplete.
    """
    q = q.lower().strip()
    
    tags = db.query(Tag).filter(
        Tag.name.ilike(f"%{q}%")
    ).order_by(
        desc(Tag.usage_count),
        Tag.name
    ).limit(limit).all()
    
    return tags


@router.get("/by-slug/{tag_slug}/images", response_model=dict)
def get_images_by_tag(
    *,
    db: Session = Depends(get_db),
    tag_slug: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
) -> Any:
    """
    Get all public images with a specific tag.
    """
    # Find tag by slug
    tag = db.query(Tag).filter(Tag.slug == tag_slug).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Query for public images with this tag
    query = db.query(Image).join(ImageTag).filter(
        ImageTag.tag_id == tag.id,
        Image.privacy == "PUBLIC"
    )
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    images = query.order_by(
        desc(Image.created_at)
    ).offset(skip).limit(limit).all()
    
    # Add tag list to each image
    from app.api.api_v1.endpoints.images import add_tags_to_images
    image_data = add_tags_to_images(db, images)
    
    return {
        "tag": {
            "name": tag.name,
            "slug": tag.slug,
            "usage_count": tag.usage_count
        },
        "images": image_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }