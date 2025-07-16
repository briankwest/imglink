from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
import os
import uuid
from PIL import Image as PILImage
import io
from datetime import datetime, timedelta

from app.api.deps import get_current_active_user, get_db, get_current_user_optional
from app.core.config import settings
from app.models.user import User
from app.models.image import Image, ImagePrivacy
from app.models.like import Like
from app.schemas.image import Image as ImageSchema, ImageCreate, ImageUpdate
from app.services.image_processing import image_service
from app.services.cache import cache_result, invalidate_cache
from app.services.notification_service import NotificationService
from app.models.tag import Tag, ImageTag

router = APIRouter()


def add_tags_to_images(db: Session, images: List[Image]) -> List[dict]:
    """Add tags to image objects for API response."""
    image_dicts = []
    
    for image in images:
        # Get tags for this image
        tags = db.query(Tag.name).join(ImageTag).filter(
            ImageTag.image_id == image.id
        ).all()
        
        # Convert image to dict and add tags
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
            "tags": [tag[0] for tag in tags]
        }
        image_dicts.append(image_dict)
    
    return image_dicts


def process_upload_file(upload_file: UploadFile, user_id: int) -> dict:
    # Validate file extension
    file_ext = os.path.splitext(upload_file.filename)[1].lower()
    if file_ext not in settings.allowed_extensions_set:
        raise HTTPException(status_code=400, detail=f"File type {file_ext} not allowed")
    
    # Generate unique filename
    unique_filename = f"{user_id}_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    
    # Save original file
    with open(file_path, "wb") as buffer:
        buffer.write(upload_file.file.read())
    
    # Validate the uploaded image
    is_valid, error_message = image_service.validate_image(file_path)
    if not is_valid:
        # Clean up the uploaded file
        try:
            os.remove(file_path)
        except:
            pass
        raise HTTPException(status_code=400, detail=error_message)
    
    # Extract metadata
    metadata = image_service.extract_metadata(file_path)
    
    # Process image (generate thumbnails and optimized versions)
    generated_files = image_service.process_image(file_path, unique_filename)
    
    # Build result dictionary
    result = {
        "filename": unique_filename,
        "original_filename": upload_file.filename,
        "file_size": os.path.getsize(file_path),
        "file_type": upload_file.content_type,
        "width": metadata.get('width', 0),
        "height": metadata.get('height', 0),
        "url": f"/uploads/{unique_filename}",
    }
    
    # Set thumbnail URLs with fallbacks (don't add raw generated_files to avoid invalid fields)
    result["thumbnail_url"] = generated_files.get("small_url", f"/uploads/{unique_filename}")
    result["medium_url"] = generated_files.get("medium_url", f"/uploads/{unique_filename}")
    result["large_url"] = generated_files.get("large_url", generated_files.get("optimized_url", f"/uploads/{unique_filename}"))
    
    return result


@router.post("/", response_model=ImageSchema)
async def upload_image(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    file: UploadFile = File(...),
    title: str = Form(None),
    description: str = Form(None),
    privacy: ImagePrivacy = Form(ImagePrivacy.PUBLIC),
    is_nsfw: bool = Form(False),
) -> Any:
    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Process file and get info
    file_info = process_upload_file(file, current_user.id)
    
    # Create database entry
    db_image = Image(
        title=title,
        description=description,
        privacy=privacy,
        is_nsfw=is_nsfw,
        owner_id=current_user.id,
        delete_hash=str(uuid.uuid4()),
        **file_info
    )
    
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    
    # Invalidate public images cache when new image is uploaded
    invalidate_cache("public_images")
    
    # Add empty tags array for new image
    result = add_tags_to_images(db, [db_image])
    return result[0] if result else db_image


