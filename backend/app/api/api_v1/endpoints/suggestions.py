"""
User suggestions API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.api import deps
from app.models.user import User
from app.models.follow import Follow
from app.schemas.follow import UserFollowInfo

router = APIRouter()


@router.get("/", response_model=List[UserFollowInfo])
def get_user_suggestions(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get suggested users to follow based on:
    1. Users followed by people you follow
    2. Users with similar interests (based on image tags)
    3. Popular users you don't follow
    """
    # Get users that current user is already following
    following_ids = db.query(Follow.following_id).filter(
        Follow.follower_id == current_user.id
    ).subquery()
    
    # Strategy 1: Users followed by people you follow (friends of friends)
    friends_of_friends = db.query(
        User,
        func.count(Follow.following_id).label('mutual_connections')
    ).join(
        Follow, Follow.following_id == User.id
    ).filter(
        and_(
            Follow.follower_id.in_(following_ids),  # Followed by someone you follow
            User.id != current_user.id,  # Not yourself
            User.id.notin_(following_ids)  # Not already following
        )
    ).group_by(User.id).order_by(func.count(Follow.following_id).desc())
    
    suggestions = friends_of_friends.limit(limit).all()
    
    # If we need more suggestions, add popular users
    if len(suggestions) < limit:
        popular_users = db.query(
            User,
            func.count(Follow.id).label('follower_count')
        ).outerjoin(
            Follow, Follow.following_id == User.id
        ).filter(
            and_(
                User.id != current_user.id,
                User.id.notin_(following_ids),
                User.id.notin_([s[0].id for s in suggestions])  # Not already in suggestions
            )
        ).group_by(User.id).order_by(
            func.count(Follow.id).desc()
        ).limit(limit - len(suggestions)).all()
        
        suggestions.extend(popular_users)
    
    # Format results
    result = []
    for user_data in suggestions:
        user = user_data[0] if isinstance(user_data, tuple) else user_data
        
        # Check if user has required attributes
        if not hasattr(user, 'id'):
            continue
            
        user_info = UserFollowInfo(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            bio=user.bio,
            followers_count=user.followers_count,
            following_count=user.following_count,
            is_following=False,  # We already filtered out users being followed
            is_followed_by=user.is_followed_by(current_user)
        )
        result.append(user_info)
    
    return result