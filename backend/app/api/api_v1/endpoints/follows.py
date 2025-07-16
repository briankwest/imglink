"""
User following/followers API endpoints.
"""
from typing import List, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.api import deps
from app.models.user import User
from app.models.follow import Follow
from app.models.notification import Notification, NotificationType
from app.schemas.follow import UserFollowInfo, FollowStats
from app.schemas.user import User as UserSchema
from app.schemas.image import Image as ImageSchema
from app.models.image import Image, ImagePrivacy

router = APIRouter()


@router.post("/{user_id}/follow", response_model=dict)
def follow_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Follow a user.
    """
    # Check if user exists
    user_to_follow = db.query(User).filter(User.id == user_id).first()
    if not user_to_follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Can't follow yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )
    
    # Check if already following
    existing_follow = db.query(Follow).filter(
        and_(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id
        )
    ).first()
    
    if existing_follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already following this user"
        )
    
    # Create follow relationship
    follow = Follow(
        follower_id=current_user.id,
        following_id=user_id
    )
    db.add(follow)
    
    # Create notification for the followed user
    notification = Notification(
        user_id=user_id,
        type=NotificationType.FOLLOW,
        title="New Follower",
        message=f"{current_user.username} started following you",
        related_user_id=current_user.id,
        data=json.dumps({
            "follower_id": current_user.id,
            "follower_username": current_user.username,
            "follower_avatar": current_user.avatar_url
        })
    )
    db.add(notification)
    
    db.commit()
    
    return {"message": "Successfully followed user"}


@router.delete("/{user_id}/unfollow", response_model=dict)
def unfollow_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Unfollow a user.
    """
    # Find follow relationship
    follow = db.query(Follow).filter(
        and_(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id
        )
    ).first()
    
    if not follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not following this user"
        )
    
    db.delete(follow)
    db.commit()
    
    return {"message": "Successfully unfollowed user"}


@router.get("/{user_id}/followers", response_model=List[UserFollowInfo])
def get_followers(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    """
    Get followers of a user.
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get followers
    followers_query = db.query(User).join(
        Follow, Follow.follower_id == User.id
    ).filter(Follow.following_id == user_id)
    
    followers = followers_query.offset(skip).limit(limit).all()
    
    # Add follow status if authenticated
    result = []
    for follower in followers:
        follower_info = UserFollowInfo(
            id=follower.id,
            username=follower.username,
            full_name=follower.full_name,
            avatar_url=follower.avatar_url,
            bio=follower.bio,
            followers_count=follower.followers_count,
            following_count=follower.following_count
        )
        
        if current_user:
            follower_info.is_following = current_user.is_following(follower)
            follower_info.is_followed_by = current_user.is_followed_by(follower)
        
        result.append(follower_info)
    
    return result


@router.get("/{user_id}/following", response_model=List[UserFollowInfo])
def get_following(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    """
    Get users that a user is following.
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get following
    following_query = db.query(User).join(
        Follow, Follow.following_id == User.id
    ).filter(Follow.follower_id == user_id)
    
    following = following_query.offset(skip).limit(limit).all()
    
    # Add follow status if authenticated
    result = []
    for followed_user in following:
        user_info = UserFollowInfo(
            id=followed_user.id,
            username=followed_user.username,
            full_name=followed_user.full_name,
            avatar_url=followed_user.avatar_url,
            bio=followed_user.bio,
            followers_count=followed_user.followers_count,
            following_count=followed_user.following_count
        )
        
        if current_user:
            user_info.is_following = current_user.is_following(followed_user)
            user_info.is_followed_by = current_user.is_followed_by(followed_user)
        
        result.append(user_info)
    
    return result


@router.get("/{user_id}/follow-stats", response_model=FollowStats)
def get_follow_stats(
    user_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Get follow statistics for a user.
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get counts
    followers_count = db.query(func.count(Follow.id)).filter(
        Follow.following_id == user_id
    ).scalar() or 0
    
    following_count = db.query(func.count(Follow.id)).filter(
        Follow.follower_id == user_id
    ).scalar() or 0
    
    # Get mutual follows (users who follow each other)
    mutual_query = db.query(func.count(Follow.id)).filter(
        Follow.follower_id == user_id
    ).filter(
        Follow.following_id.in_(
            db.query(Follow.follower_id).filter(Follow.following_id == user_id)
        )
    )
    mutual_follows_count = mutual_query.scalar() or 0
    
    return FollowStats(
        followers_count=followers_count,
        following_count=following_count,
        mutual_follows_count=mutual_follows_count
    )


@router.get("/activity/feed", response_model=List[ImageSchema])
def get_activity_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get activity feed showing images from followed users.
    """
    # Get IDs of users that current user follows
    following_ids = db.query(Follow.following_id).filter(
        Follow.follower_id == current_user.id
    ).subquery()
    
    # Get recent images from followed users (plus own images)
    images = db.query(Image).filter(
        and_(
            Image.privacy == ImagePrivacy.PUBLIC,
            or_(
                Image.owner_id.in_(following_ids),
                Image.owner_id == current_user.id
            )
        )
    ).order_by(Image.created_at.desc()).offset(skip).limit(limit).all()
    
    # Build response data with proper tag serialization
    result = []
    for image in images:
        # Convert ImageTag objects to tag names
        tag_names = [tag.tag.name for tag in image.tags] if hasattr(image, 'tags') else []
        
        # Create image dict with proper tags
        image_dict = {
            "id": image.id,
            "title": image.title,
            "description": image.description,
            "filename": image.filename,
            "original_filename": image.original_filename,
            "file_size": image.file_size,
            "file_type": image.file_type,
            "width": image.width,
            "height": image.height,
            "url": image.url,
            "thumbnail_url": image.thumbnail_url,
            "medium_url": image.medium_url,
            "large_url": image.large_url,
            "delete_hash": image.delete_hash,
            "privacy": image.privacy,
            "views": image.views,
            "is_nsfw": image.is_nsfw,
            "owner_id": image.owner_id,
            "created_at": image.created_at,
            "updated_at": image.updated_at,
            "like_count": image.like_count,
            "tags": tag_names
        }
        result.append(image_dict)
    
    return result


