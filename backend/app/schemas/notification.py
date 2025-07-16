"""
Notification schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    related_user_id: Optional[int] = None
    related_image_id: Optional[int] = None
    related_album_id: Optional[int] = None
    data: Optional[str] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


class NotificationInDBBase(NotificationBase):
    id: int
    user_id: int
    read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Notification(NotificationInDBBase):
    pass


class NotificationInDB(NotificationInDBBase):
    pass