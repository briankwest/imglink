from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

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




@router.get("/popular", response_model=List[PopularTag])
def get_popular_tags(
    *,
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100)
) -> Any:
    """
    Get most popular tags by usage count.
    """
    # Query tags with usage count using a subquery
    tag_usage = db.query(
        Tag.id,
        Tag.name,
        func.count(ImageTag.image_id).label('usage_count')
    ).outerjoin(ImageTag).group_by(Tag.id, Tag.name).subquery()
    
    # Get tags with usage > 0, ordered by usage count
    popular_tags = db.query(
        tag_usage.c.id,
        tag_usage.c.name,
        tag_usage.c.usage_count
    ).filter(
        tag_usage.c.usage_count > 0
    ).order_by(
        desc(tag_usage.c.usage_count),
        tag_usage.c.name
    ).limit(limit).all()
    
    # Convert to response format
    return [
        {
            "id": tag.id,
            "name": tag.name,
            "usage_count": tag.usage_count
        }
        for tag in popular_tags
    ]


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
    
    # Use a subquery to count usage and order by it
    usage_count_subquery = (
        db.query(func.count(ImageTag.tag_id))
        .filter(ImageTag.tag_id == Tag.id)
        .scalar_subquery()
    )
    
    tags = db.query(Tag).filter(
        Tag.name.ilike(f"%{q}%")
    ).order_by(
        desc(usage_count_subquery),
        Tag.name
    ).limit(limit).all()
    
    return tags


@router.get("/by-name/{tag_name}/images", response_model=dict)
def get_images_by_tag(
    *,
    db: Session = Depends(get_db),
    tag_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
) -> Any:
    """
    Get all public images with a specific tag.
    """
    # Find tag by name
    tag = db.query(Tag).filter(Tag.name == tag_name.lower()).first()
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
            "usage_count": tag.usage_count
        },
        "images": image_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }