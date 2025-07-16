from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.album import Album, AlbumPrivacy, AlbumImage
from app.models.image import Image
from app.schemas.album import Album as AlbumSchema, AlbumCreate, AlbumUpdate

router = APIRouter()


@router.post("/", response_model=AlbumSchema)
def create_album(
    *,
    db: Session = Depends(get_db),
    album_in: AlbumCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    # Create album
    db_album = Album(
        title=album_in.title,
        description=album_in.description,
        privacy=album_in.privacy,
        owner_id=current_user.id,
        delete_hash=str(uuid.uuid4()),
    )
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    
    # Add images to album
    for position, image_id in enumerate(album_in.image_ids):
        image = db.query(Image).filter(
            Image.id == image_id,
            Image.owner_id == current_user.id
        ).first()
        if image:
            album_image = AlbumImage(
                album_id=db_album.id,
                image_id=image.id,
                position=position
            )
            db.add(album_image)
    
    db.commit()
    db.refresh(db_album)
    
    # Build response without modifying the model
    images = [ai.image for ai in db_album.images]
    album_response = {
        "id": db_album.id,
        "title": db_album.title,
        "description": db_album.description,
        "privacy": db_album.privacy,
        "cover_image_id": db_album.cover_image_id,
        "delete_hash": db_album.delete_hash,
        "views": db_album.views,
        "owner_id": db_album.owner_id,
        "created_at": db_album.created_at,
        "updated_at": db_album.updated_at,
        "images": images,
        "image_count": len(images),
    }
    
    return album_response


@router.get("/", response_model=List[AlbumSchema])
def read_albums(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    albums = db.query(Album).filter(
        Album.privacy == AlbumPrivacy.PUBLIC
    ).offset(skip).limit(limit).all()
    
    # Build response data without modifying the model objects
    album_responses = []
    for album in albums:
        preview_images = [ai.image for ai in album.images[:4]]  # Preview images
        album_data = {
            "id": album.id,
            "title": album.title,
            "description": album.description,
            "privacy": album.privacy,
            "cover_image_id": album.cover_image_id,
            "delete_hash": album.delete_hash,
            "views": album.views,
            "owner_id": album.owner_id,
            "created_at": album.created_at,
            "updated_at": album.updated_at,
            "images": preview_images,
            "image_count": len(album.images),
        }
        album_responses.append(album_data)
    
    return album_responses


@router.get("/me", response_model=List[AlbumSchema])
def read_user_albums(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    albums = db.query(Album).filter(
        Album.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Build response data without modifying the model objects
    album_responses = []
    for album in albums:
        preview_images = [ai.image for ai in album.images[:4]]  # Preview images
        album_data = {
            "id": album.id,
            "title": album.title,
            "description": album.description,
            "privacy": album.privacy,
            "cover_image_id": album.cover_image_id,
            "delete_hash": album.delete_hash,
            "views": album.views,
            "owner_id": album.owner_id,
            "created_at": album.created_at,
            "updated_at": album.updated_at,
            "images": preview_images,
            "image_count": len(album.images),
        }
        album_responses.append(album_data)
    
    return album_responses


@router.get("/{album_id}", response_model=AlbumSchema)
def read_album(
    *,
    db: Session = Depends(get_db),
    album_id: int,
) -> Any:
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    # Check privacy
    if album.privacy == AlbumPrivacy.PRIVATE:
        raise HTTPException(status_code=403, detail="This album is private")
    
    # Increment views
    album.views += 1
    db.commit()
    db.refresh(album)
    
    # Build response without modifying the model
    images = [ai.image for ai in album.images]
    album_response = {
        "id": album.id,
        "title": album.title,
        "description": album.description,
        "privacy": album.privacy,
        "cover_image_id": album.cover_image_id,
        "delete_hash": album.delete_hash,
        "views": album.views,
        "owner_id": album.owner_id,
        "created_at": album.created_at,
        "updated_at": album.updated_at,
        "images": images,
        "image_count": len(images),
    }
    
    return album_response


@router.put("/{album_id}", response_model=AlbumSchema)
def update_album(
    *,
    db: Session = Depends(get_db),
    album_id: int,
    album_in: AlbumUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    if album.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if album_in.title is not None:
        album.title = album_in.title
    if album_in.description is not None:
        album.description = album_in.description
    if album_in.privacy is not None:
        album.privacy = album_in.privacy
    if album_in.cover_image_id is not None:
        # Verify the image belongs to the user
        image = db.query(Image).filter(
            Image.id == album_in.cover_image_id,
            Image.owner_id == current_user.id
        ).first()
        if image:
            album.cover_image_id = album_in.cover_image_id
    
    db.commit()
    db.refresh(album)
    
    # Build response without modifying the model
    images = [ai.image for ai in album.images]
    album_response = {
        "id": album.id,
        "title": album.title,
        "description": album.description,
        "privacy": album.privacy,
        "cover_image_id": album.cover_image_id,
        "delete_hash": album.delete_hash,
        "views": album.views,
        "owner_id": album.owner_id,
        "created_at": album.created_at,
        "updated_at": album.updated_at,
        "images": images,
        "image_count": len(images),
    }
    
    return album_response


@router.post("/{album_id}/images/{image_id}")
def add_image_to_album(
    *,
    db: Session = Depends(get_db),
    album_id: int,
    image_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    album = db.query(Album).filter(
        Album.id == album_id,
        Album.owner_id == current_user.id
    ).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    image = db.query(Image).filter(
        Image.id == image_id,
        Image.owner_id == current_user.id
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check if image already in album
    existing = db.query(AlbumImage).filter(
        AlbumImage.album_id == album_id,
        AlbumImage.image_id == image_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Image already in album")
    
    # Get next position
    max_position = db.query(AlbumImage).filter(
        AlbumImage.album_id == album_id
    ).count()
    
    album_image = AlbumImage(
        album_id=album_id,
        image_id=image_id,
        position=max_position
    )
    db.add(album_image)
    db.commit()
    
    return {"message": "Image added to album"}


@router.delete("/{album_id}/images/{image_id}")
def remove_image_from_album(
    *,
    db: Session = Depends(get_db),
    album_id: int,
    image_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    album = db.query(Album).filter(
        Album.id == album_id,
        Album.owner_id == current_user.id
    ).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    album_image = db.query(AlbumImage).filter(
        AlbumImage.album_id == album_id,
        AlbumImage.image_id == image_id
    ).first()
    if not album_image:
        raise HTTPException(status_code=404, detail="Image not in album")
    
    db.delete(album_image)
    db.commit()
    
    return {"message": "Image removed from album"}


@router.delete("/{album_id}")
def delete_album(
    *,
    db: Session = Depends(get_db),
    album_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    if album.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(album)
    db.commit()
    
    return {"message": "Album deleted successfully"}