"""
Activity feed API endpoints.
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, func

from app.api import deps
from app.models.user import User
from app.models.image import Image
from app.models.follow import Follow
from app.models.album import Album
from app.models.like import Like
from app.schemas.image import Image as ImageSchema

router = APIRouter()


@router.get("/", response_model=List[ImageSchema])
def get_activity_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get activity feed showing images from users you follow.
    
    Returns recent images from followed users, ordered by upload time.
    """
    # Get list of user IDs that current user follows
    following_ids = db.query(Follow.following_id).filter(
        Follow.follower_id == current_user.id
    ).subquery()
    
    # Calculate date threshold
    date_threshold = datetime.utcnow() - timedelta(days=days)
    
    # Query images from followed users
    images = db.query(Image).options(
        joinedload(Image.owner),
        joinedload(Image.likes),
        joinedload(Image.comments),
        joinedload(Image.tags)
    ).filter(
        and_(
            Image.owner_id.in_(following_ids),
            Image.privacy == "PUBLIC",
            Image.created_at >= date_threshold
        )
    ).order_by(desc(Image.created_at)).offset(skip).limit(limit).all()
    
    return images


@router.get("/explore", response_model=List[ImageSchema])
def get_explore_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    """
    Get explore feed showing popular images from users you don't follow.
    
    Returns trending images based on recent likes and views.
    """
    # Base query for public images
    query = db.query(Image).options(
        joinedload(Image.owner),
        joinedload(Image.likes),
        joinedload(Image.comments),
        joinedload(Image.tags)
    ).filter(Image.privacy == "PUBLIC")
    
    # If authenticated, exclude images from users already being followed
    if current_user:
        following_ids = db.query(Follow.following_id).filter(
            Follow.follower_id == current_user.id
        ).subquery()
        
        query = query.filter(
            and_(
                Image.owner_id != current_user.id,  # Not own images
                Image.owner_id.notin_(following_ids)  # Not from followed users
            )
        )
    
    # Order by popularity (combination of likes and views)
    # This is a simple algorithm - could be improved with time decay
    images = query.outerjoin(
        Like, Like.image_id == Image.id
    ).group_by(Image.id).order_by(
        desc(func.count(Like.image_id) + Image.views / 10)
    ).offset(skip).limit(limit).all()
    
    return images


@router.get("/mixed", response_model=List[ImageSchema])
def get_mixed_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    following_ratio: float = Query(0.7, ge=0, le=1, description="Ratio of following vs explore content"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get a mixed feed combining followed users' content and explore content.
    
    The following_ratio parameter controls the mix:
    - 1.0 = 100% from followed users
    - 0.7 = 70% from followed users, 30% explore
    - 0.0 = 100% explore content
    """
    following_limit = int(limit * following_ratio)
    explore_limit = limit - following_limit
    
    # Get following feed items
    following_ids = db.query(Follow.following_id).filter(
        Follow.follower_id == current_user.id
    ).subquery()
    
    following_images = []
    if following_limit > 0:
        following_images = db.query(Image).options(
            joinedload(Image.owner),
            joinedload(Image.likes),
            joinedload(Image.comments),
            joinedload(Image.tags)
        ).filter(
            and_(
                Image.owner_id.in_(following_ids),
                Image.privacy == "PUBLIC"
            )
        ).order_by(desc(Image.created_at)).offset(skip).limit(following_limit).all()
    
    # Get explore feed items
    explore_images = []
    if explore_limit > 0:
        explore_query = db.query(Image).options(
            joinedload(Image.owner),
            joinedload(Image.likes),
            joinedload(Image.comments),
            joinedload(Image.tags)
        ).filter(
            and_(
                Image.privacy == "PUBLIC",
                Image.owner_id != current_user.id,
                Image.owner_id.notin_(following_ids)
            )
        )
        
        # Avoid duplicates
        if following_images:
            existing_ids = [img.id for img in following_images]
            explore_query = explore_query.filter(Image.id.notin_(existing_ids))
        
        # Join with likes to get count and order by popularity
        explore_images = explore_query.outerjoin(
            Like, Like.image_id == Image.id
        ).group_by(Image.id).order_by(
            desc(func.count(Like.image_id) + Image.views / 10)
        ).limit(explore_limit).all()
    
    # Combine and sort by created_at
    all_images = following_images + explore_images
    all_images.sort(key=lambda x: x.created_at, reverse=True)
    
    return all_images