from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FollowBase(BaseModel):
    """Base follow schema."""
    pass


class FollowCreate(FollowBase):
    """Schema for creating a follow relationship."""
    following_id: int


class Follow(FollowBase):
    """Schema for follow relationship."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    follower_id: int
    following_id: int
    created_at: datetime


class UserFollowInfo(BaseModel):
    """User info with follow status."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool = False
    is_followed_by: bool = False
    followers_count: int = 0
    following_count: int = 0


class FollowStats(BaseModel):
    """Follow statistics for a user."""
    followers_count: int
    following_count: int
    mutual_follows_count: int