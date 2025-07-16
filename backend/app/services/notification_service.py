"""
Notification service for creating and sending notifications
"""
from typing import Optional
from sqlalchemy.orm import Session
import json
import asyncio

from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.notification import NotificationCreate
# Import moved to avoid circular dependency


class NotificationService:
    """Service for handling notifications"""
    
    @staticmethod
    def create_notification(
        db: Session,
        *,
        user_id: int,
        type: NotificationType,
        title: str,
        message: str,
        related_user_id: Optional[int] = None,
        related_image_id: Optional[int] = None,
        related_album_id: Optional[int] = None,
        data: Optional[dict] = None
    ) -> Notification:
        """Create a notification in the database"""
        
        # Convert data dict to JSON string if provided
        data_str = json.dumps(data) if data else None
        
        # Create notification
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            related_user_id=related_user_id,
            related_image_id=related_image_id,
            related_album_id=related_album_id,
            data=data_str
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Send real-time notification if user is online
        # Note: We'll handle this synchronously for now since we're in a sync context
        try:
            from app.core.websocket import manager
            import asyncio
            
            # Get or create event loop
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None
            
            if loop and loop.is_running():
                # We're in an async context, create task
                asyncio.create_task(NotificationService._send_realtime_notification(notification))
            else:
                # We're in a sync context, run synchronously
                asyncio.run(NotificationService._send_realtime_notification(notification))
        except Exception as e:
            # Don't fail notification creation if real-time delivery fails
            print(f"Failed to send real-time notification: {e}")
        
        return notification
    
    @staticmethod
    async def _send_realtime_notification(notification: Notification):
        """Send notification through WebSocket if user is online"""
        try:
            # Import here to avoid circular dependency
            from app.core.websocket import manager
            
            await manager.send_personal_message(
                {
                    "type": "notification",
                    "id": str(notification.id),
                    "notification_type": notification.type.value,
                    "title": notification.title,
                    "message": notification.message,
                    "timestamp": notification.created_at.isoformat(),
                    "data": json.loads(notification.data) if notification.data else None
                },
                notification.user_id
            )
        except Exception as e:
            # Log error but don't fail the notification creation
            print(f"Failed to send real-time notification: {e}")
    
    @staticmethod
    def notify_comment(
        db: Session,
        *,
        image_owner_id: int,
        commenter: User,
        image_id: int,
        image_title: str,
        comment_preview: str
    ) -> Optional[Notification]:
        """Send notification for new comment"""
        # Don't notify if user is commenting on their own image
        if image_owner_id == commenter.id:
            return None
        
        return NotificationService.create_notification(
            db,
            user_id=image_owner_id,
            type=NotificationType.COMMENT,
            title=f"{commenter.username} commented on your image",
            message=f'"{comment_preview[:50]}{"..." if len(comment_preview) > 50 else ""}"',
            related_user_id=commenter.id,
            related_image_id=image_id,
            data={
                "image_title": image_title,
                "comment_preview": comment_preview
            }
        )
    
    @staticmethod
    def notify_like(
        db: Session,
        *,
        image_owner_id: int,
        liker: User,
        image_id: int,
        image_title: str
    ) -> Optional[Notification]:
        """Send notification for new like"""
        # Don't notify if user is liking their own image
        if image_owner_id == liker.id:
            return None
        
        return NotificationService.create_notification(
            db,
            user_id=image_owner_id,
            type=NotificationType.LIKE,
            title=f"{liker.username} liked your image",
            message=f'Your image "{image_title}" received a new like',
            related_user_id=liker.id,
            related_image_id=image_id,
            data={
                "image_title": image_title
            }
        )
    
    @staticmethod
    def notify_reply(
        db: Session,
        *,
        parent_comment_author_id: int,
        replier: User,
        image_id: int,
        image_title: str,
        reply_preview: str
    ) -> Optional[Notification]:
        """Send notification for comment reply"""
        # Don't notify if user is replying to their own comment
        if parent_comment_author_id == replier.id:
            return None
        
        return NotificationService.create_notification(
            db,
            user_id=parent_comment_author_id,
            type=NotificationType.COMMENT,
            title=f"{replier.username} replied to your comment",
            message=f'"{reply_preview[:50]}{"..." if len(reply_preview) > 50 else ""}"',
            related_user_id=replier.id,
            related_image_id=image_id,
            data={
                "image_title": image_title,
                "reply_preview": reply_preview,
                "is_reply": True
            }
        )
    
    @staticmethod
    def notify_follow(
        db: Session,
        *,
        followed_user_id: int,
        follower: User
    ) -> Notification:
        """Send notification for new follower"""
        return NotificationService.create_notification(
            db,
            user_id=followed_user_id,
            type=NotificationType.FOLLOW,
            title=f"{follower.username} started following you",
            message=f"You have a new follower",
            related_user_id=follower.id
        )
    
    @staticmethod
    def notify_album_shared(
        db: Session,
        *,
        recipient_id: int,
        sharer: User,
        album_id: int,
        album_title: str
    ) -> Notification:
        """Send notification for album shared with user"""
        return NotificationService.create_notification(
            db,
            user_id=recipient_id,
            type=NotificationType.ALBUM_SHARED,
            title=f"{sharer.username} shared an album with you",
            message=f'Album "{album_title}" has been shared with you',
            related_user_id=sharer.id,
            related_album_id=album_id,
            data={
                "album_title": album_title
            }
        )
    
    @staticmethod
    def mark_as_read(
        db: Session,
        *,
        notification_id: int,
        user_id: int
    ) -> Optional[Notification]:
        """Mark a notification as read"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification and not notification.read:
            notification.mark_as_read()
            db.commit()
            db.refresh(notification)
        
        return notification
    
    @staticmethod
    def mark_all_as_read(
        db: Session,
        *,
        user_id: int
    ) -> int:
        """Mark all notifications as read for a user"""
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read == False
        ).update({"read": True, "read_at": db.func.now()})
        
        db.commit()
        return count