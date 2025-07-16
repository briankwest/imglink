from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


class CommentAuthor(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class Comment(CommentBase):
    id: int
    image_id: int
    user_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    author: CommentAuthor
    replies: List["Comment"] = []

    class Config:
        from_attributes = True


# Update forward reference
Comment.model_rebuild()