@router.get("/", response_model=List[ImageSchema])
@cache_result(ttl=300, key_prefix="public_images")  # Cache for 5 minutes
def read_images(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search term for title and description"),
    sort_by: str = Query("created_at", description="Sort by field (created_at, views, like_count)"),
    order: str = Query("desc", description="Sort order (asc, desc)"),
    file_type: Optional[str] = Query(None, description="Filter by file type (e.g., image/jpeg, image/png)"),
    is_nsfw: Optional[bool] = Query(None, description="Filter by NSFW status"),
    min_views: Optional[int] = Query(None, description="Minimum number of views"),
    max_views: Optional[int] = Query(None, description="Maximum number of views"),
    min_likes: Optional[int] = Query(None, description="Minimum number of likes"),
    max_likes: Optional[int] = Query(None, description="Maximum number of likes"),
    date_from: Optional[str] = Query(None, description="Filter images from this date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter images to this date (YYYY-MM-DD)"),
    min_width: Optional[int] = Query(None, description="Minimum image width"),
    min_height: Optional[int] = Query(None, description="Minimum image height"),
    aspect_ratio: Optional[str] = Query(None, description="Aspect ratio filter (square, landscape, portrait)"),
) -> Any:
    """
    Get public images with advanced filtering and search capabilities.
    
    Supports full-text search, filtering by various image properties,
    and multiple sorting options.
    """
    query = db.query(Image).filter(Image.privacy == ImagePrivacy.PUBLIC)
    
    # Full-text search using PostgreSQL's GIN index
    if search:
        # Use full-text search with PostgreSQL's to_tsvector
        search_query = text("""
            to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')) 
            @@ plainto_tsquery('english', :search)
        """)
        query = query.filter(search_query.params(search=search))
    
    # File type filter
    if file_type:
        query = query.filter(Image.file_type == file_type)
    
    # NSFW filter
    if is_nsfw is not None:
        query = query.filter(Image.is_nsfw == is_nsfw)
    
    # Views filter
    if min_views is not None:
        query = query.filter(Image.views >= min_views)
    if max_views is not None:
        query = query.filter(Image.views <= max_views)
    
    # Likes filter (using subquery for like_count)
    if min_likes is not None or max_likes is not None:
        from app.models.like import Like
        like_count_subquery = (
            db.query(Like.image_id, db.func.count(Like.id).label('like_count'))
            .group_by(Like.image_id)
            .subquery()
        )
        query = query.outerjoin(like_count_subquery, Image.id == like_count_subquery.c.image_id)
        
        if min_likes is not None:
            query = query.filter(db.func.coalesce(like_count_subquery.c.like_count, 0) >= min_likes)
        if max_likes is not None:
            query = query.filter(db.func.coalesce(like_count_subquery.c.like_count, 0) <= max_likes)
    
    # Date filters
    if date_from:
        try:
            date_from_parsed = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Image.created_at >= date_from_parsed)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD")
    
    if date_to:
        try:
            date_to_parsed = datetime.strptime(date_to, "%Y-%m-%d")
            # Add 1 day to include the entire day
            date_to_end = date_to_parsed + timedelta(days=1)
            query = query.filter(Image.created_at < date_to_end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD")
    
    # Dimension filters
    if min_width is not None:
        query = query.filter(Image.width >= min_width)
    if min_height is not None:
        query = query.filter(Image.height >= min_height)
    
    # Aspect ratio filter
    if aspect_ratio:
        if aspect_ratio == "square":
            # Square images (aspect ratio between 0.9 and 1.1)
            query = query.filter(
                and_(
                    Image.width.isnot(None),
                    Image.height.isnot(None),
                    Image.height > 0,
                    (Image.width.cast(db.Float) / Image.height.cast(db.Float)) >= 0.9,
                    (Image.width.cast(db.Float) / Image.height.cast(db.Float)) <= 1.1
                )
            )
        elif aspect_ratio == "landscape":
            # Landscape images (width > height)
            query = query.filter(
                and_(
                    Image.width.isnot(None),
                    Image.height.isnot(None),
                    Image.width > Image.height
                )
            )
        elif aspect_ratio == "portrait":
            # Portrait images (height > width)
            query = query.filter(
                and_(
                    Image.width.isnot(None),
                    Image.height.isnot(None),
                    Image.height > Image.width
                )
            )
    
    # Sorting
    if sort_by == "views":
        if order == "asc":
            query = query.order_by(Image.views.asc())
        else:
            query = query.order_by(Image.views.desc())
    elif sort_by == "like_count":
        # Sort by like count using subquery
        from app.models.like import Like
        like_count_subquery = (
            db.query(Like.image_id, db.func.count(Like.id).label('like_count'))
            .group_by(Like.image_id)
            .subquery()
        )
        query = query.outerjoin(like_count_subquery, Image.id == like_count_subquery.c.image_id)
        if order == "asc":
            query = query.order_by(db.func.coalesce(like_count_subquery.c.like_count, 0).asc())
        else:
            query = query.order_by(db.func.coalesce(like_count_subquery.c.like_count, 0).desc())
    elif sort_by == "created_at":
        if order == "asc":
            query = query.order_by(Image.created_at.asc())
        else:
            query = query.order_by(Image.created_at.desc())
    else:
        # Default: created_at desc
        query = query.order_by(Image.created_at.desc())
    
    # Apply pagination
    images = query.offset(skip).limit(limit).all()
    
    # Add tags to images
    return add_tags_to_images(db, images)


@router.get("/me", response_model=List[ImageSchema])
def read_user_images(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    images = db.query(Image).filter(
        Image.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Add tags to images
    return add_tags_to_images(db, images)


@router.get("/{image_id}", response_model=ImageSchema)
def read_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Any:
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check privacy permissions
    if image.privacy == ImagePrivacy.PRIVATE:
        if not current_user or image.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="This image is private")
    
    # Increment views (only for non-owners to avoid inflating view counts)
    if not current_user or current_user.id != image.owner_id:
        image.views += 1
        db.commit()
    
    # Add tags to image
    result = add_tags_to_images(db, [image])
    return result[0] if result else image


@router.put("/{image_id}", response_model=ImageSchema)
def update_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    image_in: ImageUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if image_in.title is not None:
        image.title = image_in.title
    if image_in.description is not None:
        image.description = image_in.description
    if image_in.privacy is not None:
        image.privacy = image_in.privacy
    if image_in.is_nsfw is not None:
        image.is_nsfw = image_in.is_nsfw
    
    db.commit()
    db.refresh(image)
    
    # Add tags to image
    result = add_tags_to_images(db, [image])
    return result[0] if result else image


@router.delete("/{image_id}")
def delete_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete file from disk
    try:
        os.remove(os.path.join("uploads", image.filename))
    except:
        pass
    
    db.delete(image)
    db.commit()
    
    return {"message": "Image deleted successfully"}


@router.post("/{image_id}/like")
def like_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    # Check if image exists and is accessible
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check privacy permissions
    if image.privacy == ImagePrivacy.PRIVATE and image.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="This image is private")
    
    # Check if already liked
    existing_like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.image_id == image_id
    ).first()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Image already liked")
    
    # Create like
    like = Like(user_id=current_user.id, image_id=image_id)
    db.add(like)
    db.commit()
    
    # Send notification to image owner if it's not the liker
    if image.owner_id != current_user.id:
        NotificationService.notify_like(
            db,
            image_owner_id=image.owner_id,
            liker=current_user,
            image_id=image.id,
            image_title=image.title or "Untitled"
        )
    
    return {"message": "Image liked successfully"}


@router.delete("/{image_id}/like")
def unlike_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    # Check if image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Find like
    like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.image_id == image_id
    ).first()
    
    if not like:
        raise HTTPException(status_code=400, detail="Image not liked")
    
    # Remove like
    db.delete(like)
    db.commit()
    
    return {"message": "Image unliked successfully"}


@router.get("/{image_id}/liked")
def check_if_liked(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.image_id == image_id
    ).first()
    
    return {"liked": like is not None}