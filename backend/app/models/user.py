from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import secrets

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    avatar_url = Column(String(500))
    bio = Column(String(500))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    
    # Email verification
    email_verification_token = Column(String(255))
    email_verification_sent_at = Column(DateTime)
    
    # Password reset
    password_reset_token = Column(String(255))
    password_reset_sent_at = Column(DateTime)
    
    # OAuth
    google_id = Column(String(255), unique=True)
    github_id = Column(String(255), unique=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    images = relationship("Image", back_populates="owner", cascade="all, delete-orphan")
    albums = relationship("Album", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user", cascade="all, delete-orphan")
    
    def generate_email_verification_token(self):
        """Generate a new email verification token"""
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_sent_at = datetime.utcnow()
        return self.email_verification_token
    
    def generate_password_reset_token(self):
        """Generate a new password reset token"""
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_sent_at = datetime.utcnow()
        return self.password_reset_token
    
    def is_email_verification_token_valid(self, token: str) -> bool:
        """Check if email verification token is valid and not expired"""
        if not self.email_verification_token or self.email_verification_token != token:
            return False
        if not self.email_verification_sent_at:
            return False
        # Token expires after 24 hours
        return (datetime.utcnow() - self.email_verification_sent_at) < timedelta(hours=24)
    
    def is_password_reset_token_valid(self, token: str) -> bool:
        """Check if password reset token is valid and not expired"""
        if not self.password_reset_token or self.password_reset_token != token:
            return False
        if not self.password_reset_sent_at:
            return False
        # Token expires after 1 hour
        return (datetime.utcnow() - self.password_reset_sent_at) < timedelta(hours=1)
    
    def clear_email_verification_token(self):
        """Clear email verification token after successful verification"""
        self.email_verification_token = None
        self.email_verification_sent_at = None
        self.is_verified = True
    
    def clear_password_reset_token(self):
        """Clear password reset token after successful reset"""
        self.password_reset_token = None
        self.password_reset_sent_at = None