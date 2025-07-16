from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, users, images, albums, comments, admin, health, websocket, notifications, search, tags, image_tags

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(image_tags.router, prefix="/images", tags=["image-tags"])
api_router.include_router(albums.router, prefix="/albums", tags=["albums"])
api_router.include_router(comments.router, prefix="/images", tags=["comments"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(websocket.router, tags=["websocket"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])