from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.image import Image, ImagePrivacy
from app.models.comment import Comment
from app.models.like import Like
from app.schemas.user import User as UserSchema
from app.schemas.image import Image as ImageSchema
from app.services.storage_service import storage_service

router = APIRouter()


def check_admin_permissions(current_user: User) -> None:
    """Check if current user has admin permissions"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions. Admin access required."
        )


@router.get("/stats")
def get_platform_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    check_admin_permissions(current_user)
    
    # Get basic counts
    total_users = db.query(User).count()
    total_images = db.query(Image).count()
    total_public_images = db.query(Image).filter(Image.privacy == ImagePrivacy.PUBLIC).count()
    total_private_images = db.query(Image).filter(Image.privacy == ImagePrivacy.PRIVATE).count()
    total_unlisted_images = db.query(Image).filter(Image.privacy == ImagePrivacy.UNLISTED).count()
    total_comments = db.query(Comment).count()
    total_likes = db.query(Like).count()
    
    # Get top users by image count
    top_uploaders = db.query(
        User.username,
        func.count(Image.id).label('image_count')
    ).join(Image).group_by(User.id, User.username).order_by(
        desc('image_count')
    ).limit(5).all()
    
    # Get recent activity (last 24 hours)
    from datetime import datetime, timedelta
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    recent_users = db.query(User).filter(User.created_at >= yesterday).count()
    recent_images = db.query(Image).filter(Image.created_at >= yesterday).count()
    recent_comments = db.query(Comment).filter(Comment.created_at >= yesterday).count()
    
    return {
        "total_users": total_users,
        "total_images": total_images,
        "total_public_images": total_public_images,
        "total_private_images": total_private_images,
        "total_unlisted_images": total_unlisted_images,
        "total_comments": total_comments,
        "total_likes": total_likes,
        "top_uploaders": [
            {"username": username, "image_count": count} 
            for username, count in top_uploaders
        ],
        "recent_activity": {
            "new_users": recent_users,
            "new_images": recent_images,
            "new_comments": recent_comments
        }
    }


@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    search: str = None,
) -> Any:
    check_admin_permissions(current_user)
    
    query = db.query(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            User.username.ilike(search_term) | 
            User.email.ilike(search_term) |
            User.full_name.ilike(search_term)
        )
    
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.get("/images", response_model=List[ImageSchema])
def get_all_images(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    privacy: ImagePrivacy = None,
) -> Any:
    check_admin_permissions(current_user)
    
    query = db.query(Image)
    
    if privacy:
        query = query.filter(Image.privacy == privacy)
    
    images = query.order_by(Image.created_at.desc()).offset(skip).limit(limit).all()
    
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


@router.delete("/images/{image_id}")
def admin_delete_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    check_admin_permissions(current_user)
    
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete files from MinIO
    try:
        # Delete original image
        storage_service.delete_file(image.filename)
        
        # Delete thumbnails
        import os
        base_name = os.path.splitext(image.filename)[0]
        for size_name in ['small', 'medium', 'large']:
            storage_service.delete_file(f"{base_name}_{size_name}.jpg")
    except Exception as e:
        print(f"Error deleting files from storage: {e}")
        # Continue with database deletion even if file deletion fails
    
    db.delete(image)
    db.commit()
    
    return {"message": "Image deleted successfully"}


@router.put("/users/{user_id}/toggle-active", response_model=UserSchema)
def toggle_user_active_status(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    check_admin_permissions(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    return user


@router.put("/users/{user_id}/toggle-verified", response_model=UserSchema)
def toggle_user_verified_status(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    check_admin_permissions(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = not user.is_verified
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/users/{user_id}")
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    check_admin_permissions(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    if user.is_superuser:
        raise HTTPException(status_code=400, detail="Cannot delete another superuser")
    
    # Delete all user's images from MinIO
    import os
    for image in user.images:
        try:
            # Delete original image
            storage_service.delete_file(image.filename)
            
            # Delete thumbnails
            base_name = os.path.splitext(image.filename)[0]
            for size_name in ['small', 'medium', 'large']:
                storage_service.delete_file(f"{base_name}_{size_name}.jpg")
        except Exception as e:
            print(f"Error deleting files for image {image.id}: {e}")
            # Continue with user deletion even if file deletion fails
    
    # Database cascade will handle deleting related records
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}