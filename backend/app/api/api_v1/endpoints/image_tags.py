from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import re

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.tag import Tag, ImageTag
from app.models.image import Image
from app.schemas.tag import (
    Tag as TagSchema,
    ImageTagAdd
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


@router.post("/{image_id}/tags", response_model=List[TagSchema])
def add_tags_to_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    tag_data: ImageTagAdd,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Add tags to an image. Creates new tags if they don't exist.
    """
    # Get the image
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check if user owns the image
    if image.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to tag this image")
    
    # Get existing tags for this image
    existing_tags = db.query(Tag).join(ImageTag).filter(
        ImageTag.image_id == image_id
    ).all()
    existing_tag_names = {tag.name for tag in existing_tags}
    
    # Check tag limit (10 tags per image)
    if len(existing_tag_names) + len(tag_data.tag_names) > 10:
        raise HTTPException(
            status_code=400, 
            detail=f"Image can have maximum 10 tags. Currently has {len(existing_tag_names)} tags."
        )
    
    added_tags = []
    
    for tag_name in tag_data.tag_names:
        # Skip if tag already exists on this image
        if tag_name in existing_tag_names:
            continue
        
        # Find or create tag
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(
                name=tag_name,
                slug=create_slug(tag_name),
                usage_count=0,
                created_by=current_user.id
            )
            db.add(tag)
            db.flush()
        
        # Create image-tag association
        image_tag = ImageTag(image_id=image_id, tag_id=tag.id)
        db.add(image_tag)
        
        # Increment usage count
        tag.usage_count += 1
        
        added_tags.append(tag)
    
    db.commit()
    
    # Return all tags for the image
    all_tags = db.query(Tag).join(ImageTag).filter(
        ImageTag.image_id == image_id
    ).all()
    
    return all_tags


@router.delete("/{image_id}/tags/{tag_name}")
def remove_tag_from_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    tag_name: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Remove a tag from an image.
    """
    # Get the image
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check if user owns the image
    if image.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify tags for this image")
    
    # Find the tag
    tag_name = tag_name.lower().strip()
    tag = db.query(Tag).filter(Tag.name == tag_name).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Find and delete the image-tag association
    image_tag = db.query(ImageTag).filter(
        ImageTag.image_id == image_id,
        ImageTag.tag_id == tag.id
    ).first()
    
    if not image_tag:
        raise HTTPException(status_code=404, detail="Tag not found on this image")
    
    db.delete(image_tag)
    
    # Decrement usage count
    tag.usage_count = max(0, tag.usage_count - 1)
    
    # Delete tag if no longer used
    if tag.usage_count == 0:
        db.delete(tag)
    
    db.commit()
    
    return {"message": "Tag removed successfully"}


@router.get("/{image_id}/tags", response_model=List[TagSchema])
def get_image_tags(
    *,
    db: Session = Depends(get_db),
    image_id: int
) -> Any:
    """
    Get all tags for an image.
    """
    # Get the image
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Get tags for the image
    tags = db.query(Tag).join(ImageTag).filter(
        ImageTag.image_id == image_id
    ).order_by(Tag.name).all()
    
    return tags