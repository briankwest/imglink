from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, get_current_user_optional
from app.models.user import User
from app.models.image import Image, ImagePrivacy
from app.schemas.user import User as UserSchema, UserUpdate
from app.schemas.image import Image as ImageSchema
from app.schemas.follow import UserFollowInfo
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    return current_user


@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.bio is not None:
        current_user.bio = user_in.bio
    if user_in.avatar_url is not None:
        current_user.avatar_url = user_in.avatar_url
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserSchema)
def read_user_by_id(
    *,
    db: Session = Depends(get_db),
    user_id: int,
) -> Any:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/username/{username}", response_model=UserSchema)
def read_user_by_username(
    *,
    db: Session = Depends(get_db),
    username: str,
) -> Any:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/username/{username}/images", response_model=List[ImageSchema])
def read_user_public_images(
    *,
    db: Session = Depends(get_db),
    username: str,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get only public images for public profile
    images = db.query(Image).filter(
        Image.owner_id == user.id,
        Image.privacy == ImagePrivacy.PUBLIC
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


@router.get("/{username}/profile", response_model=UserFollowInfo)
def read_user_profile(
    *,
    db: Session = Depends(get_db),
    username: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    """Get user profile with follow information."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create user follow info
    user_info = UserFollowInfo(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        followers_count=user.followers_count,
        following_count=user.following_count
    )
    
    # Add follow status if authenticated
    if current_user and current_user.id != user.id:
        user_info.is_following = current_user.is_following(user)
        user_info.is_followed_by = user.is_followed_by(current_user)
    
    return user_info