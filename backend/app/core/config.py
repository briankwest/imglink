from typing import Optional, Dict, Any, Set
from pydantic_settings import BaseSettings
from pydantic import EmailStr, Field, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "ImgLink"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DATABASE_URL: str
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    S3_BUCKET: str
    S3_ENDPOINT: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_REGION: str = "us-east-1"
    
    # Mailgun settings
    MAILGUN_API_KEY: Optional[str] = None
    MAILGUN_DOMAIN: Optional[str] = None
    MAILGUN_FROM_EMAIL: Optional[EmailStr] = None
    MAILGUN_FROM_NAME: str = "ImgLink"
    MAILGUN_API_BASE: str = "https://api.mailgun.net/v3"
    
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
    
    # OAuth Settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    
    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024  # 20MB
    ALLOWED_EXTENSIONS: Optional[str] = ".jpg,.jpeg,.png,.gif,.webp"
    
    @property
    def allowed_extensions_set(self) -> Set[str]:
        if self.ALLOWED_EXTENSIONS:
            return set(ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(','))
        return {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    
    THUMBNAIL_SIZES: Dict[str, tuple[int, int]] = {
        "small": (150, 150),
        "medium": (400, 400),
        "large": (800, 800)
    }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()