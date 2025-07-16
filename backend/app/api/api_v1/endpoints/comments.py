from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, get_current_user_optional
from app.models.user import User
from app.models.image import Image, ImagePrivacy
from app.models.comment import Comment
from app.schemas.comment import Comment as CommentSchema, CommentCreate, CommentUpdate
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/{image_id}/comments", response_model=List[CommentSchema])
def get_image_comments(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_user_optional),
) -> Any:
    # Check if image exists and is accessible
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check privacy permissions
    if image.privacy == ImagePrivacy.PRIVATE:
        if not current_user or image.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="This image is private")
    
    # Get top-level comments (no parent) with their replies
    comments = db.query(Comment).filter(
        Comment.image_id == image_id,
        Comment.parent_id.is_(None)
    ).order_by(Comment.created_at).all()
    
    return comments


@router.post("/{image_id}/comments", response_model=CommentSchema)
def create_comment(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    # Check if image exists and is accessible
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Check privacy permissions
    if image.privacy == ImagePrivacy.PRIVATE and image.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot comment on private image")
    
    # If replying to a comment, validate parent exists
    if comment_in.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_in.parent_id,
            Comment.image_id == image_id
        ).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Create comment
    comment = Comment(
        content=comment_in.content,
        image_id=image_id,
        user_id=current_user.id,
        parent_id=comment_in.parent_id
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Send notifications
    if comment_in.parent_id:
        # This is a reply - notify the parent comment author
        parent_comment = db.query(Comment).filter(Comment.id == comment_in.parent_id).first()
        if parent_comment and parent_comment.user_id != current_user.id:
            NotificationService.notify_reply(
                db,
                parent_comment_author_id=parent_comment.user_id,
                replier=current_user,
                image_id=image.id,
                image_title=image.title or "Untitled",
                reply_preview=comment.content[:100]  # First 100 chars
            )
    else:
        # This is a top-level comment - notify the image owner
        if image.owner_id != current_user.id:
            NotificationService.notify_comment(
                db,
                image_owner_id=image.owner_id,
                commenter=current_user,
                image_id=image.id,
                image_title=image.title or "Untitled",
                comment_preview=comment.content
            )
    
    return comment


@router.put("/comments/{comment_id}", response_model=CommentSchema)
def update_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int,
    comment_in: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    comment.content = comment_in.content
    db.commit()
    db.refresh(comment)
    
    return comment


@router.delete("/comments/{comment_id}")
def delete_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted successfully"}