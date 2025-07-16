from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.image import Image, ImagePrivacy
from app.schemas.user import User as UserSchema, UserUpdate
from app.schemas.image import Image as ImageSchema
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
    
    return images